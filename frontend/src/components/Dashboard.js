import React, { useState, useEffect } from 'react';
import { LineChart, AreaChart, BarChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Calendar, Clock, TrendingUp, DollarSign, Truck, Store, AlertCircle, Package } from 'lucide-react';

const Dashboard = ({ orders = [], drivers = [], restaurants = [] }) => {
  // State for animations
  const [animate, setAnimate] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [loadingStats, setLoadingStats] = useState(true);

  // Trigger animations on load
  useEffect(() => {
    setAnimate(true);
    // Simulate loading
    const timer = setTimeout(() => {
      setLoadingStats(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Calculate stats
  const activeOrders = orders.filter(order => ['new', 'assigned', 'preparing', 'in-transit'].includes(order.status)).length;
  const availableDrivers = drivers.filter(driver => driver.status === 'available').length;
  const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2);
  
  // Calculate order status breakdowns
  const orderStatuses = {
    new: orders.filter(order => order.status === 'new').length,
    assigned: orders.filter(order => order.status === 'assigned').length,
    preparing: orders.filter(order => order.status === 'preparing').length,
    transit: orders.filter(order => order.status === 'in-transit').length,
    delivered: orders.filter(order => order.status === 'delivered').length,
    cancelled: orders.filter(order => order.status === 'cancelled').length
  };

  // Function to format time
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
  };

  // Function to calculate average delivery time
  const calculateAverageDeliveryTime = () => {
    const completedOrders = orders.filter(order => order.status === 'delivered' && order.deliveredAt && order.confirmedAt);
    const totalDeliveryTime = completedOrders.reduce((sum, order) => {
      const deliveryTime = new Date(order.deliveredAt) - new Date(order.confirmedAt);
      return sum + deliveryTime;
    }, 0);
    const avgDeliveryTime = completedOrders.length > 0 
      ? Math.round(totalDeliveryTime / completedOrders.length / (1000 * 60)) // в минутах
      : 0;
    return formatTime(avgDeliveryTime);
  };

  // Function to calculate average order value
  const calculateAverageOrderValue = () => {
    const validOrders = orders.filter(order => order.totalAmount !== undefined && order.totalAmount !== null);
    const avgOrderValue = validOrders.length > 0
      ? (validOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / validOrders.length).toFixed(2)
      : '0.00';
    return `$${avgOrderValue}`;
  };

  // Calculate completion rate
  const calculateCompletionRate = () => {
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    const totalOrdersExcludingNew = orders.filter(order => order.status !== 'new').length;
    return totalOrdersExcludingNew > 0
      ? ((completedOrders / totalOrdersExcludingNew) * 100).toFixed(1)
      : '0.0';
  };

  // Generate sales data for charts
  const generateTimeData = () => {
    // This would normally come from backend with proper aggregation
    // Mocking data for demonstration
    let labels = [];
    let data = [];
    
    if (timeRange === 'day') {
      labels = ['8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'];
      data = [1200, 1900, 3000, 2400, 2800, 3500, 3000, 1500];
    } else if (timeRange === 'week') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      data = [15000, 12000, 18000, 16000, 22000, 30000, 25000];
    } else if (timeRange === 'month') {
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      data = [72000, 85000, 90000, 88000];
    }
    
    return labels.map((label, index) => ({
      name: label,
      value: data[index]
    }));
  };

  // Generate order status data for charts
  const getOrderStatusData = () => {
    return [
      { name: 'New', value: orderStatuses.new, color: '#f59e0b' },
      { name: 'Assigned', value: orderStatuses.assigned, color: '#3b82f6' },
      { name: 'Preparing', value: orderStatuses.preparing, color: '#8b5cf6' },
      { name: 'In Transit', value: orderStatuses.transit, color: '#4f46e5' },
      { name: 'Delivered', value: orderStatuses.delivered, color: '#10b981' },
      { name: 'Cancelled', value: orderStatuses.cancelled, color: '#ef4444' }
    ];
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get order status background color
  const getStatusBgColor = (status) => {
    const statusColors = {
      'new': 'bg-amber-100 text-amber-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'preparing': 'bg-purple-100 text-purple-800',
      'in-transit': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`transition-all duration-500 ${animate ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">Dashboard Overview</h2>
        <div className="flex gap-2">
          <button 
            className={`btn ${timeRange === 'day' ? 'btn-primary' : 'btn-info'}`}
            onClick={() => setTimeRange('day')}
          >
            Day
          </button>
          <button 
            className={`btn ${timeRange === 'week' ? 'btn-primary' : 'btn-info'}`}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button 
            className={`btn ${timeRange === 'month' ? 'btn-primary' : 'btn-info'}`}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
        </div>
      </div>
      
      {/* Stats Grid with Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Active Orders" 
          value={loadingStats ? '-' : activeOrders}
          icon={<Package size={22} />}
          change="+12% from last week"
          delay={100}
          color="primary"
          isLoading={loadingStats}
        />
        <StatCard 
          title="Available Drivers" 
          value={loadingStats ? '-' : availableDrivers}
          icon={<Truck size={22} />}
          change="+5% from last week"
          delay={200}
          color="warning"
          isLoading={loadingStats}
        />
        <StatCard 
          title="Total Restaurants" 
          value={loadingStats ? '-' : restaurants.length}
          icon={<Store size={22} />}
          change="No change"
          delay={300}
          color="info"
          isLoading={loadingStats}
        />
        <StatCard 
          title="Total Sales" 
          value={loadingStats ? '-' : `$${totalSales}`}
          icon={<DollarSign size={22} />}
          change="+8% from last week"
          delay={400}
          color="success"
          isLoading={loadingStats}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card overflow-hidden">
          <h3 className="card-title mb-4">Sales Overview ({timeRange})</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={generateTimeData()}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d17842" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#d17842" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={value => [`$${value}`, 'Sales']} />
                <Area type="monotone" dataKey="value" stroke="#d17842" fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card overflow-hidden">
          <h3 className="card-title mb-4">Order Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getOrderStatusData()}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Orders">
                  {getOrderStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="card mb-8">
        <h3 className="card-title mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard 
            title="Average Delivery Time" 
            value={calculateAverageDeliveryTime()} 
            icon={<Clock size={18} />}
            isLoading={loadingStats}
          />
          <MetricCard 
            title="Average Order Value" 
            value={calculateAverageOrderValue()} 
            icon={<DollarSign size={18} />}
            isLoading={loadingStats}
          />
          <MetricCard 
            title="Order Completion Rate" 
            value={`${calculateCompletionRate()}%`} 
            icon={<TrendingUp size={18} />}
            isLoading={loadingStats}
          />
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="card mb-8">
        <h3 className="card-title mb-4">Order Status Distribution</h3>
        <div className="flex gap-4 flex-wrap">
          {Object.entries(orderStatuses).map(([status, count], index) => (
            <StatusPill 
              key={status}
              label={status.replace('-', ' ')}
              count={count}
              className={`status-${status === 'in-transit' ? 'transit' : status}`}
              delay={index * 100}
            />
          ))}
        </div>
      </div>

      {/* Recent Orders with hover effects */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="card-title">Recent Orders</h3>
          <button className="btn btn-primary btn-sm">View All Orders</button>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Restaurant</th>
                <th>Time</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order, index) => {
                const restaurant = restaurants.find(r => r.id === order.restaurantId);
                const customer = order.customerName;
                
                return (
                  <tr key={order.id || index} className="hover:bg-gray-50 transition-all duration-150">
                    <td className="font-medium">{order.id || `Order-${index}`}</td>
                    <td>{customer || 'Unknown'}</td>
                    <td>{restaurant?.name || 'Unknown'}</td>
                    <td className="text-gray-500 text-sm">{formatTimestamp(order.createdAt)}</td>
                    <td>
                      <span className={`status-pill ${getStatusBgColor(order.status || 'unknown')}`}>
                        {(order.status || 'unknown').replace('-', ' ')}
                      </span>
                    </td>
                    <td className="font-semibold">
                      ${(order.totalAmount !== undefined && order.totalAmount !== null) 
                        ? order.totalAmount.toFixed(2) 
                        : '0.00'}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-info">View</button>
                        {order.status === 'new' && (
                          <button className="btn btn-sm btn-success">Assign</button>
                        )}
                        {['new', 'assigned'].includes(order.status) && (
                          <button className="btn btn-sm btn-danger">Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Enhanced Stat Card Component with Animation
const StatCard = ({ title, value, icon, change, delay, color, isLoading }) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`stat-card transform transition-all duration-500 ${show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
    >
      <div className={`stat-icon ${color}`}>
        {icon}
      </div>
      <div className="stat-title">{title}</div>
      {isLoading ? (
        <div className="stat-value flex space-x-1">
          <div className="h-6 w-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ) : (
        <div className="stat-value">{value}</div>
      )}
      {change && (
        <div className={`stat-change ${change.includes('+') ? 'positive' : change.includes('-') ? 'negative' : ''}`}>
          {change.includes('+') && <TrendingUp size={14} />}
          {change.includes('-') && <TrendingUp size={14} className="transform rotate-180" />}
          <span>{change}</span>
        </div>
      )}
    </div>
  );
};

// Enhanced Status Pill Component with Animation
const StatusPill = ({ label, count, className, delay = 0 }) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`status-pill ${className} transform transition-all duration-500 ${show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}`}
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}: {count}
    </div>
  );
};

// Enhanced Metric Card Component
const MetricCard = ({ title, value, icon, isLoading }) => {
  return (
    <div className="metric-card p-4 bg-white rounded-lg shadow hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className="metric-title text-gray-600 font-medium">{title}</div>
        {icon && <div className="text-primary-color">{icon}</div>}
      </div>
      {isLoading ? (
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
      ) : (
        <div className="metric-value text-2xl font-bold">{value}</div>
      )}
    </div>
  );
};

export default Dashboard;