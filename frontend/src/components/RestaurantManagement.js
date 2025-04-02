import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient'; // Импортируем apiClient

const RestaurantManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [newRestaurant, setNewRestaurant] = useState({ 
    name: '', 
    address: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [animateItem, setAnimateItem] = useState(null);

  // Загрузка ресторанов
  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/restaurants'); // Используем apiClient
        setRestaurants(response); // response уже содержит данные благодаря интерцептору
      } catch (error) {
        console.error('Detailed error:', error);
        
        if (error.response) {
          setError(`Ошибка загрузки: ${error.response.data.message || 'Неизвестная ошибка'}`);
        } else if (error.request) {
          setError('Нет ответа от сервера');
        } else {
          setError(`Ошибка: ${error.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  // Добавление нового ресторана
  const handleAddRestaurant = async () => {
    if (!newRestaurant.name.trim() || !newRestaurant.address.trim()) {
      setError('Введите название и Мекен-жайы ресторана');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/restaurants', {
        name: newRestaurant.name.trim(),
        address: newRestaurant.address.trim()
      });

      setRestaurants(prevRestaurants => [...prevRestaurants, response]);
      setSuccessMessage('Ресторан успешно добавлен!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setAnimateItem(response.id);
      setTimeout(() => setAnimateItem(null), 1000);
      setNewRestaurant({ name: '', address: '' });
    } catch (error) {
      console.error('Ошибка добавления ресторана:', error);
      
      if (error.response) {
        setError(`Не удалось добавить ресторан: ${error.response.data.message || 'Неизвестная ошибка'}`);
      } else {
        setError('Не удалось добавить ресторан. Проверьте подключение.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление ресторана
  const handleUpdateRestaurant = async (id) => {
    if (!restaurants.find(r => r.id === id)) return;
    
    const restaurant = restaurants.find(r => r.id === id);
    
    try {
      await apiClient.put(`/restaurants/${id}`, { 
        name: restaurant.name, 
        address: restaurant.address 
      });
      
      setSuccessMessage('Ресторан успешно обновлен!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsEditing(prev => ({...prev, [id]: false}));
      setAnimateItem(id);
      setTimeout(() => setAnimateItem(null), 1000);
    } catch (error) {
      console.error('Ошибка обновления ресторана:', error);
      
      if (error.response) {
        setError(`Не удалось обновить ресторан: ${error.response.data.message || 'Неизвестная ошибка'}`);
      } else {
        setError('Не удалось обновить ресторан');
      }
    }
  };

  // Удаление ресторана
  const handleDeleteRestaurant = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот ресторан?')) return;
    
    try {
      await apiClient.delete(`/restaurants/${id}`);
      
      setRestaurants(prevRestaurants => prevRestaurants.filter(r => r.id !== id));
      setSuccessMessage('Ресторан успешно удален!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Ошибка удаления ресторана:', error);
      
      if (error.response) {
        setError(`Не удалось удалить ресторан: ${error.response.data.message || 'Неизвестная ошибка'}`);
      } else {
        setError('Не удалось удалить ресторан');
      }
    }
  };

  // Обработчик изменения полей ресторана
  const handleRestaurantChange = (id, field, value) => {
    const updatedRestaurants = restaurants.map(restaurant =>
      restaurant.id === id ? { ...restaurant, [field]: value } : restaurant
    );
    setRestaurants(updatedRestaurants);
  };

  // Включение режима редактирования
  const toggleEditMode = (id) => {
    setIsEditing(prev => ({...prev, [id]: !prev[id]}));
  };

  return (
    <div className="page-container">
      <div className="section-title">Мейрамханаларды басқару</div>
      
      {/* Уведомления */}
      {error && (
        <div className="animate-in" role="alert" style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: 'rgb(153, 27, 27)',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="animate-in" role="alert" style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          color: 'rgb(6, 95, 70)',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{successMessage}</span>
          </div>
        </div>
      )}
      
      {/* Форма добавления ресторана */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">Жаңа мейрамхана қосу</h3>
        </div>
        <div className="grid grid-cols-1 grid-cols-2-md gap-4 mb-4">
          <div className="form-group">
            <label className="form-label">Мейрамхана атауы</label>
            <input
              type="text"
              className="form-control"
              value={newRestaurant.name}
              onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
              placeholder="Мейрамхана атауын енгізіңіз"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Мекен-жайы</label>
            <input
              type="text"
              className="form-control"
              value={newRestaurant.address}
              onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
              placeholder="Мейрамхананың мекенжайын енгізіңіз"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="btn btn-primary"
            onClick={handleAddRestaurant}
            disabled={isLoading || !newRestaurant.name.trim() || !newRestaurant.address.trim()}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                Добавление...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Добавить ресторан
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Список ресторанов */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Список ресторанов</h3>
        </div>
        {isLoading && !restaurants.length ? (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center">
              <svg className="animate-spin mb-4" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
              <span>Загрузка ресторанов...</span>
            </div>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center text-center">
              <svg className="mb-4" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span className="text-gray-600">Рестораны не найдены</span>
              <p className="mt-2 text-gray-500">Добавьте первый ресторан, используя форму выше</p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Мекен-жайы</th>
                  <th>Әрекеттер</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((restaurant) => (
                  <tr 
                    key={restaurant.id} 
                    className={animateItem === restaurant.id ? "animate-in" : ""}
                    style={{
                      transition: "all 0.3s ease"
                    }}
                  >
                    <td>{restaurant.id}</td>
                    <td>
                      {isEditing[restaurant.id] ? (
                        <input
                          type="text"
                          className="form-control"
                          value={restaurant.name}
                          onChange={(e) => handleRestaurantChange(restaurant.id, 'name', e.target.value)}
                        />
                      ) : (
                        <span>{restaurant.name}</span>
                      )}
                    </td>
                    <td>
                      {isEditing[restaurant.id] ? (
                        <input
                          type="text"
                          className="form-control"
                          value={restaurant.address}
                          onChange={(e) => handleRestaurantChange(restaurant.id, 'address', e.target.value)}
                        />
                      ) : (
                        <span>{restaurant.address}</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {isEditing[restaurant.id] ? (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleUpdateRestaurant(restaurant.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              Сақтау
                            </button>
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => toggleEditMode(restaurant.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                              Болдырмау
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-info btn-sm"
                              onClick={() => toggleEditMode(restaurant.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                              Өзгерту
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteRestaurant(restaurant.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                              Өшіру
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantManagement;