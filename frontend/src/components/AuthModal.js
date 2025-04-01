
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();

  // Use environment variable for API base URL
  const API_BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5001';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();

      // Use login method from AuthContext
      login({
        id: data.user_id,
        username: data.username,
        role: data.role
      }, data.access_token);

      // Close modal
      onClose();
    } catch (err) {
      setError(err.message || 'Ошибка входа. Проверьте логин и пароль.');
      console.error('Login error:', err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role: 'user' // Default role
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка регистрации');
      }

      // After successful registration, switch to login
      setIsLogin(true);
      setEmail('');
      setError('Регистрация успешна. Теперь можете войти.');
    } catch (err) {
      setError(err.message);
      console.error('Registration error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96 relative">
        <button 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? 'Вход' : 'Регистрация'}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Имя пользователя
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-control w-full"
              placeholder="Введите имя пользователя"
              required
            />
          </div>

          {!isLogin && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control w-full"
                placeholder="Введите email"
                required={!isLogin}
              />
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control w-full"
              placeholder="Введите пароль"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <button 
              type="submit" 
              className="btn btn-primary w-full"
            >
              {isLogin ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          {isLogin ? (
            <p className="text-sm text-gray-600">
              Нет аккаунта? {' '}
              <button 
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }} 
                className="text-primary-color hover:underline"
              >
                Зарегистрируйтесь
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Уже есть аккаунт? {' '}
              <button 
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }} 
                className="text-primary-color hover:underline"
              >
                Войдите
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;