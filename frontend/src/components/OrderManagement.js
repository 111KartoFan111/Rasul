import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import axios from 'axios';

// Replace with your actual Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoicmFzdWwyMzIxIiwiYSI6ImNtOGU2ejI5cjJocmMybXM1aXJqODV4N3gifQ.8yONCbExQXDnQHTnZb93Fg';

// Static customer data
const STATIC_CUSTOMERS = [
  { 
    id: 1, 
    name: 'Иван Петров', 
    addresses: JSON.stringify([{address: 'ул. Кунаева 10, Астана'}]) 
  },
  { 
    id: 2, 
    name: 'Мария Иванова', 
    addresses: JSON.stringify([{address: 'пр. Республики 24, Астана'}]) 
  },
  { 
    id: 3, 
    name: 'Алексей Смирнов', 
    addresses: JSON.stringify([{address: 'ул. Сыганак 15, Астана'}]) 
  },
  { 
    id: 4, 
    name: 'Елена Козлова', 
    addresses: JSON.stringify([{address: 'пр. Туран 37, Астана'}]) 
  },
  { 
    id: 5, 
    name: 'Дмитрий Новиков', 
    addresses: JSON.stringify([{address: 'ул. Достык 5, Астана'}]) 
  }
];

// Component for creating a new order
const NewOrderForm = ({ 
  customers, 
  restaurants, 
  drivers, 
  onCreateOrder, 
  onCancel,
  map,
  directions,
  fetchCoordinatesFromAddress
}) => {
  // State for new order
  const [newOrder, setNewOrder] = useState({
    customerId: '',
    driverId: '',
    restaurantId: '',
    items: [],
    totalAmount: 0,
    status: 'new',
    customerName: '',
    restaurantName: '',
    driverName: '',
    deliveryAddress: '',
    deliveryCoordinates: []
  });
  
  // State for new order item
  const [newOrderItem, setNewOrderItem] = useState({ 
    name: '', 
    price: 0, 
    quantity: 1 
  });

  // Handle customer selection
  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    const customer = customers.find(c => c.id === parseInt(customerId));
    
    setNewOrder({
      ...newOrder,
      customerId: customerId,
      customerName: customer ? customer.name : ''
    });
    
    // If customer has saved addresses, automatically fill the first one
    if (customerId && customer && customer.addresses) {
      try {
        const addresses = typeof customer.addresses === 'string' 
          ? JSON.parse(customer.addresses) 
          : customer.addresses;
          
        if (addresses.length > 0) {
          setNewOrder({
            ...newOrder,
            customerId: customerId,
            customerName: customer.name,
            deliveryAddress: addresses[0].address
          });
        }
      } catch (err) {
        console.error('Error processing customer addresses:', err);
      }
    }
  };

  // Rest of the NewOrderForm component remains the same...
  // (Keep all the other functions and the return statement as they were)

  // Handle restaurant selection
  const handleRestaurantSelect = (e) => {
    const restaurantId = e.target.value;
    const restaurant = restaurants.find(r => r.id === parseInt(restaurantId));
    
    setNewOrder({
      ...newOrder,
      restaurantId: restaurantId,
      restaurantName: restaurant ? restaurant.name : ''
    });
    
    // If map is available, show restaurant on map
    if (restaurant && restaurant.coordinates && map && map.current) {
      map.current.flyTo({
        center: restaurant.coordinates,
        zoom: 15
      });
      
      // Add temporary marker
      const marker = new mapboxgl.Marker({ color: '#FF0000' })
        .setLngLat(restaurant.coordinates)
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>${restaurant.name}</h3><p>${restaurant.address || ''}</p>`))
        .addTo(map.current);
      
      // Show popup
      marker.togglePopup();
      
      // Remove marker after 5 seconds
      setTimeout(() => {
        marker.remove();
      }, 5000);
    }
  };
  
  // Handle driver selection
  const handleDriverSelect = (e) => {
    const driverId = e.target.value;
    const driver = drivers.find(d => d.id === parseInt(driverId));
    
    setNewOrder({
      ...newOrder,
      driverId: driverId,
      driverName: driver ? driver.name : ''
    });
  };

  // Handle adding item to order
  const handleAddItem = () => {
    if (newOrderItem.name && newOrderItem.price > 0) {
      const updatedItems = [...newOrder.items, {
        ...newOrderItem,
        id: `item-${Date.now()}`,
        subtotal: newOrderItem.price * newOrderItem.quantity
      }];
      
      setNewOrder({
        ...newOrder,
        items: updatedItems,
        totalAmount: updatedItems.reduce((sum, item) => sum + item.subtotal, 0)
      });
      
      setNewOrderItem({ name: '', price: 0, quantity: 1 });
    }
  };

  // Handle removing item from order
  const handleRemoveItem = (itemId) => {
    const updatedItems = newOrder.items.filter(item => item.id !== itemId);
    
    setNewOrder({
      ...newOrder,
      items: updatedItems,
      totalAmount: updatedItems.reduce((sum, item) => sum + item.subtotal, 0)
    });
  };

  // Handle updating item quantity
// В функции handleCreateOrder в NewOrderForm
const handleCreateOrder = () => {
  if (newOrder.customerId && newOrder.restaurantId && newOrder.items.length > 0) {
    // Убедимся, что координаты в правильном формате
    const deliveryCoordinates = newOrder.deliveryCoordinates && 
      newOrder.deliveryCoordinates.length === 2 ? 
      newOrder.deliveryCoordinates : null;
    
    // Подготовка данных для отправки на сервер
    const orderData = {
      customer_id: parseInt(newOrder.customerId),
      restaurant_id: parseInt(newOrder.restaurantId),
      driver_id: newOrder.driverId ? parseInt(newOrder.driverId) : null,
      items: JSON.stringify(newOrder.items),
      total_amount: newOrder.totalAmount,
      status: 'new',
      customer_name: newOrder.customerName,
      restaurant_name: newOrder.restaurantName,
      driver_name: newOrder.driverName || null,
      delivery_address: newOrder.deliveryAddress || '',
      delivery_coordinates: deliveryCoordinates
    };
    
    onCreateOrder(orderData);
  }
};
  return (
    <div className="card mb-8">
      <h3 className="card-title mb-4">Создать новый заказ</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Customer selection */}
        <div className="form-group">
          <label className="form-label">Клиент</label>
          <select
            className="form-control"
            value={newOrder.customerId}
            onChange={handleCustomerSelect}
          >
            <option value="">Выберите клиента</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </div>
        
        {/* Restaurant selection */}
        <div className="form-group">
          <label className="form-label">Ресторан</label>
          <select
            className="form-control"
            value={newOrder.restaurantId}
            onChange={handleRestaurantSelect}
          >
            <option value="">Выберите ресторан</option>
            {restaurants.map(restaurant => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name} {restaurant.cuisine_type ? `(${restaurant.cuisine_type})` : ''}
              </option>
            ))}
          </select>
        </div>
        
        {/* Driver selection */}
        <div className="form-group">
          <label className="form-label">Курьер (опционально)</label>
          <select
            className="form-control"
            value={newOrder.driverId}
            onChange={handleDriverSelect}
          >
            <option value="">Выберите курьера</option>
            {drivers
              .filter(driver => driver.status === 'available')
              .map(driver => (
                <option key={driver.id} value={driver.id}>{driver.name}</option>
              ))
            }
          </select>
        </div>
      </div>
      
      {/* Delivery address */}
      <div className="form-group mb-6">
        <label className="form-label">Адрес доставки</label>
        <div className="flex gap-2">
          <input
            type="text"
            className="form-control flex-grow"
            value={newOrder.deliveryAddress || ''}
            onChange={(e) => setNewOrder({...newOrder, deliveryAddress: e.target.value})}
            placeholder="Введите адрес доставки"
          />
          <button
            className="btn btn-info"
            onClick={async () => {
              if (newOrder.deliveryAddress) {
                try {
                  const coordinates = await fetchCoordinatesFromAddress(newOrder.deliveryAddress);
                  if (coordinates) {
                    // Update delivery coordinates
                    setNewOrder({...newOrder, deliveryCoordinates: coordinates});
                  } else {
                    alert('Не удалось найти координаты для указанного адреса');
                  }
                } catch (error) {
                  console.error('Ошибка получения координат:', error);
                  alert('Ошибка получения координат');
                }
              }
            }}
          >
            Проверить на карте
          </button>
        </div>
      </div>
      
      {/* Order items */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Элементы заказа</h4>
          <span className="text-lg font-semibold">{newOrder.totalAmount.toFixed(2)} ₽</span>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-md mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <div>
              <input
                type="text"
                className="form-control"
                value={newOrderItem.name}
                onChange={(e) => setNewOrderItem({...newOrderItem, name: e.target.value})}
                placeholder="Название позиции"
              />
            </div>
            <div>
              <input
                type="number"
                className="form-control"
                value={newOrderItem.price}
                onChange={(e) => setNewOrderItem({...newOrderItem, price: parseFloat(e.target.value) || 0})}
                placeholder="Цена"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                className="form-control"
                value={newOrderItem.quantity}
                onChange={(e) => setNewOrderItem({...newOrderItem, quantity: parseInt(e.target.value) || 1})}
                placeholder="Количество"
                min="1"
              />
              <button
                className="btn btn-primary"
                onClick={handleAddItem}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
        
        {/* Order items table */}
        {newOrder.items.length > 0 && (
          <table className="table w-full mb-4">
            <thead>
              <tr>
                <th>Название</th>
                <th>Цена</th>
                <th>Кол-во</th>
                <th>Сумма</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {newOrder.items.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.price.toFixed(2)} ₽</td>
                  <td>
                    <div className="flex items-center">
                      <button
                        className="btn btn-xs btn-outline-danger"
                        onClick={() => handleUpdateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                      >
                        -
                      </button>
                      <span className="mx-2">{item.quantity}</span>
                      <button
                        className="btn btn-xs btn-outline-success"
                        onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>{item.subtotal.toFixed(2)} ₽</td>
                  <td>
                    <button
                      className="btn btn-xs btn-outline-danger"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-right font-medium">Итого:</td>
                <td colSpan="2" className="font-semibold">{newOrder.totalAmount.toFixed(2)} ₽</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end">
        <button
          className="btn btn-outline-secondary mr-2"
          onClick={onCancel}
        >
          Отмена
        </button>
        <button
          className="btn btn-success"
          onClick={handleCreateOrder}
          disabled={!newOrder.customerId || !newOrder.restaurantId || newOrder.items.length === 0}
        >
          Создать заказ
        </button>
      </div>
    </div>
  );
};

// Main component for order management
const OrderManagement = () => {
  // States
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);
  const [showRestaurantsOnMap, setShowRestaurantsOnMap] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [directions, setDirections] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapContainer = useRef(null);
  const map = useRef(null);

  // API base URL - make sure this matches your server
  const API_BASE_URL = 'http://localhost:5001';

  // Use static customers instead of fetching from the database
  const customers = STATIC_CUSTOMERS;

  // Fetch data from the database (except customers)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch restaurants
        const restaurantsResponse = await axios.get(`${API_BASE_URL}/api/restaurants`);
        const restaurantsData = restaurantsResponse.data;
        
        // Fetch drivers
        const driversResponse = await axios.get(`${API_BASE_URL}/api/drivers`);
        const driversData = driversResponse.data;
        
        // Fetch orders
        const ordersResponse = await axios.get(`${API_BASE_URL}/api/orders`);
        const ordersData = ordersResponse.data;
        
        // Add coordinates to restaurants (this could be part of the API response)
        const restaurantsWithCoordinates = restaurantsData.map(restaurant => ({
          ...restaurant,
          coordinates: restaurant.coordinates || getRandomCoordinates(), // Use existing coordinates or generate random ones
        }));
        
        setRestaurants(restaurantsWithCoordinates);
        setDrivers(driversData);
        setOrders(ordersData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Helper function to generate random coordinates near Astana
  const getRandomCoordinates = () => {
    // Astana center coordinates
    const centerLat = 51.160528;
    const centerLng = 71.445275;
    const offset = 0.015; // Approximately 1-2 km
    
    return [
      centerLng + (Math.random() - 0.5) * offset,
      centerLat + (Math.random() - 0.5) * offset
    ];
  };

  // Initialize map
  useEffect(() => {
    if (mapContainer.current && !map.current) {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [71.445275, 51.160528],
          zoom: 12
        });

        map.current.on('load', () => {
          try {
            const directionsControl = new MapboxDirections({
              accessToken: mapboxgl.accessToken,
              unit: 'metric',
              profile: 'mapbox/driving'
            });
            
            map.current.addControl(directionsControl, 'top-left');
            setDirections(directionsControl);
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
            
            // Add restaurants source for clustering
            map.current.addSource('restaurants', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: []
              },
              cluster: true,
              clusterMaxZoom: 14,
              clusterRadius: 50
            });

            // Add cluster layer
            map.current.addLayer({
              id: 'clusters',
              type: 'circle',
              source: 'restaurants',
              filter: ['has', 'point_count'],
              paint: {
                'circle-color': [
                  'step',
                  ['get', 'point_count'],
                  '#51bbd6',
                  10,
                  '#f1f075',
                  20,
                  '#f28cb1'
                ],
                'circle-radius': [
                  'step',
                  ['get', 'point_count'],
                  20,
                  10,
                  30,
                  20,
                  40
                ]
              }
            });

            // Add cluster count layer
            map.current.addLayer({
              id: 'cluster-count',
              type: 'symbol',
              source: 'restaurants',
              filter: ['has', 'point_count'],
              layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
              }
            });

            // Add individual restaurant points layer
            map.current.addLayer({
              id: 'unclustered-point',
              type: 'circle',
              source: 'restaurants',
              filter: ['!', ['has', 'point_count']],
              paint: {
                'circle-color': '#FF6B6B',
                'circle-radius': 8,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff'
              }
            });

            // Add click event for restaurant points
            map.current.on('click', 'unclustered-point', (e) => {
              const { properties } = e.features[0];
              new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`<h3>${properties.name}</h3><p>${properties.address}</p>`)
                .addTo(map.current);
            });

            // Change cursor on hover
            map.current.on('mouseenter', 'unclustered-point', () => {
              map.current.getCanvas().style.cursor = 'pointer';
            });
            map.current.on('mouseleave', 'unclustered-point', () => {
              map.current.getCanvas().style.cursor = '';
            });
          } catch (error) {
            console.error('Error initializing map:', error);
          }
        });
      } catch (error) {
        console.error('Error creating map:', error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapContainer.current]);

  // Handle creating a new order
  // Handle creating a new order
  const handleCreateOrder = async (orderData) => {
    try {
      // Логируем данные, которые отправляем
      console.log('Sending order data to API:', orderData);
      
      const response = await axios.post(`${API_BASE_URL}/api/orders`, orderData);
      
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      // Ensure all required fields are present in the request
      const completeOrderData = {
        ...orderData,
        // Make sure these fields exist even if empty
        delivery_address: orderData.delivery_address || '',
        delivery_coordinates: orderData.delivery_coordinates || null,
        status: orderData.status || 'new',
        created_at: new Date().toISOString()
      };
          
      if (response.status === 200 || response.status === 201) {
        console.log('Order created successfully:', response.data);
        
        // Add the new order to the state with all necessary fields
        setOrders([response.data, ...orders]);
        
        // Hide the form
        setShowNewOrderForm(false);
        
        // Optional: Show success message
        alert('Заказ успешно создан!');
      } else {
        throw new Error(`Failed to create order. Status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error creating order:', err);
      console.error('Error details:', err.response?.data || 'No response data');
      alert('Не удалось создать заказ. Пожалуйста, попробуйте снова.');
    }
  };

  // Geocode address to coordinates
  const fetchCoordinatesFromAddress = async (address) => {
    try {
      // In a real application, you would use a geocoding service here
      // For demonstration, we'll generate random coordinates near Astana
      
      // Astana center coordinates
      const centerLat = 51.160528;
      const centerLng = 71.445275;
      const offset = 0.015; // Approximately 1-2 km
      
      const coordinates = [
        centerLng + (Math.random() - 0.5) * offset,
        centerLat + (Math.random() - 0.5) * offset
      ];
      
      return coordinates;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  };

  // Handle status filter change
  const handleFilterStatusChange = (e) => {
    setFilterStatus(e.target.value);
  };

  // Handle sort order change
  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value);
  };

  // Handle search query change
  const handleSearchQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Toggle new order form
  const toggleNewOrderForm = () => {
    setShowNewOrderForm(!showNewOrderForm);
  };

  // Show order route on map
  const handleShowOrderRoute = (order) => {
    if (directions && order.delivery_coordinates && order.delivery_coordinates.length === 2) {
      const restaurant = restaurants.find(r => r.id === order.restaurant_id);
      
      if (restaurant && restaurant.coordinates) {
        directions.setOrigin(restaurant.coordinates);
      } else {
        directions.setOrigin([71.445275, 51.160528]); // Default coordinates
      }
      
      directions.setDestination(order.delivery_coordinates);
      
      if (restaurant && restaurant.coordinates) {
        map.current.fitBounds([
          restaurant.coordinates,
          order.delivery_coordinates
        ], { padding: 100 });
      }
    } else {
      alert('No delivery coordinates available for this order');
    }
  };

  // Show all restaurants on map
  const handleShowAllRestaurants = () => {
    if (!showRestaurantsOnMap) {
      // Remove existing markers
      markers.forEach(marker => marker.remove());
      
      // Add markers for all restaurants
      const newMarkers = restaurants
        .filter(restaurant => restaurant.coordinates)
        .map(restaurant => {
          const el = document.createElement('div');
          el.className = 'restaurant-marker';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.backgroundImage = 'url(https://img.icons8.com/color/48/000000/restaurant.png)';
          el.style.backgroundSize = 'cover';
          
          return new mapboxgl.Marker(el)
            .setLngLat(restaurant.coordinates)
            .setPopup(new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<h3>${restaurant.name}</h3><p>${restaurant.address}</p>`)
            )
            .addTo(map.current);
        });
      
      setMarkers(newMarkers);
      
      // Fit bounds to show all restaurants
      if (restaurants.length > 0 && restaurants[0].coordinates) {
        const bounds = new mapboxgl.LngLatBounds();
        
        restaurants
          .filter(restaurant => restaurant.coordinates)
          .forEach(restaurant => {
            bounds.extend(restaurant.coordinates);
          });
        
        map.current.fitBounds(bounds, { padding: 100 });
      }
    } else {
      // Remove all restaurant markers
      markers.forEach(marker => marker.remove());
      setMarkers([]);
    }
    
    setShowRestaurantsOnMap(!showRestaurantsOnMap);
  };

  // Toggle restaurant selection
  const handleToggleRestaurant = (restaurantId) => {
    if (selectedRestaurants.includes(restaurantId)) {
      setSelectedRestaurants(selectedRestaurants.filter(id => id !== restaurantId));
    } else {
      setSelectedRestaurants([...selectedRestaurants, restaurantId]);
    }
  };

  // Focus on a specific restaurant
  const handleFocusOnRestaurant = (restaurantId) => {
    const restaurant = restaurants.find(r => r.id === parseInt(restaurantId));
    if (restaurant && restaurant.coordinates) {
      map.current.flyTo({
        center: restaurant.coordinates,
        zoom: 15
      });
    }
  };

  // Update order status
  const updateStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        status: newStatus
      });
      
      if (response.status === 200) {
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status. Please try again.');
    }
  };
  
  // Assign driver to order
  const assignDriver = async (orderId, driverId) => {
    try {
      const driver = drivers.find(d => d.id === parseInt(driverId));
      if (!driver) return;
      
      const response = await axios.put(`${API_BASE_URL}/api/orders/${orderId}/assign-driver`, {
        driverId: driverId,
        driverName: driver.name,
      });
      
      if (response.status === 200) {
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderId ? {
            ...order,
            driver_id: parseInt(driverId),
            driver_name: driver.name,
            status: 'assigned'
          } : order
        ));
      } else {
        throw new Error('Failed to assign driver');
      }
    } catch (err) {
      console.error('Error assigning driver:', err);
      alert('Failed to assign driver. Please try again.');
    }
  };
  
  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'info';
      case 'assigned':
        return 'primary';
      case 'preparing':
        return 'warning';
      case 'in-transit':
        return 'secondary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Loading state
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  // Error state
  if (error) {
    return <div className="error-container">{error}</div>;
  }

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      // Status filter
      if (filterStatus !== 'all' && order.status !== filterStatus) {
        return false;
      }
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          order.id.toString().includes(query) ||
          (order.customer_name && order.customer_name.toLowerCase().includes(query)) ||
          (order.restaurant_name && order.restaurant_name.toLowerCase().includes(query)) ||
          (order.driver_name && order.driver_name.toLowerCase().includes(query)) ||
          (order.delivery_address && order.delivery_address.toLowerCase().includes(query))
        );
      }
      
      return true;
    })
        .sort((a, b) => {
      // Sort by creation time
      return sortOrder === 'desc' 
        ? new Date(b.created_at) - new Date(a.created_at)
        : new Date(a.created_at) - new Date(b.created_at);
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Управление заказами</h1>
      
      {/* Top control panel */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4 md:mb-0">
            {/* Status filter */}
            <div className="form-group">
              <label className="form-label">Статус</label>
              <select 
                className="form-control" 
                value={filterStatus}
                onChange={handleFilterStatusChange}
              >
                <option value="all">Все статусы</option>
                <option value="new">Новый</option>
                <option value="assigned">Назначен</option>
                <option value="preparing">Готовится</option>
                <option value="in-transit">В пути</option>
                <option value="delivered">Доставлен</option>
                <option value="cancelled">Отменен</option>
              </select>
            </div>
            
            {/* Sort order */}
            <div className="form-group">
              <label className="form-label">Сортировка</label>
              <select 
                className="form-control"
                value={sortOrder}
                onChange={handleSortOrderChange}
              >
                <option value="desc">Сначала новые</option>
                <option value="asc">Сначала старые</option>
              </select>
            </div>
          </div>
          
          {/* Search */}
          <div className="form-group w-full md:w-auto">
            <input
              type="text"
              className="form-control"
              placeholder="Поиск заказов..."
              value={searchQuery}
              onChange={handleSearchQueryChange}
            />
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-between">
          <div>
            <button 
              className={`btn ${showRestaurantsOnMap ? 'btn-success' : 'btn-outline-success'} mr-2`}
              onClick={handleShowAllRestaurants}
            >
              {showRestaurantsOnMap ? 'Скрыть рестораны' : 'Показать все рестораны'}
            </button>
          </div>
          <button 
            className="btn btn-primary"
            onClick={toggleNewOrderForm}
          >
            {showNewOrderForm ? 'Отменить' : 'Создать новый заказ'}
          </button>
        </div>
      </div>
      
      {/* New order form */}
      {showNewOrderForm && (
        <NewOrderForm
          customers={customers}
          restaurants={restaurants}
          drivers={drivers}
          onCreateOrder={handleCreateOrder}
          onCancel={toggleNewOrderForm}
          map={map}
          directions={directions}
          fetchCoordinatesFromAddress={fetchCoordinatesFromAddress}
        />
      )}
      
      {/* Map */}
      <div className="card mb-8">
        <h3 className="card-title mb-4">Карта доставки</h3>
        <div ref={mapContainer} className="h-96 rounded-md" />
      </div>
      
      {/* Orders table */}
      <div className="card">
        <h3 className="card-title mb-4">Список заказов</h3>
        
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Заказы не найдены
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Клиент</th>
                  <th>Ресторан</th>
                  <th>Курьер</th>
                  <th>Сумма</th>
                  <th>Адрес</th>
                  <th>Статус</th>
                  <th>Дата создания</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.restaurant_name}</td>
                    <td>
                      {order.driver_name || (
                        <select
                          className="form-control form-control-sm"
                          defaultValue=""
                          onChange={(e) => assignDriver(order.id, e.target.value)}
                        >
                          <option value="">Выбрать курьера</option>
                          {drivers
                            .filter(driver => driver.status === 'available')
                            .map(driver => (
                              <option key={driver.id} value={driver.id}>{driver.name}</option>
                            ))
                          }
                        </select>
                      )}
                    </td>
                    <td>{order.total_amount?.toFixed(2)} ₽</td>
                    <td>
                      <div className="flex items-center">
                        <span className="truncate max-w-xs" title={order.delivery_address}>
                          {order.delivery_address}
                        </span>
                        {order.delivery_coordinates && (
                          <button
                            className="btn btn-xs btn-outline-info ml-2"
                            onClick={() => handleShowOrderRoute(order)}
                            title="Показать маршрут"
                          >
                            🗺️
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${getStatusColor(order.status)}`}>
                        {order.status === 'new' && 'Новый'}
                        {order.status === 'assigned' && 'Назначен'}
                        {order.status === 'preparing' && 'Готовится'}
                        {order.status === 'in-transit' && 'В пути'}
                        {order.status === 'delivered' && 'Доставлен'}
                        {order.status === 'cancelled' && 'Отменен'}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                    <td>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-outline-secondary dropdown-toggle">
                          Действия
                        </button>
                        <div className="dropdown-menu dropdown-menu-right">
                          {/* Actions based on current status */}
                          {order.status === 'new' && (
                            <>
                              <button
                                className="dropdown-item"
                                onClick={() => updateStatus(order.id, 'preparing')}
                              >
                                Начать готовить
                              </button>
                              <button
                                className="dropdown-item"
                                onClick={() => updateStatus(order.id, 'cancelled')}
                              >
                                Отменить
                              </button>
                            </>
                          )}
                          
                          {order.status === 'assigned' && (
                            <>
                              <button
                                className="dropdown-item"
                                onClick={() => updateStatus(order.id, 'preparing')}
                              >
                                Начать готовить
                              </button>
                              <button
                                className="dropdown-item"
                                onClick={() => updateStatus(order.id, 'cancelled')}
                              >
                                Отменить
                              </button>
                            </>
                          )}
                          
                          {order.status === 'preparing' && (
                            <>
                              <button
                                className="dropdown-item"
                                onClick={() => updateStatus(order.id, 'in-transit')}
                              >
                                Отправить
                              </button>
                              <button
                                className="dropdown-item"
                                onClick={() => updateStatus(order.id, 'cancelled')}
                              >
                                Отменить
                              </button>
                            </>
                          )}
                          
                          {order.status === 'in-transit' && (
                            <button
                              className="dropdown-item"
                              onClick={() => updateStatus(order.id, 'delivered')}
                            >
                              Отметить как доставленный
                            </button>
                          )}
                          
                          <button 
                            className="dropdown-item"
                            onClick={() => {
                              // Toggle order details visibility
                              const detailsElement = document.getElementById(`order-details-${order.id}`);
                              if (detailsElement) {
                                detailsElement.classList.toggle('hidden');
                              }
                            }}
                          >
                            Детали заказа
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order details (hidden by default) */}
      {filteredOrders.map(order => (
        <div 
          id={`order-details-${order.id}`} 
          key={`details-${order.id}`}
          className="hidden mt-4 bg-gray-100 p-4 rounded-md"
        >
          <h4 className="font-medium mb-2">Детали заказа #{order.id}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Клиент:</strong> {order.customer_name}</p>
              <p><strong>Адрес доставки:</strong> {order.delivery_address}</p>
            </div>
            <div>
              <p><strong>Ресторан:</strong> {order.restaurant_name}</p>
              <p><strong>Курьер:</strong> {order.driver_name || 'Не назначен'}</p>
            </div>
          </div>
          
          <h5 className="font-medium mt-4 mb-2">Позиции заказа</h5>
          <table className="table w-full">
            <thead>
              <tr>
                <th>Название</th>
                <th>Цена</th>
                <th>Кол-во</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {order.items && typeof order.items === 'string' ? (
                JSON.parse(order.items).map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{parseFloat(item.price).toFixed(2)} ₽</td>
                    <td>{item.quantity}</td>
                    <td>{parseFloat(item.subtotal).toFixed(2)} ₽</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">Нет данных о позициях заказа</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-right font-medium">Итого:</td>
                <td className="font-semibold">{parseFloat(order.total_amount).toFixed(2)} ₽</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}
    </div>
  );
};

export default OrderManagement;
