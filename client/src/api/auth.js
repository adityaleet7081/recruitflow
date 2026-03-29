import api from './axios';

export const registerAPI = (data) => api.post('/auth/register', data);
export const loginAPI = (data) => api.post('/auth/login', data);
export const logoutAPI = (data) => api.post('/auth/logout', data);
export const getMeAPI = () => api.get('/auth/me');