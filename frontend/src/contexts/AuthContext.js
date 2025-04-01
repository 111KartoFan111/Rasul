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
  // State variables for authentication
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);

  // Keys for localStorage from environment variables
  const TOKEN_KEY = process.env.REACT_APP_TOKEN_KEY || 'foodrush_user_token';
  const USER_KEY = process.env.REACT_APP_USER_KEY || 'foodrush_user_data';

  // Check authentication on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        setUser(parsedUser);
        setToken(storedToken);
        setRole(parsedUser.role);
        setIsAuthenticated(true);
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  }, [TOKEN_KEY, USER_KEY]);

  // Login function with comprehensive user data storage
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

  // Logout function to clear all authentication data
  const logout = useCallback(() => {
    // Remove user data and token from localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Reset all authentication states
    setUser(null);
    setToken(null);
    setRole(null);
    setIsAuthenticated(false);
  }, [TOKEN_KEY, USER_KEY]);

  // Context value with all authentication-related data and methods
  const contextValue = {
    user,
    isAuthenticated,
    login,
    logout,
    token,
    role
  };

  return (
    <AuthContext.Provider value={contextValue}>
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