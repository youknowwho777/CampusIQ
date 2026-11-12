// Central Axios HTTP client instance with base URL, timeouts, and auth interceptors
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach Bearer token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusiq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthorized 401 response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid - redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('campusiq_token');
        // Optional redirect if needed
      }
    }
    return Promise.reject(error);
  }
);

export default api;
