import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor for adding token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling unauthorized errors
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, dispatch unauthorized event
      const logoutEvent = new CustomEvent('unauthorized');
      window.dispatchEvent(logoutEvent);
    }
    return Promise.reject(error);
  }
);

export default apiClient;