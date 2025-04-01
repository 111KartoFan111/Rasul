import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    platformName: '',
    contactEmail: '',
    supportPhone: ''
  });

  // Загрузка настроек из API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const settingsData = await res.json();
        if (settingsData.length > 0) {
          setSettings(settingsData[0]);
        }
      } catch (err) {
        console.error(err.message);
      }
    };

    fetchSettings();
  }, []);

  // Обновление настроек в API
  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const updatedSettings = await res.json();
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Error saving settings:', err.message);
    }
  };

  // Обновление пароля в API
  const handleUpdatePassword = async () => {
    // Логика для обновления пароля
    // Например, можно добавить запрос к API для обновления пароля пользователя
  };

  return (
    <div>
      <h2 className="section-title mb-6">Settings</h2>
      <div className="card mb-8">
        <h3 className="card-title mb-4">General Settings</h3>
        <div className="form-group">
          <label className="form-label">Platform Name</label>
          <input
            type="text"
            className="form-control"
            value={settings.platformName}
            onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
            placeholder="Enter platform name"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Contact Email</label>
          <input
            type="email"
            className="form-control"
            value={settings.contactEmail}
            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            placeholder="Enter contact email"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Support Phone</label>
          <input
            type="tel"
            className="form-control"
            value={settings.supportPhone}
            onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
            placeholder="Enter support phone number"
          />
        </div>
        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={handleSaveSettings}>Save Changes</button>
        </div>
      </div>
      <div className="card">
        <h3 className="card-title mb-4">Security Settings</h3>
        <div className="form-group">
          <label className="form-label">Change Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Enter new password"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Confirm new password"
          />
        </div>
        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={handleUpdatePassword}>Update Password</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;