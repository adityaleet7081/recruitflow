import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes.js';
import jobRoutes from './routes/jobs.routes.js';
import candidateRoutes from './routes/candidates.routes.js';
import publicRoutes from './routes/public.routes.js';
import billingRoutes from './routes/billing.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import activityRoutes from './routes/activity.routes.js';
import assessmentRoutes from './routes/assessment.routes.js';
import publicAssessmentRoutes from './routes/publicAssessment.routes.js';

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ─── Stripe webhook MUST receive raw body — register BEFORE express.json() ───
app.use(
  '/api/billing/webhook',
  express.raw({ type: 'application/json' })
);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static files (uploaded resumes) ─────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/public/assessment', publicAssessmentRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

export default app;