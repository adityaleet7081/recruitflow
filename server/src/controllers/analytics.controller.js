const pool = require('../config/db');

// GET /api/analytics/overview — company-wide stats
const getOverview = async (req, res) => {
    const companyId = req.user.companyId;

    try {
        // Total jobs
        const jobsResult = await pool.query(
            `SELECT COUNT(*) AS total_jobs,
              COUNT(*) FILTER (WHERE status = 'open') AS open_jobs,
              COUNT(*) FILTER (WHERE status = 'closed') AS closed_jobs
       FROM jobs WHERE company_id = $1`,
            [companyId]
        );

        // Total candidates across all jobs in this company
        const candidatesResult = await pool.query(
            `SELECT COUNT(*) AS total_candidates,
              COUNT(*) FILTER (WHERE c.pipeline_stage = 'hired') AS total_hired,
              COUNT(*) FILTER (WHERE c.pipeline_stage = 'offer') AS total_offers,
              ROUND(AVG(c.ai_score) FILTER (WHERE c.ai_score IS NOT NULL), 1) AS avg_ai_score
       FROM candidates c
       JOIN jobs j ON c.job_id = j.id
       WHERE j.company_id = $1`,
            [companyId]
        );

        // Pipeline stage distribution across all jobs
        const stageResult = await pool.query(
            `SELECT c.pipeline_stage AS stage, COUNT(*) AS count
       FROM candidates c
       JOIN jobs j ON c.job_id = j.id
       WHERE j.company_id = $1
       GROUP BY c.pipeline_stage`,
            [companyId]
        );

        // Source distribution
        const sourceResult = await pool.query(
            `SELECT COALESCE(c.source, 'Direct') AS source, COUNT(*) AS count
       FROM candidates c
       JOIN jobs j ON c.job_id = j.id
       WHERE j.company_id = $1
       GROUP BY COALESCE(c.source, 'Direct')
       ORDER BY count DESC`,
            [companyId]
        );

        // Candidates per job (top 10)
        const perJobResult = await pool.query(
            `SELECT j.title, j.id AS job_id, COUNT(c.id) AS candidate_count,
              ROUND(AVG(c.ai_score) FILTER (WHERE c.ai_score IS NOT NULL), 1) AS avg_score
       FROM jobs j
       LEFT JOIN candidates c ON c.job_id = j.id
       WHERE j.company_id = $1
       GROUP BY j.id, j.title
       ORDER BY candidate_count DESC
       LIMIT 10`,
            [companyId]
        );

        // Candidates over time (last 30 days)
        const timelineResult = await pool.query(
            `SELECT DATE(c.applied_at) AS date, COUNT(*) AS count
       FROM candidates c
       JOIN jobs j ON c.job_id = j.id
       WHERE j.company_id = $1
         AND c.applied_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(c.applied_at)
       ORDER BY date ASC`,
            [companyId]
        );

        res.json({
            summary: {
                ...jobsResult.rows[0],
                ...candidatesResult.rows[0],
            },
            stageDistribution: stageResult.rows,
            sourceDistribution: sourceResult.rows,
            candidatesPerJob: perJobResult.rows,
            applicationTimeline: timelineResult.rows,
        });
    } catch (err) {
        console.error('Analytics overview error:', err);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

// GET /api/analytics/:jobId — single job analytics
const getJobAnalytics = async (req, res) => {
    const companyId = req.user.companyId;
    const { jobId } = req.params;

    try {
        // Verify job belongs to company
        const jobCheck = await pool.query(
            `SELECT id, title, status, created_at FROM jobs WHERE id = $1 AND company_id = $2`,
            [jobId, companyId]
        );
        if (jobCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Stage funnel
        const stageResult = await pool.query(
            `SELECT pipeline_stage AS stage, COUNT(*) AS count
       FROM candidates WHERE job_id = $1
       GROUP BY pipeline_stage`,
            [jobId]
        );

        // AI score distribution (buckets: 0-20, 21-40, 41-60, 61-80, 81-100)
        const scoreResult = await pool.query(
            `SELECT
         COUNT(*) FILTER (WHERE ai_score BETWEEN 0 AND 20)  AS "0-20",
         COUNT(*) FILTER (WHERE ai_score BETWEEN 21 AND 40) AS "21-40",
         COUNT(*) FILTER (WHERE ai_score BETWEEN 41 AND 60) AS "41-60",
         COUNT(*) FILTER (WHERE ai_score BETWEEN 61 AND 80) AS "61-80",
         COUNT(*) FILTER (WHERE ai_score BETWEEN 81 AND 100) AS "81-100"
       FROM candidates WHERE job_id = $1`,
            [jobId]
        );

        // Source breakdown
        const sourceResult = await pool.query(
            `SELECT COALESCE(source, 'Direct') AS source, COUNT(*) AS count
       FROM candidates WHERE job_id = $1
       GROUP BY COALESCE(source, 'Direct')
       ORDER BY count DESC`,
            [jobId]
        );

        // Summary metrics
        const summaryResult = await pool.query(
            `SELECT
         COUNT(*) AS total_applicants,
         COUNT(*) FILTER (WHERE pipeline_stage = 'hired') AS hired,
         COUNT(*) FILTER (WHERE pipeline_stage = 'offer') AS offers,
         COUNT(*) FILTER (WHERE pipeline_stage = 'rejected') AS rejected,
         ROUND(AVG(ai_score) FILTER (WHERE ai_score IS NOT NULL), 1) AS avg_score,
         MAX(ai_score) AS top_score,
         ROUND(
           100.0 * COUNT(*) FILTER (WHERE pipeline_stage IN ('offer','hired'))
           / NULLIF(COUNT(*), 0), 1
         ) AS offer_rate
       FROM candidates WHERE job_id = $1`,
            [jobId]
        );

        // Applications over time
        const timelineResult = await pool.query(
            `SELECT DATE(applied_at) AS date, COUNT(*) AS count
       FROM candidates
       WHERE job_id = $1 AND applied_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(applied_at)
       ORDER BY date ASC`,
            [jobId]
        );

        // Time to hire: avg days from applied_at to reaching 'hired' stage
        // We approximate using updated_at for hired candidates
        const timeToHireResult = await pool.query(
            `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - applied_at)) / 86400), 1) AS avg_days_to_hire
       FROM candidates
       WHERE job_id = $1 AND pipeline_stage = 'hired'`,
            [jobId]
        );

        res.json({
            job: jobCheck.rows[0],
            summary: summaryResult.rows[0],
            stageFunnel: stageResult.rows,
            scoreDistribution: scoreResult.rows[0],
            sourceBreakdown: sourceResult.rows,
            applicationTimeline: timelineResult.rows,
            timeToHire: timeToHireResult.rows[0],
        });
    } catch (err) {
        console.error('Job analytics error:', err);
        res.status(500).json({ error: 'Failed to fetch job analytics' });
    }
};

module.exports = { getOverview, getJobAnalytics };