import pool from '../config/db.js';
import { gradeAssessment } from '../services/ai.service.js';

// ─── GET /api/public/assessment/:token ───────────────────────────────────────
// Candidate opens their test link — fetch questions (no answers revealed)
export const getAssessmentByToken = async (req, res) => {
    const { token } = req.params;

    try {
        const result = await pool.query(
            `SELECT ca.id, ca.status, ca.started_at, ca.expires_at, ca.submitted_at,
              a.questions, a.time_limit_minutes,
              j.title as job_title, j.location, j.job_type,
              comp.name as company_name,
              c.name as candidate_name
       FROM candidate_assessments ca
       JOIN assessments a ON a.id = ca.assessment_id
       JOIN jobs j ON j.id = a.job_id
       JOIN companies comp ON comp.id = j.company_id
       JOIN candidates c ON c.id = ca.candidate_id
       WHERE ca.token = $1`,
            [token]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Invalid or expired assessment link' });
        }

        const assessment = result.rows[0];

        // Already submitted
        if (assessment.status === 'completed') {
            return res.json({ status: 'completed', message: 'You have already submitted this assessment.' });
        }

        // Check if expired (started but ran out of time before submitting)
        if (assessment.status === 'started' && assessment.expires_at) {
            const now = new Date();
            const expiresAt = new Date(assessment.expires_at);
            if (now > expiresAt) {
                // Auto-expire it
                await pool.query(
                    `UPDATE candidate_assessments SET status = 'expired' WHERE token = $1`,
                    [token]
                );
                return res.json({ status: 'expired', message: 'Your assessment time has expired.' });
            }
        }

        // Strip out correct answers before sending to candidate
        const safeQuestions = assessment.questions.map((q, index) => ({
            index,
            type: q.type,       // 'mcq' or 'short'
            question: q.question,
            options: q.options || null,   // only present for MCQ
        }));

        return res.json({
            status: assessment.status,
            job_title: assessment.job_title,
            company_name: assessment.company_name,
            candidate_name: assessment.candidate_name,
            time_limit_minutes: assessment.time_limit_minutes,
            started_at: assessment.started_at,
            expires_at: assessment.expires_at,
            questions: safeQuestions,
            total_questions: safeQuestions.length,
        });
    } catch (err) {
        console.error('getAssessmentByToken error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// ─── POST /api/public/assessment/:token/start ─────────────────────────────────
// Candidate clicks "Start Test" — sets started_at and calculates expires_at
export const startAssessment = async (req, res) => {
    const { token } = req.params;

    try {
        const result = await pool.query(
            `SELECT ca.id, ca.status, a.time_limit_minutes
       FROM candidate_assessments ca
       JOIN assessments a ON a.id = ca.assessment_id
       WHERE ca.token = $1`,
            [token]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Invalid assessment link' });
        }

        const ca = result.rows[0];

        if (ca.status === 'completed') {
            return res.status(400).json({ error: 'Assessment already completed' });
        }

        if (ca.status === 'expired') {
            return res.status(400).json({ error: 'Assessment has expired' });
        }

        if (ca.status === 'started') {
            // Already started — just return current expires_at (page refresh case)
            const current = await pool.query(
                'SELECT started_at, expires_at FROM candidate_assessments WHERE token = $1',
                [token]
            );
            return res.json({
                started_at: current.rows[0].started_at,
                expires_at: current.rows[0].expires_at,
            });
        }

        // First time starting
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ca.time_limit_minutes * 60 * 1000);

        await pool.query(
            `UPDATE candidate_assessments
       SET status = 'started', started_at = $1, expires_at = $2
       WHERE token = $3`,
            [now, expiresAt, token]
        );

        return res.json({ started_at: now, expires_at: expiresAt });
    } catch (err) {
        console.error('startAssessment error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// ─── POST /api/public/assessment/:token/submit ───────────────────────────────
// Candidate submits answers — AI grades in background, updates score
export const submitAssessment = async (req, res) => {
    const { token } = req.params;
    const { answers } = req.body; // array of { questionIndex, answer }

    try {
        const result = await pool.query(
            `SELECT ca.id, ca.status, ca.expires_at, ca.candidate_id,
              a.questions, a.job_id,
              j.title as job_title,
              c.name as candidate_name, c.email as candidate_email
       FROM candidate_assessments ca
       JOIN assessments a ON a.id = ca.assessment_id
       JOIN jobs j ON j.id = a.job_id
       JOIN candidates c ON c.id = ca.candidate_id
       WHERE ca.token = $1`,
            [token]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Invalid assessment link' });
        }

        const ca = result.rows[0];

        if (ca.status === 'completed') {
            return res.status(400).json({ error: 'Assessment already submitted' });
        }

        // Accept submission even if slightly past expiry (network delay grace)
        // Mark as completed immediately so UI can show success
        const now = new Date();
        await pool.query(
            `UPDATE candidate_assessments
       SET status = 'completed', answers = $1, submitted_at = $2
       WHERE token = $3`,
            [JSON.stringify(answers || []), now, token]
        );

        // Respond to candidate immediately — don't make them wait for AI grading
        res.json({ message: 'Assessment submitted successfully. Thank you!' });

        // Grade in background
        setImmediate(async () => {
            try {
                const gradingResult = await gradeAssessment({
                    questions: ca.questions,
                    answers: answers || [],
                    jobTitle: ca.job_title,
                });

                await pool.query(
                    `UPDATE candidate_assessments
           SET ai_score = $1, ai_feedback = $2, ai_summary = $3
           WHERE token = $4`,
                    [
                        gradingResult.score,
                        JSON.stringify(gradingResult.feedback),
                        gradingResult.summary,
                        token,
                    ]
                );

                // Also update the candidate's assessment score in candidates table
                await pool.query(
                    `UPDATE candidates SET assessment_score = $1 WHERE id = $2`,
                    [gradingResult.score, ca.candidate_id]
                );

                console.log(`✅ Assessment graded for candidate ${ca.candidate_id}: ${gradingResult.score}/100`);
            } catch (gradeErr) {
                console.error('Background grading error:', gradeErr);
            }
        });
    } catch (err) {
        console.error('submitAssessment error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// ─── POST /api/public/assessment/:token/violation ────────────────────────────
// Called from candidate's browser when a proctoring violation is detected
// Violations are stored as an array: [{ type, timestamp }, ...]
// Types: 'tab_switch' | 'fullscreen_exit' (copy-paste is blocked silently, not logged)
export const logViolation = async (req, res) => {
    const { token } = req.params;
    const { type } = req.body; // 'tab_switch' | 'fullscreen_exit'

    const ALLOWED_TYPES = ['tab_switch', 'fullscreen_exit'];

    if (!type || !ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({ error: 'Invalid violation type' });
    }

    try {
        // Fetch current violations array and status
        const result = await pool.query(
            `SELECT id, status, violations FROM candidate_assessments WHERE token = $1`,
            [token]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Invalid assessment link' });
        }

        const ca = result.rows[0];

        // Only log violations for active (started) assessments
        if (ca.status !== 'started') {
            return res.status(400).json({ error: 'Assessment is not active' });
        }

        // Append new violation
        const currentViolations = Array.isArray(ca.violations) ? ca.violations : [];
        const newViolation = { type, timestamp: new Date().toISOString() };
        const updatedViolations = [...currentViolations, newViolation];

        await pool.query(
            `UPDATE candidate_assessments SET violations = $1 WHERE token = $2`,
            [JSON.stringify(updatedViolations), token]
        );

        return res.json({
            violation_count: updatedViolations.length,
            violations: updatedViolations,
        });
    } catch (err) {
        console.error('logViolation error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};