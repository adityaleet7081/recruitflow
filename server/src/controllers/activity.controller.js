const pool = require('../config/db');

// GET /api/activity — recent activity for the company
const getActivity = async (req, res, next) => {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    try {
        const result = await pool.query(
            `SELECT a.id, a.type, a.title, a.description, a.metadata, a.created_at,
              u.name AS user_name
       FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.company_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2`,
            [req.user.companyId, limit]
        );
        res.json({ activities: result.rows });
    } catch (err) {
        next(err);
    }
};

module.exports = { getActivity };