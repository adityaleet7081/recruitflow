import api from './axios';

export const getJobsAPI = () => api.get('/jobs');
export const getJobAPI = (id) => api.get(`/jobs/${id}`);
export const createJobAPI = (data) => api.post('/jobs', data);
export const updateJobAPI = (id, data) => api.patch(`/jobs/${id}`, data);
export const closeJobAPI = (id) => api.patch(`/jobs/${id}/close`);
export const deleteJobAPI = (id) => api.delete(`/jobs/${id}`);