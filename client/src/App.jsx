import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Public pages
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import PublicJobBoard from './pages/public/PublicJobBoard.jsx';
import PublicJobDetail from './pages/public/PublicJobDetail.jsx';
import AssessmentPage from './pages/public/AssessmentPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Billing pages
import BillingSuccess from './pages/billing/BillingSuccess.jsx';
import BillingCancel from './pages/billing/BillingCancel.jsx';

// Dashboard pages
import DashboardLayout from './pages/dashboard/DashboardLayout.jsx';
import JobsPage from './pages/dashboard/JobsPage.jsx';
import CandidatesPage from './pages/dashboard/CandidatesPage.jsx';
import AnalyticsPage from './pages/dashboard/AnalyticsPage.jsx';
import BillingPage from './pages/dashboard/BillingPage.jsx';
import SettingsPage from './pages/dashboard/SettingsPage.jsx';
import ActivityPage from './pages/dashboard/ActivityPage.jsx';
import ComparePage from './pages/dashboard/ComparePage.jsx';

export default function App() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/company/:slug/jobs" element={<PublicJobBoard />} />
      <Route path="/jobs/:jobId/apply" element={<PublicJobDetail />} />

      {/* Assessment — candidate takes test via unique token link */}
      <Route path="/assessment/:token" element={<AssessmentPage />} />

      {/* ── Billing ─────────────────────────────────────────────────────── */}
      <Route path="/billing/success" element={<BillingSuccess />} />
      <Route path="/billing/cancel" element={<BillingCancel />} />

      {/* ── Dashboard (protected) ───────────────────────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:jobId/candidates" element={<CandidatesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="compare" element={<ComparePage />} />
      </Route>

      {/* ── 404 ─────────────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}