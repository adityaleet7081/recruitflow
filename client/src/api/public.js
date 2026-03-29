import axios from 'axios';

const publicApi = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getPublicJobsAPI = (slug) => publicApi.get(`/public/${slug}/jobs`);
export const getPublicJobAPI = (jobId) => publicApi.get(`/public/jobs/${jobId}`);
export const applyJobAPI = (jobId, formData) =>
    publicApi.post(`/public/jobs/${jobId}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });