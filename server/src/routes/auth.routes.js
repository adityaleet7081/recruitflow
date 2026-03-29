const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { register, login, refresh, logout, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

router.post('/register',
  [
    body('companyName').trim().notEmpty().withMessage('Company name required'),
    body('name').trim().notEmpty().withMessage('Name required'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Min 8 characters'),
  ],
  validate,
  register
);

router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  login
);

router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

module.exports = router;