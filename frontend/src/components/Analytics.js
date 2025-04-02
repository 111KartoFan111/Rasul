import React, { useState, useEffect } from 'react';

const Analytics = ({ orders, drivers, restaurants }) => {
  // Уақыт кезеңдері бойынша деректерді сүзу
  const [timeFilter, setTimeFilter] = useState('all');
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  
  // Тиімділік метрикалары
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgDeliveryTime: 0,
    avgOrderValue: 0,
    topDrivers: [],
    topRestaurants: []
  });
  
  // Сүзгілеу кезінде өзгермейтін тұрақты мәндер
  const totalDrivers = drivers.length;
  const totalRestaurants = restaurants.length;
  
  // Тапсырмаларды уақыт кезеңі бойынша сүзу
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
  
  // Тиімділік метрикаларын есептеу
  useEffect(() => {
    // Орташа жеткізу уақыты (расталғаннан жеткізілгенге дейін)
    const completedOrders = filteredOrders.filter(order => order.status === 'delivered' && order.deliveredAt && order.confirmedAt);
    const totalDeliveryTime = completedOrders.reduce((sum, order) => {
      const deliveryTime = new Date(order.deliveredAt) - new Date(order.confirmedAt);
      return sum + deliveryTime;
    }, 0);
    
    const avgDeliveryTime = completedOrders.length > 0 
      ? Math.round(totalDeliveryTime / completedOrders.length / (1000 * 60)) // минутпен
      : 0;
    
    // Орташа тапсырыс құны
    const avgOrderValue = filteredOrders.length > 0
      ? (filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0) / filteredOrders.length).toFixed(2)
      : 0;
    
    // Жеткізілім саны бойынша үздік жүргізушілерді анықтау
    const driverDeliveries = {};
    filteredOrders.forEach(order => {
      if (order.driverId && order.status === 'delivered') {
        driverDeliveries[order.driverId] = (driverDeliveries[order.driverId] || 0) + 1;
      }
    });
    
    const topDrivers = Object.entries(driverDeliveries)
      .map(([driverId, count]) => {
        const driver = drivers.find(d => d.id === driverId);
        return { id: driverId, name: driver ? driver.name : 'Белгісіз', deliveries: count };
      })
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 5);
    
    // Сату көлемі бойынша үздік мейрамханаларды анықтау
    const restaurantSales = {};
    filteredOrders.forEach(order => {
      if (order.restaurantId) {
        restaurantSales[order.restaurantId] = (restaurantSales[order.restaurantId] || 0) + order.totalAmount;
      }
    });
    
    const topRestaurants = Object.entries(restaurantSales)
      .map(([restaurantId, sales]) => {
        const restaurant = restaurants.find(r => r.id === restaurantId);
        return { id: restaurantId, name: restaurant ? restaurant.name : 'Белгісіз', sales };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
    
    setPerformanceMetrics({ avgDeliveryTime, avgOrderValue, topDrivers, topRestaurants });
  }, [filteredOrders, drivers, restaurants]);

  // Сүзілген тапсырмалар негізінде қолданыстағы метрикаларды есептеу
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

  // Тапсырыс статусы бойынша пайыздық қатынасты есептеу функциясы
  const calculatePercentage = (count) => {
    return totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
  };
  
  // Уақытты пішімдеу функциясы
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}с ${mins}м` : `${mins}м`;
  };

  return (
    <div>
      <h2 className="section-title mb-6">Аналитика</h2>
      
      {/* Уақыт бойынша сүзгілеу панелі */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <button 
            className={`btn ${timeFilter === 'all' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setTimeFilter('all')}
          >
            Барлық уақытта
          </button>
          <button 
            className={`btn ${timeFilter === 'today' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setTimeFilter('today')}
          >
            Бүгін
          </button>
          <button 
            className={`btn ${timeFilter === 'week' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setTimeFilter('week')}
          >
            Апта
          </button>
          <button 
            className={`btn ${timeFilter === 'month' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setTimeFilter('month')}
          >
            Ай
          </button>
          <button 
            className={`btn ${timeFilter === 'custom' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setTimeFilter('custom')}
          >
            Кезеңді таңдау
          </button>
        </div>
        
        {timeFilter === 'custom' && (
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block mb-1">Басталуы</label>
              <input 
                type="date" 
                className="input" 
                value={dateRange.start ? dateRange.start.toISOString().substr(0, 10) : ''} 
                onChange={(e) => setDateRange({...dateRange, start: new Date(e.target.value)})}
              />
            </div>
            <div>
              <label className="block mb-1">Аяқталуы</label>
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
      
      {/* Негізгі метрикалар */}
      <div className="grid grid-cols-1 grid-cols-2-md grid-cols-4-lg gap-4 mb-8">
        <StatCard title="Барлық тапсырыстар" value={totalOrders} />
        <StatCard title="Барлық жүргізушілер" value={totalDrivers} />
        <StatCard title="Барлық мейрамханалар" value={totalRestaurants} />
        <StatCard title="Жалпы сату" value={`$${totalSales}`} />
      </div>
      
      {/* Кеңейтілген метрикалар */}
      <div className="grid grid-cols-1 grid-cols-2-md grid-cols-4-lg gap-4 mb-8">
        <StatCard 
          title="Орташа жеткізу уақыты" 
          value={formatTime(performanceMetrics.avgDeliveryTime)} 
          desc="Растаудан жеткізуге дейін"
        />
        <StatCard 
          title="Орташа чек" 
          value={`$${performanceMetrics.avgOrderValue}`} 
          desc="Тапсырыстың орташа құны"
        />
        <StatCard 
          title="Жеткізілген тапсырыстар" 
          value={`${orderStatuses.delivered} (${calculatePercentage(orderStatuses.delivered)}%)`} 
          desc="Жалпы саннан"
        />
        <StatCard 
          title="Жойылған тапсырыстар" 
          value={`${orderStatuses.cancelled} (${calculatePercentage(orderStatuses.cancelled)}%)`} 
          desc="Жалпы саннан"
        />
      </div>
      
      {/* Тапсырыс статусы */}
      <div className="card mb-8">
        <h3 className="card-title mb-4">Тапсырыс статусы</h3>
        <div className="flex gap-4 flex-wrap">
          <StatusPill label="Жаңа" count={orderStatuses.new} percentage={calculatePercentage(orderStatuses.new)} className="status-new" />
          <StatusPill label="Тағайындалған" count={orderStatuses.assigned} percentage={calculatePercentage(orderStatuses.assigned)} className="status-assigned" />
          <StatusPill label="Дайындалуда" count={orderStatuses.preparing} percentage={calculatePercentage(orderStatuses.preparing)} className="status-preparing" />
          <StatusPill label="Жолда" count={orderStatuses.transit} percentage={calculatePercentage(orderStatuses.transit)} className="status-in-transit" />
          <StatusPill label="Жеткізілді" count={orderStatuses.delivered} percentage={calculatePercentage(orderStatuses.delivered)} className="status-delivered" />
          <StatusPill label="Жойылды" count={orderStatuses.cancelled} percentage={calculatePercentage(orderStatuses.cancelled)} className="status-cancelled" />
        </div>
      </div>
      
      {/* Үздік жүргізушілер */}
      <div className="card mb-8">
        <h3 className="card-title mb-4">Үздік жүргізушілер</h3>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Жүргізуші</th>
                <th>Жеткізілім саны</th>
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
                  <td colSpan="2" className="text-center py-4">Деректер жоқ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Үздік мейрамханалар */}
      <div className="card mb-8">
        <h3 className="card-title mb-4">Үздік мейрамханалар</h3>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Мейрамхана</th>
                <th>Сату көлемі</th>
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
                  <td colSpan="2" className="text-center py-4">Деректер жоқ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Жақсартылған статистика карточкасы компоненті
const StatCard = ({ title, value, desc }) => {
  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      {desc && <div className="stat-desc">{desc}</div>}
    </div>
  );
};

// Жақсартылған статус пилюлясы компоненті
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