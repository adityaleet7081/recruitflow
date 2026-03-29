import api from './axios.js';

// Get assessment config for a job
export const getAssessmentAPI = (jobId) =>
    api.get(`/assessments/${jobId}`);

// Save enable/time_limit settings for a job
export const saveAssessmentSettingsAPI = (jobId, data) =>
    api.post(`/assessments/${jobId}/settings`, data);

// Trigger AI question generation for a job
export const generateQuestionsAPI = (jobId) =>
    api.post(`/assessments/${jobId}/generate`);

// Send assessment email to a candidate
export const sendAssessmentAPI = (candidateId) =>
    api.post(`/assessments/send/${candidateId}`);

// Get a candidate's assessment result (recruiter view)
export const getCandidateResultAPI = (candidateId) =>
    api.get(`/assessments/result/${candidateId}`);