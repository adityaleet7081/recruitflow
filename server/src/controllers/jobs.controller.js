const pool = require('../config/db');
const { logActivity } = require('../services/activity.service');

// POST /api/jobs — create a new job
const createJob = async (req, res, next) => {
  const { title, description, requirements, location, salary_min, salary_max, job_type } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO jobs (company_id, created_by, title, description, requirements, location, salary_min, salary_max, job_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.companyId, req.user.id, title, description, requirements || null, location || null,
      salary_min || null, salary_max || null, job_type || 'full-time']
    );
    const job = result.rows[0];

    setImmediate(() => logActivity({
      companyId: req.user.companyId,
      userId: req.user.id,
      type: 'job_posted',
      title: `New job posted: ${title}`,
      description: `${location || 'Remote'} · ${job_type || 'full-time'}`,
      metadata: { jobId: job.id, jobTitle: title },
    }));

    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
};

// GET /api/jobs — list all jobs for current company
const getJobs = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT j.*, u.name AS created_by_name
       FROM jobs j JOIN users u ON j.created_by = u.id
       WHERE j.company_id = $1
       ORDER BY j.created_at DESC`,
      [req.user.companyId]
    );
    res.json({ jobs: result.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/jobs/:id — get single job
const getJobById = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT j.*, u.name AS created_by_name
       FROM jobs j JOIN users u ON j.created_by = u.id
       WHERE j.id = $1 AND j.company_id = $2`,
      [req.params.id, req.user.companyId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ job: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/jobs/:id — update job
const updateJob = async (req, res, next) => {
  const { title, description, requirements, location, salary_min, salary_max, job_type } = req.body;
  try {
    const existing = await pool.query(
      'SELECT id FROM jobs WHERE id = $1 AND company_id = $2',
      [req.params.id, req.user.companyId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const result = await pool.query(
      `UPDATE jobs SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         requirements = COALESCE($3, requirements),
         location = COALESCE($4, location),
         salary_min = COALESCE($5, salary_min),
         salary_max = COALESCE($6, salary_max),
         job_type = COALESCE($7, job_type)
       WHERE id = $8 AND company_id = $9
       RETURNING *`,
      [title, description, requirements, location, salary_min, salary_max, job_type,
        req.params.id, req.user.companyId]
    );
    res.json({ job: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/jobs/:id/close — close a job
const closeJob = async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE jobs SET status = 'closed'
       WHERE id = $1 AND company_id = $2
       RETURNING *`,
      [req.params.id, req.user.companyId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    setImmediate(() => logActivity({
      companyId: req.user.companyId,
      userId: req.user.id,
      type: 'job_closed',
      title: `Job closed: ${result.rows[0].title}`,
      metadata: { jobId: result.rows[0].id, jobTitle: result.rows[0].title },
    }));

    res.json({ job: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/jobs/:id — delete job
const deleteJob = async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM jobs WHERE id = $1 AND company_id = $2 RETURNING id, title',
      [req.params.id, req.user.companyId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    setImmediate(() => logActivity({
      companyId: req.user.companyId,
      userId: req.user.id,
      type: 'job_deleted',
      title: `Job deleted: ${result.rows[0].title}`,
      metadata: { jobTitle: result.rows[0].title },
    }));

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createJob, getJobs, getJobById, updateJob, closeJob, deleteJob };