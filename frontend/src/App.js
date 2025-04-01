import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import OrderManagement from './components/OrderManagement';
import DriverManagement from './components/DriverManagement';
import RestaurantManagement from './components/RestaurantManagement';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import AuthModal from './components/AuthModal';
import apiClient from './utils/apiClient';
import './App.css';

import { useAuth } from './contexts/AuthContext';

const AppContent = () => {
  const authContext = useAuth();
  console.log("Auth context:", authContext);
  const { user = null, isAuthenticated = false, logout = () => {}, loading = true } = authContext || {};
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(false);


  // Обработка неавторизованного доступа
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      setIsAuthModalOpen(true);
    };

    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [logout]);

  // Загрузка данных только после завершения инициализации аутентификации
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || loading) return;

      setIsLoading(true);
      setError(null);

      try {
        const [ordersData, driversData, restaurantsData, customersData] = await Promise.all([
          apiClient.get('/orders'),
          apiClient.get('/drivers'),
          apiClient.get('/restaurants'),
          apiClient.get('/customers')
        ]);

        setOrders(ordersData);
        setDrivers(driversData);
        setRestaurants(restaurantsData);
        setCustomers(customersData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.message);
        
        if (err.status === 401) {
          setAuthError(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (authError) {
      logout();
      setIsAuthModalOpen(true);
      setAuthError(false); // Сбрасываем флаг после обработки
    }
  }, [authError, logout]);

  // Функции для работы с заказами
  const assignDriver = async (orderId, driverId) => {
    try {
      const updatedOrder = await apiClient.put(`/orders/${orderId}/assign-driver`, { 
        driverId, 
        driverName: drivers.find(d => d.id === driverId)?.name 
      });
      
      const updatedOrders = orders.map(order =>
        order.id === orderId ? updatedOrder : order
      );
      setOrders(updatedOrders);
    } catch (err) {
      console.error('Error assigning driver:', err.message);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const updatedOrder = await apiClient.put(`/orders/${orderId}/status`, { status });
      
      const updatedOrders = orders.map(order =>
        order.id === orderId ? updatedOrder : order
      );
      setOrders(updatedOrders);
    } catch (err) {
      console.error('Error updating order status:', err.message);
    }
  };

  const addNewOrder = (order) => {
    setOrders([order, ...orders]);
  };

  // Отображение активной вкладки
  const renderContent = () => {
    // Показываем индикатор загрузки, пока проверяется аутентификация
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <p className="text-xl mb-4">Загрузка...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Показываем приглашение на вход, если пользователь не аутентифицирован
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <h2 className="text-2xl mb-4">Пожалуйста, войдите в систему</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setIsAuthModalOpen(true)}
            >
              Войти
            </button>
          </div>
        </div>
      );
    }

    // Показываем индикатор загрузки данных
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <p className="text-xl mb-4">Загрузка данных...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard orders={orders} drivers={drivers} restaurants={restaurants} />;
      case 'orders':
        return <OrderManagement
          orders={orders}
          drivers={drivers}
          restaurants={restaurants}
          customers={customers}
          updateStatus={updateOrderStatus}
          assignDriver={assignDriver}
          addNewOrder={addNewOrder}
        />;
      case 'drivers':
        return <DriverManagement drivers={drivers} setDrivers={setDrivers} />;
      case 'restaurants':
        return <RestaurantManagement restaurants={restaurants} setRestaurants={setRestaurants} />;
      case 'analytics':
        return <Analytics orders={orders} drivers={drivers} restaurants={restaurants} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard orders={orders} drivers={drivers} restaurants={restaurants} />;
    }
  };

  return (
    <div className="app-container animate-in">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="app-title">FoodRush Delivery Management</h1>
          <div 
            className="user-profile cursor-pointer"
            onClick={() => isAuthenticated ? logout() : setIsAuthModalOpen(true)}
          >
            {isAuthenticated && user ? (
              <>
                <div className="user-info">
                  <p className="user-name">{user.username}</p>
                  <p className="user-role">{user.role}</p>
                </div>
                <div className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </>
            ) : (
              <div className="user-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      {isAuthenticated && (
        <nav className="main-nav">
          <div className="nav-content">
            <section className="nav-links">
              <label title="Dashboard" htmlFor="dashboard" className={`label dashboard-hover ${activeTab === 'dashboard' ? 'active' : ''}`}>
                <input id="dashboard" name="page" type="radio" checked={activeTab === 'dashboard'} onChange={() => setActiveTab('dashboard')} />
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 20" height="20" width="20" className="icon home">
                </svg>
                <span>Dashboard</span>
              </label>
              <label title="Orders" htmlFor="orders" className={`label orders-hover ${activeTab === 'orders' ? 'active' : ''}`}>
                <input id="orders" name="page" type="radio" checked={activeTab === 'orders'} onChange={() => setActiveTab('orders')} />
                <svg xmlns="http://www.w3.org/2000/svg" fill="inherit" viewBox="0 0 18 20" height="20" width="20" className="icon cart">
                </svg>
                <span>Orders</span>
              </label>
              <label title="Drivers" htmlFor="drivers" className={`label drivers-hover ${activeTab === 'drivers' ? 'active' : ''}`}>
                <input id="drivers" name="page" type="radio" checked={activeTab === 'drivers'} onChange={() => setActiveTab('drivers')} />
                <svg xmlns="http://www.w3.org/2000/svg" fill="inherit" viewBox="0 0 20 20" height="20" width="20" className="icon car">
                </svg>
                <span>Drivers</span>
              </label>
              <label title="Restaurants" htmlFor="restaurants" className={`label restaurants-hover ${activeTab === 'restaurants' ? 'active' : ''}`}>
                <input id="restaurants" name="page" type="radio" checked={activeTab === 'restaurants'} onChange={() => setActiveTab('restaurants')} />
                <svg xmlns="http://www.w3.org/2000/svg" fill="inherit" viewBox="0 0 20 20" height="20" width="20" className="icon restaurant">
                </svg>
                <span>Restaurants</span>
              </label>
              <label title="Analytics" htmlFor="analytics" className={`label analytics-hover ${activeTab === 'analytics' ? 'active' : ''}`}>
                <input id="analytics" name="page" type="radio" checked={activeTab === 'analytics'} onChange={() => setActiveTab('analytics')} />
                <svg xmlns="http://www.w3.org/2000/svg" fill="inherit" viewBox="0 0 20 20" height="20" width="20" className="icon analytics">
                </svg>
                <span>Analytics</span>
              </label>
              <label title="Settings" htmlFor="settings" className={`label settings-hover ${activeTab === 'settings' ? 'active' : ''}`}>
                <input id="settings" name="page" type="radio" checked={activeTab === 'settings'} onChange={() => setActiveTab('settings')} />
                <svg xmlns="http://www.w3.org/2000/svg" fill="inherit" viewBox="0 0 20 20" height="20" width="20" className="icon settings">
                </svg>
                <span>Settings</span>
              </label>
            </section>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="main-content">
        {renderContent()}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default AppContent;