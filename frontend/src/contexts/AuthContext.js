import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Create authentication context with default values
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  token: null,
  role: null
});

// Authentication Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [authError, setAuthError] = useState(false);

  const TOKEN_KEY = process.env.REACT_APP_TOKEN_KEY || 'foodrush_user_token';
  const USER_KEY = process.env.REACT_APP_USER_KEY || 'foodrush_user_data';

  const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

  // Validate token with backend
  const validateToken = async (token) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/users/me`, {
        method: 'GET', 
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Invalid token');
      }
        
      return await response.json();
    } catch (error) {
      return null;
    }  
  };

  const logout = useCallback(() => {
    // Remove user data and token from localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Reset all authentication states
    setUser(null);
    setToken(null);
    setRole(null);
    setIsAuthenticated(false);

    // Optional: Redirect to login page
    window.location.href = '/login';
  }, [TOKEN_KEY, USER_KEY]);

  // Enhanced token check on mount
  useEffect(() => {
    const checkTokenValidity = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
  
      if (storedToken && storedUser) {
        try {
          JSON.parse(storedUser); // Используем parsedUser, чтобы избежать предупреждения ESLint
          const validatedUser = await validateToken(storedToken);
  
          if (validatedUser) {
            setUser(validatedUser);
            setToken(storedToken);
            setRole(validatedUser.role);
            setIsAuthenticated(true);
          } else {
            throw new Error('Invalid token');
          }
        } catch (error) {
          // Clear invalid stored data and set auth error
          setAuthError(true);
        }
      }
    };
  
    checkTokenValidity();
  }, [TOKEN_KEY, USER_KEY, validateToken]);
  
  useEffect(() => {
    if (authError) {
      logout();
    }
  }, [authError, logout]);
  

  const login = useCallback((userData, authToken) => {
    // Store user data and token in localStorage
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));

    // Update state
    setUser(userData);
    setToken(authToken);
    setRole(userData.role);
    setIsAuthenticated(true);
  }, [TOKEN_KEY, USER_KEY]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      logout, 
      token, 
      role 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access to authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Higher-order component for route protection
export const withAuth = (WrappedComponent) => {
  return (props) => {
    const { isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
      // Redirect to login or show login prompt
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl mb-4">Пожалуйста, войдите в систему</h2>
            <button 
              className="btn btn-primary"
              onClick={() => {
                // Trigger login modal 
                window.dispatchEvent(new CustomEvent('open-login-modal'));
              }}
            >
              Войти
            </button>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};