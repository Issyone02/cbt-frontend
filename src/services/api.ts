import axios from 'axios';

// In local dev, Vite proxies /api → http://localhost:5000 (see vite.config.ts).
// In production (Render static site), VITE_API_URL is set to the backend URL
// e.g. https://cbt-backend-xxxx.onrender.com — so requests go directly there.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({ baseURL });

// Attach JWT token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle expired / invalid tokens globally.
// On 401: attempt to log the session end server-side, then clear local state.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to record the forced logout (token expiry) — fire and forget
      const token = localStorage.getItem('token');
      if (token && error.config?.url !== '/auth/logout') {
        try {
          // Use the same api instance (not raw axios) so this also respects
          // VITE_API_URL on Render instead of always hitting the relative path.
          await api.post('/auth/logout', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch {
          // Ignore — token may already be invalid
        }
      }
      // Clear all local auth state
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('currentAttempt');
      localStorage.removeItem('mustChangePassword');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
