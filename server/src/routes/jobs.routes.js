const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const { authenticate, requireRole } = require('../middleware/auth');
const planGuard = require('../middleware/planGuard');
const {
  createJob, getJobs, getJobById, updateJob, closeJob, deleteJob
} = require('../controllers/jobs.controller');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

router.use(authenticate);

router.post('/',
  requireRole('admin', 'recruiter'),
  planGuard('jobs'),
  [
    body('title').trim().notEmpty().withMessage('Job title is required'),
    body('description').trim().notEmpty().withMessage('Job description is required'),
  ],
  validate,
  createJob
);

router.get('/', getJobs);

router.get('/:id',
  [param('id').isUUID().withMessage('Invalid job ID')],
  validate,
  getJobById
);

router.patch('/:id',
  requireRole('admin', 'recruiter'),
  [param('id').isUUID().withMessage('Invalid job ID')],
  validate,
  updateJob
);

router.patch('/:id/close',
  requireRole('admin', 'recruiter'),
  [param('id').isUUID().withMessage('Invalid job ID')],
  validate,
  closeJob
);

router.delete('/:id',
  requireRole('admin'),
  [param('id').isUUID().withMessage('Invalid job ID')],
  validate,
  deleteJob
);

module.exports = router;