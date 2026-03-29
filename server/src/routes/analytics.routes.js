const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getOverview, getJobAnalytics } = require('../controllers/analytics.controller');

router.use(authenticate);

router.get('/overview', getOverview);
router.get('/:jobId', getJobAnalytics);

module.exports = router;