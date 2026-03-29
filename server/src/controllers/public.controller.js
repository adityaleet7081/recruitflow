import pool from '../config/db.js';
import { extractTextFromPDF, scoreResume } from '../services/ai.service.js';
import { sendApplicationConfirmation, sendRecruiterScoreAlert } from '../services/email.service.js';

export const getCompanyJobs = async (req, res, next) => {
  const { companySlug } = req.params;
  try {
    const companyResult = await pool.query(
      'SELECT * FROM companies WHERE slug = $1',
      [companySlug]
    );
    const company = companyResult.rows[0];
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const jobsResult = await pool.query(
      `SELECT * FROM jobs WHERE company_id = $1 AND status = 'open' ORDER BY created_at DESC`,
      [company.id]
    );

    res.json({ company, jobs: jobsResult.rows });
  } catch (err) {
    next(err);
  }
};

export const getJob = async (req, res, next) => {
  const { jobId } = req.params;
  try {
    const result = await pool.query(
      `SELECT j.*, c.name AS company_name, c.slug AS company_slug
       FROM jobs j JOIN companies c ON j.company_id = c.id
       WHERE j.id = $1 AND j.status = 'open'`,
      [jobId]
    );
    const job = result.rows[0];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err) {
    next(err);
  }
};

export const applyToJob = async (req, res, next) => {
  const { jobId } = req.params;
  const { name, email, phone, source } = req.body;
  const resumeFile = req.file;

  try {
    const jobResult = await pool.query(
      `SELECT j.*, c.name AS company_name
       FROM jobs j JOIN companies c ON j.company_id = c.id
       WHERE j.id = $1 AND j.status = 'open'`,
      [jobId]
    );
    const job = jobResult.rows[0];
    if (!job) return res.status(404).json({ error: 'Job not found or closed' });

    const existing = await pool.query(
      'SELECT id FROM candidates WHERE job_id = $1 AND email = $2',
      [jobId, email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You have already applied for this position' });
    }

    const resumeUrl = resumeFile ? `/uploads/${resumeFile.filename}` : null;

    const candidateResult = await pool.query(
      `INSERT INTO candidates (job_id, name, email, phone, resume_url, source)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [jobId, name, email, phone || null, resumeUrl, source || 'direct']
    );
    const candidate = candidateResult.rows[0];

    // Run AI scoring in background — don't await, respond fast
    if (resumeFile && process.env.OPENAI_API_KEY) {
      setImmediate(async () => {
        try {
          const resumeText = await extractTextFromPDF(resumeFile.path);
          const analysis = await scoreResume({
            resumeText,
            jobTitle: job.title,
            jobDescription: job.description,
            requirements: job.requirements,
          });

          await pool.query(
            `UPDATE candidates
             SET resume_text = $1, ai_score = $2, ai_analysis = $3
             WHERE id = $4`,
            [resumeText, analysis.score, JSON.stringify(analysis), candidate.id]
          );

          // Get recruiter email and notify
          const recruiterResult = await pool.query(
            `SELECT email FROM users WHERE company_id = $1 AND role = 'admin' LIMIT 1`,
            [job.company_id]
          );
          const recruiterEmail = recruiterResult.rows[0]?.email;

          if (recruiterEmail) {
            try {
              await sendRecruiterScoreAlert({
                to: recruiterEmail,
                candidateName: name,
                jobTitle: job.title,
                score: analysis.score,
                summary: analysis.summary,
              });
            } catch (emailErr) {
              console.error('Recruiter email failed:', emailErr.message);
            }
          }
        } catch (err) {
          console.error('AI scoring failed:', err.message);
        }
      });
    }

    // Send confirmation email to candidate — wrapped in try/catch so it never crashes server
    try {
      await sendApplicationConfirmation({
        to: email,
        candidateName: name,
        jobTitle: job.title,
        companyName: job.company_name,
      });
    } catch (emailErr) {
      console.error('Candidate confirmation email failed:', emailErr.message);
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
      },
    });
  } catch (err) {
    next(err);
  }
};