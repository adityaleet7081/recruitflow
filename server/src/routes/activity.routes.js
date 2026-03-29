const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getActivity } = require('../controllers/activity.controller');

router.use(authenticate);
router.get('/', getActivity);

module.exports = router;