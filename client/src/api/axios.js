import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true,
});

// Helper — read token from Zustand persisted storage
const getAccessToken = () => {
    try {
        const raw = localStorage.getItem('recruitflow-auth');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.state?.accessToken || null;
    } catch {
        return null;
    }
};

// Helper — update token inside Zustand persisted storage
const setAccessToken = (token) => {
    try {
        const raw = localStorage.getItem('recruitflow-auth');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        parsed.state.accessToken = token;
        localStorage.setItem('recruitflow-auth', JSON.stringify(parsed));
    } catch { }
};

// Request interceptor — attach access token to every request
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — on 401, try refresh then retry
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/auth/refresh') &&
            !originalRequest.url.includes('/auth/login')
        ) {
            originalRequest._retry = true;
            try {
                const res = await axios.post(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                const newToken = res.data.accessToken;
                setAccessToken(newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('recruitflow-auth');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;