import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient'; // Импортируем apiClient

const Settings = () => {
  const [settings, setSettings] = useState({
    platformName: '',
    contactEmail: '',
    supportPhone: '',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Загрузка настроек из API
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/settings');
        if (response && response.length > 0) {
          setSettings(response[0]); // Предполагаем, что сервер возвращает массив с одним объектом
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Не удалось загрузить настройки. Попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Обновление настроек в API
  const handleSaveSettings = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      const response = await apiClient.post('/settings', settings);
      setSettings(response); // Обновляем локальное состояние с данными от сервера
      setSuccessMessage('Настройки успешно сохранены!');
      setTimeout(() => setSuccessMessage(''), 3000); // Скрываем сообщение через 3 секунды
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Не удалось сохранить настройки. Проверьте данные и попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление пароля в API
  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      await apiClient.put('/settings/password', {
        password: passwordData.newPassword,
      });
      setSuccessMessage('Пароль успешно обновлен!');
      setPasswordData({ newPassword: '', confirmPassword: '' }); // Очищаем поля
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Не удалось обновить пароль. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="section-title mb-6">Параметрлер</h2>

      {/* Уведомления */}
      {error && (
        <div
          className="animate-in"
          role="alert"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: 'rgb(153, 27, 27)',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
      {successMessage && (
        <div
          className="animate-in"
          role="alert"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: 'rgb(6, 95, 70)',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Общие настройки */}
      <div className="card mb-8">
        <h3 className="card-title mb-4">Жалпы параметрлер</h3>
        {isLoading && (
          <div className="flex justify-center py-4">
            <svg
              className="animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
          </div>
        )}
        {!isLoading && (
          <>
            <div className="form-group">
              <label className="form-label">Платформаның атауы</label>
              <input
                type="text"
                className="form-control"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                placeholder="Платформаның атауын енгізіңіз"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Контактілік электрондық пошта</label>
              <input
                type="email"
                className="form-control"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                placeholder="Контактілік электрондық пошта мекенжайын енгізіңіз "
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Қолдау телефоны</label>
              <input
                type="tel"
                className="form-control"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                placeholder="Қолдау телефонының нөмірін енгізіңіз"
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end">
              <button
                className="btn btn-primary"
                onClick={handleSaveSettings}
                disabled={isLoading}
              >
                {isLoading ? 'Сақтау...' : 'Өзгертулерді сақтау'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;