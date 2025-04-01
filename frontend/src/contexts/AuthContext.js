import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // При инициализации проверяем наличие данных пользователя в localStorage
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Очищаем данные аутентификации при ошибке
        logout();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Функция для входа пользователя
  const login = (userData, token) => {
    // Сохраняем данные в localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Обновляем состояние
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Функция для выхода пользователя
  const logout = () => {
    // Очищаем localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Обновляем состояние
    setUser(null);
    setIsAuthenticated(false);
  };

  // Контекстное значение, предоставляемое потребителям
  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}