import React, { useState, useEffect } from 'react';

const Analytics = ({ orders, drivers, restaurants }) => {
  // Временные периоды для фильтрации данных
  const [timeFilter, setTimeFilter] = useState('all');
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  
  // Метрики эффективности
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgDeliveryTime: 0,
    avgOrderValue: 0,
    topDrivers: [],
    topRestaurants: []
  });
  
  // Фиксированные значения, которые не меняются при фильтрации
  const totalDrivers = drivers.length;
  const totalRestaurants = restaurants.length;
  
  // Фильтрация заказов по временному периоду
  useEffect(() => {
    let filtered = [...orders];
    const now = new Date();
    
    if (timeFilter === 'today') {
      filtered = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === now.toDateString();
      });
    } else if (timeFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      filtered = orders.filter(order => new Date(order.createdAt) >= weekAgo);
    } else if (timeFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      filtered = orders.filter(order => new Date(order.createdAt) >= monthAgo);
    } else if (timeFilter === 'custom' && dateRange.start && dateRange.end) {
      filtered = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dateRange.start && orderDate <= dateRange.end;
      });
    }
    
    setFilteredOrders(filtered);
  }, [orders, timeFilter, dateRange]);
  
  // Расчет метрик эффективности
  useEffect(() => {
    // Среднее время доставки (от подтверждения до доставки)
    const completedOrders = filteredOrders.filter(order => order.status === 'delivered' && order.deliveredAt && order.confirmedAt);
    const totalDeliveryTime = completedOrders.reduce((sum, order) => {
      const deliveryTime = new Date(order.deliveredAt) - new Date(order.confirmedAt);
      return sum + deliveryTime;
    }, 0);
    
    const avgDeliveryTime = completedOrders.length > 0 
      ? Math.round(totalDeliveryTime / completedOrders.length / (1000 * 60)) // в минутах
      : 0;
    
    // Средняя стоимость заказа
    const avgOrderValue = filteredOrders.length > 0
      ? (filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0) / filteredOrders.length).toFixed(2)
      : 0;
    
    // Определение ТОП водителей по количеству доставок
    const driverDeliveries = {};
    filteredOrders.forEach(order => {
      if (order.driverId && order.status === 'delivered') {
        driverDeliveries[order.driverId] = (driverDeliveries[order.driverId] || 0) + 1;
      }
    });
    
    const topDrivers = Object.entries(driverDeliveries)
      .map(([driverId, count]) => {
        const driver = drivers.find(d => d.id === driverId);
        return { id: driverId, name: driver ? driver.name : 'Unknown', deliveries: count };
      })
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 5);
    
    // Определение ТОП ресторанов по объему продаж
    const restaurantSales = {};
    filteredOrders.forEach(order => {
      if (order.restaurantId) {
        restaurantSales[order.restaurantId] = (restaurantSales[order.restaurantId] || 0) + order.totalAmount;
      }
    });
    
    const topRestaurants = Object.entries(restaurantSales)
      .map(([restaurantId, sales]) => {
        const restaurant = restaurants.find(r => r.id === restaurantId);
        return { id: restaurantId, name: restaurant ? restaurant.name : 'Unknown', sales };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
    
    setPerformanceMetrics({ avgDeliveryTime, avgOrderValue, topDrivers, topRestaurants });
  }, [filteredOrders, drivers, restaurants]);

  // Расчет существующих метрик на основе отфильтрованных заказов
  const totalOrders = filteredOrders.length;
  const totalSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2);

  const orderStatuses = {
    new: filteredOrders.filter(order => order.status === 'new').length,
    assigned: filteredOrders.filter(order => order.status === 'assigned').length,
    preparing: filteredOrders.filter(order => order.status === 'preparing').length,
    transit: filteredOrders.filter(order => order.status === 'in-transit').length,
    delivered: filteredOrders.filter(order => order.status === 'delivered').length,
    cancelled: filteredOrders.filter(order => order.status === 'cancelled').length,
  };

  // Функция для расчета процентного соотношения заказов по статусам
  const calculatePercentage = (count) => {
    return totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
  };
  
  // Функция для форматирования времени
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
  };

  return (
    <div>
      <h2 className="section-title mb-6">Analytics</h2>
      
      {/* Панель фильтрации по времени */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <button 
            className={`btn ${timeFilter === 'all' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setTimeFilter('all')}
          >
            Все время
          </button>
          <button 
            className={`btn ${timeFilter === 'today' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setTimeFilter('today')}
          >
            Сегодня
          </button>
          <button 
            className={`btn ${timeFilter === 'week' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setTimeFilter('week')}
          >
            Неделя
          </button>
          <button 
            className={`btn ${timeFilter === 'month' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setTimeFilter('month')}
          >
            Месяц
          </button>
          <button 
            className={`btn ${timeFilter === 'custom' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setTimeFilter('custom')}
          >
            Выбрать период
          </button>
        </div>
        
        {timeFilter === 'custom' && (
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block mb-1">От</label>
              <input 
                type="date" 
                className="input" 
                value={dateRange.start ? dateRange.start.toISOString().substr(0, 10) : ''} 
                onChange={(e) => setDateRange({...dateRange, start: new Date(e.target.value)})}
              />
            </div>
            <div>
              <label className="block mb-1">До</label>
              <input 
                type="date" 
                className="input" 
                value={dateRange.end ? dateRange.end.toISOString().substr(0, 10) : ''} 
                onChange={(e) => setDateRange({...dateRange, end: new Date(e.target.value)})}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Основные метрики */}
      <div className="grid grid-cols-1 grid-cols-2-md grid-cols-4-lg gap-4 mb-8">
        <StatCard title="Всего заказов" value={totalOrders} />
        <StatCard title="Всего водителей" value={totalDrivers} />
        <StatCard title="Всего ресторанов" value={totalRestaurants} />
        <StatCard title="Общие продажи" value={`$${totalSales}`} />
      </div>
      
      {/* Расширенные метрики */}
      <div className="grid grid-cols-1 grid-cols-2-md grid-cols-4-lg gap-4 mb-8">
        <StatCard 
          title="Среднее время доставки" 
          value={formatTime(performanceMetrics.avgDeliveryTime)} 
          desc="От подтверждения до доставки"
        />
        <StatCard 
          title="Средний чек" 
          value={`$${performanceMetrics.avgOrderValue}`} 
          desc="Средняя стоимость заказа"
        />
        <StatCard 
          title="Доставлено заказов" 
          value={`${orderStatuses.delivered} (${calculatePercentage(orderStatuses.delivered)}%)`} 
          desc="От общего количества"
        />
        <StatCard 
          title="Отменено заказов" 
          value={`${orderStatuses.cancelled} (${calculatePercentage(orderStatuses.cancelled)}%)`} 
          desc="От общего количества"
        />
      </div>
      
      {/* Статусы заказов */}
      <div className="card mb-8">
        <h3 className="card-title mb-4">Статусы заказов</h3>
        <div className="flex gap-4 flex-wrap">
          <StatusPill label="Новый" count={orderStatuses.new} percentage={calculatePercentage(orderStatuses.new)} className="status-new" />
          <StatusPill label="Назначен" count={orderStatuses.assigned} percentage={calculatePercentage(orderStatuses.assigned)} className="status-assigned" />
          <StatusPill label="Готовится" count={orderStatuses.preparing} percentage={calculatePercentage(orderStatuses.preparing)} className="status-preparing" />
          <StatusPill label="В пути" count={orderStatuses.transit} percentage={calculatePercentage(orderStatuses.transit)} className="status-in-transit" />
          <StatusPill label="Доставлен" count={orderStatuses.delivered} percentage={calculatePercentage(orderStatuses.delivered)} className="status-delivered" />
          <StatusPill label="Отменен" count={orderStatuses.cancelled} percentage={calculatePercentage(orderStatuses.cancelled)} className="status-cancelled" />
        </div>
      </div>
      
      {/* Лучшие водители */}
      <div className="card mb-8">
        <h3 className="card-title mb-4">Лучшие водители</h3>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Водитель</th>
                <th>Количество доставок</th>
              </tr>
            </thead>
            <tbody>
              {performanceMetrics.topDrivers.map(driver => (
                <tr key={driver.id}>
                  <td>{driver.name}</td>
                  <td>{driver.deliveries}</td>
                </tr>
              ))}
              {performanceMetrics.topDrivers.length === 0 && (
                <tr>
                  <td colSpan="2" className="text-center py-4">Нет данных</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Лучшие рестораны */}
      <div className="card mb-8">
        <h3 className="card-title mb-4">Лучшие рестораны</h3>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Ресторан</th>
                <th>Объем продаж</th>
              </tr>
            </thead>
            <tbody>
              {performanceMetrics.topRestaurants.map(restaurant => (
                <tr key={restaurant.id}>
                  <td>{restaurant.name}</td>
                  <td>${restaurant.sales.toFixed(2)}</td>
                </tr>
              ))}
              {performanceMetrics.topRestaurants.length === 0 && (
                <tr>
                  <td colSpan="2" className="text-center py-4">Нет данных</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Улучшенный компонент карточки статистики
const StatCard = ({ title, value, desc }) => {
  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      {desc && <div className="stat-desc">{desc}</div>}
    </div>
  );
};

// Улучшенный компонент пилюли статуса
const StatusPill = ({ label, count, percentage, className }) => {
  return (
    <div className={`status-pill ${className}`}>
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="ml-2 font-bold">{count}</span>
      </div>
      <div className="mt-1 bg-gray-200 h-1 w-full rounded-full">
        <div 
          className="h-full rounded-full bg-current" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="text-xs mt-1">{percentage}%</div>
    </div>
  );
};

export default Analytics;