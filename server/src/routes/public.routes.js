const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const upload = require('../middleware/upload');
const { getCompanyJobs, getJob, applyToJob } = require('../controllers/public.controller');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

router.get('/:companySlug/jobs', getCompanyJobs);

router.get('/jobs/:jobId',
  [param('jobId').isUUID().withMessage('Invalid job ID')],
  validate,
  getJob
);

router.post('/jobs/:jobId/apply',
  upload.single('resume'),
  [
    param('jobId').isUUID().withMessage('Invalid job ID'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  validate,
  applyToJob
);

module.exports = router;