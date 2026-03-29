import express from 'express';
import {
    getAssessmentByToken,
    startAssessment,
    submitAssessment,
    logViolation,
} from '../controllers/publicAssessment.controller.js';

const router = express.Router();

// No authentication required — candidates access via unique token

// GET  /api/public/assessment/:token              → fetch test questions
router.get('/:token', getAssessmentByToken);

// POST /api/public/assessment/:token/start        → start timer
router.post('/:token/start', startAssessment);

// POST /api/public/assessment/:token/submit       → submit answers
router.post('/:token/submit', submitAssessment);

// POST /api/public/assessment/:token/violation    → log proctoring violation
router.post('/:token/violation', logViolation);

export default router;