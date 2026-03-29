import api from './axios';

export const fetchOverview = () =>
    api.get('/analytics/overview').then((r) => r.data);

export const fetchJobAnalytics = (jobId) =>
    api.get(`/analytics/${jobId}`).then((r) => r.data);