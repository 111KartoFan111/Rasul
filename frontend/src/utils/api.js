import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor for adding token
api.interceptors.request.use(
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
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, logout user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;