const pool = require('../config/db');
const { logActivity } = require('../services/activity.service');

const VALID_STAGES = ['applied', 'screened', 'interview', 'offer', 'hired', 'rejected'];

// GET /api/candidates?jobId=xxx
const getCandidates = async (req, res, next) => {
  const { jobId } = req.query;
  if (!jobId) return res.status(400).json({ error: 'jobId query parameter is required' });
  try {
    const jobCheck = await pool.query(
      'SELECT id FROM jobs WHERE id = $1 AND company_id = $2',
      [jobId, req.user.companyId]
    );
    if (jobCheck.rows.length === 0) return res.status(404).json({ error: 'Job not found' });

    const result = await pool.query(
      `SELECT id, name, email, phone, resume_url, pipeline_stage,
              ai_score, ai_analysis, notes, source, applied_at, updated_at
       FROM candidates WHERE job_id = $1 ORDER BY applied_at DESC`,
      [jobId]
    );
    res.json({ candidates: result.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/candidates/:id
const getCandidateById = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.*, j.title AS job_title, j.company_id
       FROM candidates c JOIN jobs j ON c.job_id = j.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Candidate not found' });

    const candidate = result.rows[0];
    if (candidate.company_id !== req.user.companyId) return res.status(404).json({ error: 'Candidate not found' });

    const { company_id, ...candidateData } = candidate;
    res.json({ candidate: candidateData });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/candidates/:id/stage
const updateStage = async (req, res, next) => {
  const { stage } = req.body;
  if (!stage || !VALID_STAGES.includes(stage)) {
    return res.status(400).json({ error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}` });
  }
  try {
    const check = await pool.query(
      `SELECT c.id, c.name, c.pipeline_stage, j.title AS job_title
       FROM candidates c JOIN jobs j ON c.job_id = j.id
       WHERE c.id = $1 AND j.company_id = $2`,
      [req.params.id, req.user.companyId]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Candidate not found' });

    const { name, pipeline_stage: oldStage, job_title } = check.rows[0];

    const result = await pool.query(
      'UPDATE candidates SET pipeline_stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [stage, req.params.id]
    );

    setImmediate(() => logActivity({
      companyId: req.user.companyId,
      userId: req.user.id,
      type: 'stage_changed',
      title: `${name} moved to ${stage}`,
      description: `${job_title} · ${oldStage} → ${stage}`,
      metadata: { candidateId: req.params.id, candidateName: name, fromStage: oldStage, toStage: stage, jobTitle: job_title },
    }));

    res.json({ candidate: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/candidates/:id/notes
const updateNotes = async (req, res, next) => {
  const { notes } = req.body;
  if (notes === undefined) return res.status(400).json({ error: 'notes field is required' });
  try {
    const check = await pool.query(
      `SELECT c.id FROM candidates c JOIN jobs j ON c.job_id = j.id
       WHERE c.id = $1 AND j.company_id = $2`,
      [req.params.id, req.user.companyId]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Candidate not found' });

    const result = await pool.query(
      'UPDATE candidates SET notes = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [notes, req.params.id]
    );
    res.json({ candidate: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/candidates/export?jobId=xxx — download as CSV
const exportCandidates = async (req, res, next) => {
  const { jobId } = req.query;
  if (!jobId) return res.status(400).json({ error: 'jobId is required' });
  try {
    const jobCheck = await pool.query(
      'SELECT id, title FROM jobs WHERE id = $1 AND company_id = $2',
      [jobId, req.user.companyId]
    );
    if (jobCheck.rows.length === 0) return res.status(404).json({ error: 'Job not found' });

    const result = await pool.query(
      `SELECT name, email, phone, pipeline_stage, ai_score,
              source, applied_at, notes
       FROM candidates WHERE job_id = $1 ORDER BY applied_at DESC`,
      [jobId]
    );

    const jobTitle = jobCheck.rows[0].title.replace(/[^a-z0-9]/gi, '_');
    const headers = ['Name', 'Email', 'Phone', 'Stage', 'AI Score', 'Source', 'Applied At', 'Notes'];
    const csvRows = [
      headers.join(','),
      ...result.rows.map(r => [
        `"${r.name || ''}"`,
        `"${r.email || ''}"`,
        `"${r.phone || ''}"`,
        `"${r.pipeline_stage || ''}"`,
        r.ai_score || '',
        `"${r.source || 'Direct'}"`,
        `"${r.applied_at ? new Date(r.applied_at).toLocaleDateString() : ''}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ].join(','))
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${jobTitle}_candidates.csv"`);
    res.send(csvRows.join('\n'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getCandidates, getCandidateById, updateStage, updateNotes, exportCandidates };