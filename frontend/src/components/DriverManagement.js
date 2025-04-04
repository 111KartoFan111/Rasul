import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../utils/apiClient'; 

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [newDriver, setNewDriver] = useState({ 
    name: '', 
    status: 'available' 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch drivers on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);

  // Function to fetch drivers using apiClient
  const fetchDrivers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/drivers'); // Используем apiClient
      setDrivers(response); // apiClient возвращает данные напрямую благодаря интерцептору
    } catch (error) {
      console.error('Detailed error:', error);
      
      if (error.response) {
        setError(`Ошибка загрузки: ${error.response.data.message || 'Неизвестная ошибка'}`);
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      } else if (error.request) {
        setError('Серверден жауап жоқ');
        console.error('Error request:', error.request);
      } else {
        setError(`Ошибка: ${error.message}`);
        console.error('Error message:', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new driver
  const handleAddDriver = async () => {
    if (!newDriver.name.trim()) {
      setError('Жүргізушінің атын енгізіңіз');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/drivers', {
        name: newDriver.name.trim(),
        status: newDriver.status
      });

      setDrivers(prevDrivers => [...prevDrivers, response]);
      setNewDriver({ name: '', status: 'available' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Жүргізушіні қосу қатесі:', error);

      
      if (error.response) {
        setError(`Жүргізушіні қосу сәтсіз аяқталды: ${error.response.data.message || 'Белгісіз қате'}`);

      } else {
        setError('Жүргізуші қосылмады. Қосылымды тексеріңіз.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update driver status
  const handleUpdateDriverStatus = async (id, status) => {
    try {
      await apiClient.put(`/drivers/${id}`, { status });
      
      const updatedDrivers = drivers.map(driver =>
        driver.id === id ? { ...driver, status } : driver
      );
      setDrivers(updatedDrivers);
    } catch (error) {
      console.error('Күйді жаңарту қатесі:', error);
      
      if (error.response) {
        setError(`Күйді жаңарту мүмкін болмады: ${error.response.data.message || 'Белгісіз қате'}`);
      } else {
        setError('Жүргізуші күйін жаңарту мүмкін болмады');
      }
    }
  };

  // Get status class
  const getStatusClass = (status) => {
    switch(status) {
      case 'available': return 'bg-success';
      case 'busy': return 'bg-warning';
      case 'offline': return 'bg-danger';
      default: return 'bg-gray-200';
    }
  };

  // Translate status
  const translateStatus = (status) => {
    switch(status) {
      case 'available': return 'Доступен';
      case 'busy': return 'Занят';
      case 'offline': return 'Не в сети';
      default: return status;
    }
  };

  // Filter drivers by status
  const filteredDrivers = filterStatus === 'all' 
    ? drivers 
    : drivers.filter(driver => driver.status === filterStatus);

  // Count drivers by status
  const driverCounts = {
    all: drivers.length,
    available: drivers.filter(d => d.status === 'available').length,
    busy: drivers.filter(d => d.status === 'busy').length,
    offline: drivers.filter(d => d.status === 'offline').length
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const formVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: { 
      height: 'auto', 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="container mx-auto p-4 page-container">
      {/* Остальная часть JSX остается без изменений */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold section-title">Жүргізушілерді басқару </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Болдырмау' : 'Жүргізушіні қосу'}
          </motion.button>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            className={`status-pill ${filterStatus === 'all' ? 'bg-primary text-white' : 'bg-gray-100'}`}
            onClick={() => setFilterStatus('all')}
          >
            Барлығы ({driverCounts.all})
          </button>
          <button 
            className={`status-pill ${filterStatus === 'available' ? 'bg-primary text-white' : 'bg-success'}`}
            onClick={() => setFilterStatus('available')}
          >
            Қол жетімді ({driverCounts.available})
          </button>
          <button 
            className={`status-pill ${filterStatus === 'busy' ? 'bg-primary text-white' : 'bg-warning'}`}
            onClick={() => setFilterStatus('busy')}
          >
            Бос емес ({driverCounts.busy})
          </button>
          <button 
            className={`status-pill ${filterStatus === 'offline' ? 'bg-primary text-white' : 'bg-danger'}`}
            onClick={() => setFilterStatus('offline')}
          >
            Желіден тыс ({driverCounts.offline})
          </button>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow mb-6" 
            role="alert"
          >
            <div className="flex">
              <div className="py-1">
                <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
                </svg>
              </div>
              <div>
                <p className="font-bold">Внимание</p>
                <p>{error}</p>
              </div>
            </div>
            <button 
              className="absolute top-2 right-2 text-red-500"
              onClick={() => setError(null)}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="card mb-8 border-l-4 border-primary"
          >
            <h3 className="card-title mb-4">Жаңа жүргізуші қосу</h3>
            <div className="grid grid-cols-1 md:grid-cols-2-md gap-4 mb-4">
              <div className="form-group">
                <label className="form-label">Жүргізушінің атауы</label>
                <input
                  type="text"
                  className="form-control"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  placeholder="Жүргізушінің атын енгізіңіз"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Статус</label>
                <select
                  className="form-control"
                  value={newDriver.status}
                  onChange={(e) => setNewDriver({ ...newDriver, status: e.target.value })}
                >
                  <option value="available">Қол жетімді</option>
                  <option value="busy">Бос емес</option>
                  <option value="offline">Желіден тыс</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary"
                onClick={handleAddDriver}
                disabled={isLoading || !newDriver.name.trim()}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Қосу...
                  </span>
                ) : 'Жүргізушіні қосу'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Жүргізушілер тізімі</h3>
          <span className="text-gray-500 text-sm">
            {filteredDrivers.length} {filteredDrivers.length === 1 ? 'жүргізуші' : 'жүргізушілер'}
          </span>
        </div>
        
        {isLoading && !drivers.length ? (
          <div className="flex justify-center items-center py-12">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
          </div>
        ) : (
          <>
            {filteredDrivers.length > 0 ? (
              <div className="table-container">
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="overflow-x-auto"
                >
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Атауы</th>
                        <th>Статус</th>
                        <th>Әрекеттер</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrivers.map((driver) => (
                        <motion.tr 
                          key={driver.id} 
                          variants={itemVariants}
                        >
                          <td>{driver.id}</td>
                          <td className="font-medium">{driver.name}</td>
                          <td>
                            <span className={`status-pill ${getStatusClass(driver.status)}`}>
                              {translateStatus(driver.status)}
                            </span>
                          </td>
                          <td>
                            <select
                              className="form-control"
                              value={driver.status}
                              onChange={(e) => handleUpdateDriverStatus(driver.id, e.target.value)}
                            >
                              <option value="available">Қол жетімді</option>
                              <option value="busy">Бос емес</option>
                              <option value="offline">Желіден тыс</option>
                            </select>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-gray-500"
              >
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                <p className="mt-2 text-sm">Қол жетімді жүргізушілер жоқ</p>
                <button 
                  className="btn btn-primary mt-4"
                  onClick={() => setShowAddForm(true)}
                >
                  Жүргізушіні қосу
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DriverManagement;