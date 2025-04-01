const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    console.error('API Error:', {
      status: response.status,
      url: response.url,
      errorData
    });

    // Specific handling for authentication errors
    if (response.status === 401) {
        // Trigger logout event
        const logoutEvent = new CustomEvent('unauthorized');
        window.dispatchEvent(logoutEvent);  
      }

    const error = new Error(
      errorData.detail || errorData.message || 'An unexpected error occurred'
    );
    error.status = response.status;
    error.data = errorData;

    throw error;
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
  // Similar updates for post, put, delete methods
};

export default apiClient;