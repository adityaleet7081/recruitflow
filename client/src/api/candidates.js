import api from './axios';

export const getCandidatesAPI = (jobId) => api.get(`/candidates?jobId=${jobId}`);
export const getCandidateAPI = (id) => api.get(`/candidates/${id}`);
export const updateStageAPI = (id, stage) => api.patch(`/candidates/${id}/stage`, { stage });
export const updateNotesAPI = (id, notes) => api.patch(`/candidates/${id}/notes`, { notes });
export const emailCandidateAPI = (id, subject, message) => api.post(`/candidates/${id}/email`, { subject, message });