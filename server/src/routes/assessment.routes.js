import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getAssessmentByJob,
    saveAssessmentSettings,
    generateQuestions,
    sendAssessmentToCandidate,
    getCandidateAssessmentResult,
} from '../controllers/assessment.controller.js';

const router = express.Router();

// All routes below require login
router.use(authenticate);

// GET  /api/assessments/:jobId        → get assessment config + questions for a job
router.get('/:jobId', getAssessmentByJob);

// POST /api/assessments/:jobId/settings → enable/disable, set time limit
router.post('/:jobId/settings', saveAssessmentSettings);

// POST /api/assessments/:jobId/generate → AI generates 8 questions from job details
router.post('/:jobId/generate', generateQuestions);

// POST /api/assessments/send/:candidateId → send test link email to candidate
router.post('/send/:candidateId', sendAssessmentToCandidate);

// GET  /api/assessments/result/:candidateId → get a candidate's score + feedback
router.get('/result/:candidateId', getCandidateAssessmentResult);

export default router;