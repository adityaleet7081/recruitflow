const pool = require('../config/db');

/**
 * Log an activity event
 * @param {object} opts
 * @param {string} opts.companyId
 * @param {string} opts.userId - optional
 * @param {string} opts.type - e.g. 'candidate_applied', 'stage_changed', 'job_posted'
 * @param {string} opts.title - short display text
 * @param {string} opts.description - optional longer text
 * @param {object} opts.metadata - optional extra data
 */
const logActivity = async ({ companyId, userId = null, type, title, description = null, metadata = {} }) => {
    try {
        await pool.query(
            `INSERT INTO activity_logs (company_id, user_id, type, title, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [companyId, userId, type, title, description, JSON.stringify(metadata)]
        );
    } catch (err) {
        // Never crash the main request for logging
        console.error('Activity log error:', err.message);
    }
};

module.exports = { logActivity };