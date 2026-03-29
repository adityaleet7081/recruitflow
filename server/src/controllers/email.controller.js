const pool = require('../config/db');
const { sendRecruiterEmail } = require('../services/email.service');
const { logActivity } = require('../services/activity.service');

// POST /api/candidates/:id/email
const emailCandidate = async (req, res, next) => {
    const { subject, message } = req.body;
    if (!subject || !message) {
        return res.status(400).json({ error: 'Subject and message are required' });
    }

    try {
        // Get candidate + job + company info
        const result = await pool.query(
            `SELECT c.name AS candidate_name, c.email AS candidate_email,
              j.title AS job_title, j.company_id,
              comp.name AS company_name,
              u.name AS recruiter_name, u.email AS recruiter_email
       FROM candidates c
       JOIN jobs j ON c.job_id = j.id
       JOIN companies comp ON j.company_id = comp.id
       JOIN users u ON u.id = $2
       WHERE c.id = $1`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const row = result.rows[0];
        if (row.company_id !== req.user.companyId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await sendRecruiterEmail({
            from: row.recruiter_email,
            fromName: row.recruiter_name,
            to: row.candidate_email,
            candidateName: row.candidate_name,
            subject,
            message,
            companyName: row.company_name,
        });

        // Log to email_logs table
        await pool.query(
            `INSERT INTO email_logs (candidate_id, sent_by, subject, body, status)
       VALUES ($1, $2, $3, $4, 'sent')`,
            [req.params.id, req.user.id, subject, message]
        );

        setImmediate(() => logActivity({
            companyId: req.user.companyId,
            userId: req.user.id,
            type: 'email_sent',
            title: `Email sent to ${row.candidate_name}`,
            description: subject,
            metadata: { candidateId: req.params.id, candidateName: row.candidate_name },
        }));

        res.json({ message: 'Email sent successfully' });
    } catch (err) {
        console.error('Email candidate error:', err);
        res.status(500).json({ error: 'Failed to send email' });
    }
};

module.exports = { emailCandidate };