import axios from 'axios';

// Create base Axios instance
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    // Fallback ID to satisfy backend auth requirement (will be dynamically updated later when Auth is fully integrated)
    'X-User-Id': '1'
  }
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
