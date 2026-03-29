import pool from '../config/db.js';
import { generateAssessmentQuestions } from '../services/ai.service.js';
import { sendAssessmentEmail } from '../services/email.service.js';
import { logActivity } from '../services/activity.service.js';

// ─── GET /api/assessments/:jobId ─────────────────────────────────────────────
// Returns the assessment config for a job (or null if not set up yet)
export const getAssessmentByJob = async (req, res) => {
    const { jobId } = req.params;
    const companyId = req.user.companyId;

    try {
        // Verify job belongs to this company
        const jobCheck = await pool.query(
            'SELECT id, title FROM jobs WHERE id = $1 AND company_id = $2',
            [jobId, companyId]
        );
        if (!jobCheck.rows.length) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const result = await pool.query(
            'SELECT * FROM assessments WHERE job_id = $1',
            [jobId]
        );

        if (!result.rows.length) {
            // Return a default empty config — frontend will handle "not set up" state
            return res.json({
                exists: false,
                enabled: false,
                time_limit_minutes: 30,
                questions: null,
                generated_at: null,
            });
        }

        return res.json({ exists: true, ...result.rows[0] });
    } catch (err) {
        console.error('getAssessmentByJob error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// ─── POST /api/assessments/:jobId/settings ───────────────────────────────────
// Enable/disable assessment and set time limit for a job
export const saveAssessmentSettings = async (req, res) => {
    const { jobId } = req.params;
    const companyId = req.user.companyId;
    const { enabled, time_limit_minutes } = req.body;

    try {
        const jobCheck = await pool.query(
            'SELECT id FROM jobs WHERE id = $1 AND company_id = $2',
            [jobId, companyId]
        );
        if (!jobCheck.rows.length) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Upsert — insert if not exists, update if exists
        const result = await pool.query(
            `INSERT INTO assessments (job_id, company_id, enabled, time_limit_minutes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (job_id) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         time_limit_minutes = EXCLUDED.time_limit_minutes,
         updated_at = NOW()
       RETURNING *`,
            [jobId, companyId, enabled ?? false, time_limit_minutes ?? 30]
        );

        return res.json(result.rows[0]);
    } catch (err) {
        console.error('saveAssessmentSettings error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// ─── POST /api/assessments/:jobId/generate ───────────────────────────────────
// Calls AI to generate 8 questions based on job title + description + requirements
export const generateQuestions = async (req, res) => {
    const { jobId } = req.params;
    const companyId = req.user.companyId;

    try {
        const jobResult = await pool.query(
            'SELECT * FROM jobs WHERE id = $1 AND company_id = $2',
            [jobId, companyId]
        );
        if (!jobResult.rows.length) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const job = jobResult.rows[0];

        // Check assessment row exists
        const assessmentCheck = await pool.query(
            'SELECT id FROM assessments WHERE job_id = $1',
            [jobId]
        );
        if (!assessmentCheck.rows.length) {
            return res.status(400).json({
                error: 'Save assessment settings first before generating questions',
            });
        }

        // Call AI service
        const questions = await generateAssessmentQuestions(job);

        // Save questions to DB
        const updated = await pool.query(
            `UPDATE assessments
       SET questions = $1, generated_at = NOW(), updated_at = NOW()
       WHERE job_id = $2
       RETURNING *`,
            [JSON.stringify(questions), jobId]
        );

        return res.json({ questions, assessment: updated.rows[0] });
    } catch (err) {
        console.error('generateQuestions error:', err);
        return res.status(500).json({ error: 'Failed to generate questions' });
    }
};

// ─── POST /api/assessments/send/:candidateId ─────────────────────────────────
// Creates a candidate_assessment row and sends email with unique test link
export const sendAssessmentToCandidate = async (req, res) => {
    const { candidateId } = req.params;
    const companyId = req.user.companyId;
    const userId = req.user.id;

    try {
        // Get candidate + their job
        const candidateResult = await pool.query(
            `SELECT c.*, j.title as job_title, j.id as job_id
       FROM candidates c
       JOIN jobs j ON j.id = c.job_id
       WHERE c.id = $1 AND j.company_id = $2`,
            [candidateId, companyId]
        );
        if (!candidateResult.rows.length) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const candidate = candidateResult.rows[0];

        // Get the assessment for this job
        const assessmentResult = await pool.query(
            'SELECT * FROM assessments WHERE job_id = $1 AND enabled = true',
            [candidate.job_id]
        );
        if (!assessmentResult.rows.length) {
            return res.status(400).json({
                error: 'Assessment is not enabled for this job. Enable it in job settings first.',
            });
        }

        const assessment = assessmentResult.rows[0];

        if (!assessment.questions || !assessment.questions.length) {
            return res.status(400).json({
                error: 'Questions have not been generated yet. Generate questions first.',
            });
        }

        // Check if already sent
        const existing = await pool.query(
            'SELECT id, status FROM candidate_assessments WHERE assessment_id = $1 AND candidate_id = $2',
            [assessment.id, candidateId]
        );
        if (existing.rows.length) {
            return res.status(400).json({
                error: `Assessment already sent. Current status: ${existing.rows[0].status}`,
            });
        }

        // Create candidate_assessment row
        const caResult = await pool.query(
            `INSERT INTO candidate_assessments (assessment_id, candidate_id)
       VALUES ($1, $2)
       RETURNING *`,
            [assessment.id, candidateId]
        );

        const candidateAssessment = caResult.rows[0];
        const testLink = `${process.env.CLIENT_URL}/assessment/${candidateAssessment.token}`;

        // Send email
        await sendAssessmentEmail({
            to: candidate.email,
            candidateName: candidate.name,
            jobTitle: candidate.job_title,
            testLink,
            timeLimitMinutes: assessment.time_limit_minutes,
        });

        // Log activity
        await logActivity({
            companyId,
            userId,
            type: 'assessment_sent',
            title: 'Assessment Sent',
            description: `Assessment sent to ${candidate.name} for ${candidate.job_title}`,
            metadata: { candidateId, jobId: candidate.job_id },
        });

        return res.json({
            message: 'Assessment sent successfully',
            token: candidateAssessment.token,
        });
    } catch (err) {
        console.error('sendAssessmentToCandidate error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// ─── GET /api/assessments/result/:candidateId ────────────────────────────────
// Recruiter views a candidate's completed assessment result
export const getCandidateAssessmentResult = async (req, res) => {
    const { candidateId } = req.params;
    const companyId = req.user.companyId;

    try {
        const result = await pool.query(
            `SELECT ca.*, a.questions, a.time_limit_minutes, a.job_id
       FROM candidate_assessments ca
       JOIN assessments a ON a.id = ca.assessment_id
       JOIN jobs j ON j.id = a.job_id
       WHERE ca.candidate_id = $1 AND j.company_id = $2
       ORDER BY ca.created_at DESC
       LIMIT 1`,
            [candidateId, companyId]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: 'No assessment found for this candidate' });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        console.error('getCandidateAssessmentResult error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};