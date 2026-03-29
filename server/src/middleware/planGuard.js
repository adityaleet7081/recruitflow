const pool = require('../config/db');

const planGuard = (feature) => async (req, res, next) => {
    try {
        const companyResult = await pool.query(
            'SELECT plan FROM companies WHERE id = $1',
            [req.user.companyId]
        );
        const company = companyResult.rows[0];
        const plan = company?.plan || 'free';

        if (plan === 'pro') return next();

        if (feature === 'jobs') {
            const jobCount = await pool.query(
                `SELECT COUNT(*) FROM jobs WHERE company_id = $1 AND status != 'deleted'`,
                [req.user.companyId]
            );
            const count = parseInt(jobCount.rows[0].count);
            if (count >= 3) {
                return res.status(403).json({
                    error: 'Free plan limit reached',
                    code: 'PLAN_LIMIT_REACHED',
                    message: 'You have reached the 3 job limit on the free plan. Upgrade to Pro for unlimited jobs.',
                });
            }
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = planGuard;