// src/utils/apiClient.js
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    // Try to parse error response
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      // If parsing fails, use status text
      errorData = { message: response.statusText };
    }

    // Log full error details
    console.error('API Error:', {
      status: response.status,
      url: response.url,
      errorData
    });

    throw {
      status: response.status,
      message: errorData.detail || errorData.message || 'An unexpected error occurred'
    };
  }
  return response.json();
};

const apiClient = {
  get: async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      },
      ...options
    });
    return handleResponse(response);
  },

  post: async (endpoint, body, options = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      },
      body: JSON.stringify(body),
      ...options
    });
    return handleResponse(response);
  },

  put: async (endpoint, body, options = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      },
      body: JSON.stringify(body),
      ...options
    });
    return handleResponse(response);
  },

  delete: async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      },
      ...options
    });
    return handleResponse(response);
  }
};

export default apiClient;