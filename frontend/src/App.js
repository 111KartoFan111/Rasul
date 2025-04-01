import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import OrderManagement from './components/OrderManagement';
import DriverManagement from './components/DriverManagement';
import RestaurantManagement from './components/RestaurantManagement';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Load initial data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersRes = await fetch('/api/orders');
        const ordersData = await ordersRes.json();
        setOrders(ordersData);

        const driversRes = await fetch('/api/drivers');
        const driversData = await driversRes.json();
        setDrivers(driversData);

        const restaurantsRes = await fetch('/api/restaurants');
        const restaurantsData = await restaurantsRes.json();
        setRestaurants(restaurantsData);

        const customersRes = await fetch('/api/customers');
        const customersData = await customersRes.json();
        setCustomers(customersData);
      } catch (err) {
        console.error(err.message);
      }
    };

    fetchData();
  }, []);

  // Functions to manage orders
  const assignDriver = async (orderId, driverId) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, status: 'assigned' })
      });
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, driverId, status: 'assigned' } : order
      );
      setOrders(updatedOrders);
    } catch (err) {
      console.error('Error assigning driver:', err.message);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status } : order
      );
      setOrders(updatedOrders);
    } catch (err) {
      console.error('Error updating order status:', err.message);
    }
  };

  const addNewOrder = (order) => {
    setOrders([...orders, order]);
  };

  // Render active tab content
  const renderContent = () => {
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
          <div className="user-profile">
            <span className="user-role">Admin</span>
            <div className="user-avatar">A</div>
          </div>
        </div>
      </header>

      {/* Navigation */}
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
        <svg xmlns="http://www.w3.org/2000/svg" fill="inherit" viewBox="0 0 20 20" height="20" width="20" className="icon settings">        </svg>
        <span>Settings</span>
      </label>
    </section>
  </div>
</nav>

      {/* Main Content */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;