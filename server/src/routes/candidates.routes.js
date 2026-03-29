const router = require('express').Router();
const { param, body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  getCandidates, getCandidateById, updateStage, updateNotes, exportCandidates
} = require('../controllers/candidates.controller');
const { emailCandidate } = require('../controllers/email.controller');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  next();
};

router.use(authenticate);

router.get('/export', exportCandidates);
router.get('/', getCandidates);
router.get('/:id', [param('id').isUUID()], validate, getCandidateById);
router.patch('/:id/stage', [param('id').isUUID()], validate, updateStage);
router.patch('/:id/notes', [param('id').isUUID()], validate, updateNotes);
router.post('/:id/email',
  [param('id').isUUID(), body('subject').notEmpty(), body('message').notEmpty()],
  validate,
  emailCandidate
);

module.exports = router;