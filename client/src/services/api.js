import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicx_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 auto-logout
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('civicx_token');
      localStorage.removeItem('civicx_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
