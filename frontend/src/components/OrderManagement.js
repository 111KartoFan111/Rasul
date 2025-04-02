import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import apiClient from '../utils/apiClient'; // Используем apiClient

// Установка токена Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoicmFzdWwyMzIxIiwiYSI6ImNtOGU2ejI5cjJocmMybXM1aXJqODV4N3gifQ.8yONCbExQXDnQHTnZb93Fg';

// Статические данные клиентов
const STATIC_CUSTOMERS = [
  { id: 1, name: 'Иван Петров', addresses: JSON.stringify([{ address: 'ул. Кунаева 10, Астана' }]) },
  { id: 2, name: 'Мария Иванова', addresses: JSON.stringify([{ address: 'пр. Республики 24, Астана' }]) },
  { id: 3, name: 'Алексей Смирнов', addresses: JSON.stringify([{ address: 'ул. Сыганак 15, Астана' }]) },
  { id: 4, name: 'Елена Козлова', addresses: JSON.stringify([{ address: 'пр. Туран 37, Астана' }]) },
  { id: 5, name: 'Дмитрий Новиков', addresses: JSON.stringify([{ address: 'ул. Достык 5, Астана' }]) },
];
// Функция получения цвета статуса заказа
const getStatusColor = (status) => {
  switch (status) {
    case 'new':
      return '#F59E0B';
    case 'assigned':
      return '#3B82F6';
    case 'preparing':
      return '#8B5CF6';
    case 'in-transit':
      return '#4F46E5';
    case 'delivered':
      return '#10B981';
    case 'cancelled':
      return '#EF4444';
    default:
      return '#9CA3AF';
  }
};
// Компонент формы создания заказа (оставляем без изменений в части логики API)
const NewOrderForm = ({
  customers,
  restaurants,
  drivers,
  onCreateOrder,
  onCancel,
  map,
  directions,
  fetchCoordinatesFromAddress,
}) => {
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
    deliveryCoordinates: [],
  });

  const [newOrderItem, setNewOrderItem] = useState({ name: '', price: 0, quantity: 1 });

  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    const customer = customers.find((c) => c.id === parseInt(customerId));
    setNewOrder({
      ...newOrder,
      customerId: customerId,
      customerName: customer ? customer.name : '',
    });
    if (customerId && customer && customer.addresses) {
      try {
        const addresses = typeof customer.addresses === 'string' ? JSON.parse(customer.addresses) : customer.addresses;
        if (addresses.length > 0) {
          setNewOrder({
            ...newOrder,
            customerId: customerId,
            customerName: customer.name,
            deliveryAddress: addresses[0].address,
          });
        }
      } catch (err) {
        console.error('Error processing customer addresses:', err);
      }
    }
  };

  const handleRestaurantSelect = (e) => {
    const restaurantId = e.target.value;
    const restaurant = restaurants.find((r) => r.id === parseInt(restaurantId));
    setNewOrder({
      ...newOrder,
      restaurantId: restaurantId,
      restaurantName: restaurant ? restaurant.name : '',
    });
    if (restaurant && restaurant.coordinates && map && map.current) {
      map.current.flyTo({ center: restaurant.coordinates, zoom: 15 });
      const marker = new mapboxgl.Marker({ color: '#FF0000' })
        .setLngLat(restaurant.coordinates)
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>${restaurant.name}</h3><p>${restaurant.address || ''}</p>`))
        .addTo(map.current);
      marker.togglePopup();
      setTimeout(() => marker.remove(), 5000);
    }
  };

  const handleDriverSelect = (e) => {
    const driverId = e.target.value;
    const driver = drivers.find((d) => d.id === parseInt(driverId));
    setNewOrder({
      ...newOrder,
      driverId: driverId,
      driverName: driver ? driver.name : '',
    });
  };

  const handleAddItem = () => {
    if (newOrderItem.name && newOrderItem.price > 0) {
      const updatedItems = [
        ...newOrder.items,
        {
          ...newOrderItem,
          id: `item-${Date.now()}`,
          subtotal: newOrderItem.price * newOrderItem.quantity,
        },
      ];
      setNewOrder({
        ...newOrder,
        items: updatedItems,
        totalAmount: updatedItems.reduce((sum, item) => sum + item.subtotal, 0),
      });
      setNewOrderItem({ name: '', price: 0, quantity: 1 });
    }
  };

  const handleRemoveItem = (itemId) => {
    const updatedItems = newOrder.items.filter((item) => item.id !== itemId);
    setNewOrder({
      ...newOrder,
      items: updatedItems,
      totalAmount: updatedItems.reduce((sum, item) => sum + item.subtotal, 0),
    });
  };

  const handleUpdateItemQuantity = (itemId, quantity) => {
    const updatedItems = newOrder.items.map((item) =>
      item.id === itemId ? { ...item, quantity: quantity, subtotal: item.price * quantity } : item
    );
    setNewOrder({
      ...newOrder,
      items: updatedItems,
      totalAmount: updatedItems.reduce((sum, item) => sum + item.subtotal, 0),
    });
  };

  const handleCreateOrder = () => {
    if (newOrder.customerId && newOrder.restaurantId && newOrder.items.length > 0) {
      const deliveryCoordinates =
        newOrder.deliveryCoordinates && newOrder.deliveryCoordinates.length === 2
          ? newOrder.deliveryCoordinates
          : null;
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
        delivery_coordinates: deliveryCoordinates,
      };
      onCreateOrder(orderData);
    }
  };

  return (
    <div className="card mb-8">
      <h3 className="card-title mb-4">Создать новый заказ</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="form-group">
          <label className="form-label">Клиент</label>
          <select className="form-control" value={newOrder.customerId} onChange={handleCustomerSelect}>
            <option value="">Выберите клиента</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Ресторан</label>
          <select className="form-control" value={newOrder.restaurantId} onChange={handleRestaurantSelect}>
            <option value="">Выберите ресторан</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name} {restaurant.cuisine_type ? `(${restaurant.cuisine_type})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Курьер (опционально)</label>
          <select className="form-control" value={newOrder.driverId} onChange={handleDriverSelect}>
            <option value="">Выберите курьера</option>
            {drivers
              .filter((driver) => driver.status === 'available')
              .map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div className="form-group mb-6">
        <label className="form-label">Адрес доставки</label>
        <div className="flex gap-2">
          <input
            type="text"
            className="form-control flex-grow"
            value={newOrder.deliveryAddress || ''}
            onChange={(e) => setNewOrder({ ...newOrder, deliveryAddress: e.target.value })}
            placeholder="Введите адрес доставки"
          />
          <button
            className="btn btn-info"
            onClick={async () => {
              if (newOrder.deliveryAddress) {
                try {
                  const coordinates = await fetchCoordinatesFromAddress(newOrder.deliveryAddress);
                  if (coordinates) {
                    setNewOrder({ ...newOrder, deliveryCoordinates: coordinates });
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
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Элементы заказа</h4>
          <span className="text-lg font-semibold">{newOrder.totalAmount.toFixed(2)}₸</span>
        </div>
        <div className="bg-gray-100 p-4 rounded-md mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <div>
              <input
                type="text"
                className="form-control"
                value={newOrderItem.name}
                onChange={(e) => setNewOrderItem({ ...newOrderItem, name: e.target.value })}
                placeholder="Название позиции"
              />
            </div>
            <div>
              <input
                type="number"
                className="form-control"
                value={newOrderItem.price}
                onChange={(e) => setNewOrderItem({ ...newOrderItem, price: parseFloat(e.target.value) || 0 })}
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
                onChange={(e) => setNewOrderItem({ ...newOrderItem, quantity: parseInt(e.target.value) || 1 })}
                placeholder="Количество"
                min="1"
              />
              <button className="btn btn-primary" onClick={handleAddItem}>
                Добавить
              </button>
            </div>
          </div>
        </div>
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
              {newOrder.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.price.toFixed(2)}₸</td>
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
                  <td>{item.subtotal.toFixed(2)}₸</td>
                  <td>
                    <button className="btn btn-xs btn-outline-danger" onClick={() => handleRemoveItem(item.id)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-right font-medium">
                  Итого:
                </td>
                <td colSpan="2" className="font-semibold">
                  {newOrder.totalAmount.toFixed(2)}₸
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
      <div className="flex justify-end">
        <button className="btn btn-outline-secondary mr-2" onClick={onCancel}>
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

// Основной компонент управления заказами
const OrderManagement = () => {
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
  const [directions, setDirections] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapContainer = useRef(null);
  const map = useRef(null);

  const customers = STATIC_CUSTOMERS;

  // Загрузка данных с использованием apiClient
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [ordersResponse, restaurantsResponse, driversResponse] = await Promise.all([
          apiClient.get('/orders'),
          apiClient.get('/restaurants'),
          apiClient.get('/drivers'),
        ]);

        const restaurantsWithCoordinates = restaurantsResponse.map((restaurant) => ({
          ...restaurant,
          coordinates: restaurant.coordinates || getRandomCoordinates(),
        }));

        setOrders(ordersResponse);
        setRestaurants(restaurantsWithCoordinates);
        setDrivers(driversResponse);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Не удалось загрузи данные. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRandomCoordinates = () => {
    const centerLat = 51.160528;
    const centerLng = 71.445275;
    const offset = 0.015;
    return [centerLng + (Math.random() - 0.5) * offset, centerLat + (Math.random() - 0.5) * offset];
  };

  useEffect(() => {
    if (mapContainer.current && !map.current) {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [71.445275, 51.160528],
          zoom: 12,
        });

        map.current.on('load', () => {
          const directionsControl = new MapboxDirections({
            accessToken: mapboxgl.accessToken,
            unit: 'metric',
            profile: 'mapbox/driving',
          });
          map.current.addControl(directionsControl, 'top-left');
          setDirections(directionsControl);
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

          map.current.addSource('restaurants', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });

          map.current.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'restaurants',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 20, '#f28cb1'],
              'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 20, 40],
            },
          });

          map.current.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'restaurants',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': '{point_count_abbreviated}',
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12,
            },
          });

          map.current.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'restaurants',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': '#FF6B6B',
              'circle-radius': 8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
            },
          });

          map.current.on('click', 'unclustered-point', (e) => {
            const { properties } = e.features[0];
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`<h3>${properties.name}</h3><p>${properties.address}</p>`)
              .addTo(map.current);
          });

          map.current.on('mouseenter', 'unclustered-point', () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });
          map.current.on('mouseleave', 'unclustered-point', () => {
            map.current.getCanvas().style.cursor = '';
          });
        });
      } catch (error) {
        console.error('Error creating map:', error);
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const handleCreateOrder = async (orderData) => {
    try {
      const response = await apiClient.post('/orders', orderData);
      setOrders([response, ...orders]);
      setShowNewOrderForm(false);
      alert('Заказ успешно создан!');
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Не удалось создать заказ. Пожалуйста, попробуйте снова.');
    }
  };

  const fetchCoordinatesFromAddress = async (address) => {
    try {
      const centerLat = 51.160528;
      const centerLng = 71.445275;
      const offset = 0.015;
      const coordinates = [centerLng + (Math.random() - 0.5) * offset, centerLat + (Math.random() - 0.5) * offset];
      return coordinates;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  };

  const handleFilterStatusChange = (e) => setFilterStatus(e.target.value);
  const handleSortOrderChange = (e) => setSortOrder(e.target.value);
  const handleSearchQueryChange = (e) => setSearchQuery(e.target.value);
  const toggleNewOrderForm = () => setShowNewOrderForm(!showNewOrderForm);

  const handleShowOrderRoute = (order) => {
    if (directions && order.delivery_coordinates && order.delivery_coordinates.length === 2) {
      const restaurant = restaurants.find((r) => r.id === order.restaurant_id);
      const origin = restaurant && restaurant.coordinates ? restaurant.coordinates : [71.445275, 51.160528];
      directions.setOrigin(origin);
      directions.setDestination(order.delivery_coordinates);
      if (restaurant && restaurant.coordinates) {
        map.current.fitBounds([restaurant.coordinates, order.delivery_coordinates], { padding: 100 });
      }
    } else {
      alert('Нет доступных координат доставки для этого заказа');
    }
  };

  const handleShowAllRestaurants = () => {
    if (!showRestaurantsOnMap) {
      markers.forEach((marker) => marker.remove());
      const newMarkers = restaurants
        .filter((restaurant) => restaurant.coordinates)
        .map((restaurant) => {
          const el = document.createElement('div');
          el.className = 'restaurant-marker';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.backgroundImage = 'url(https://img.icons8.com/color/48/000000/restaurant.png)';
          el.style.backgroundSize = 'cover';
          return new mapboxgl.Marker(el)
            .setLngLat(restaurant.coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<h3>${restaurant.name}</h3><p>${restaurant.address}</p>`
              )
            )
            .addTo(map.current);
        });
      setMarkers(newMarkers);
      if (restaurants.length > 0 && restaurants[0].coordinates) {
        const bounds = new mapboxgl.LngLatBounds();
        restaurants
          .filter((restaurant) => restaurant.coordinates)
          .forEach((restaurant) => bounds.extend(restaurant.coordinates));
        map.current.fitBounds(bounds, { padding: 100 });
      }
    } else {
      markers.forEach((marker) => marker.remove());
      setMarkers([]);
    }
    setShowRestaurantsOnMap(!showRestaurantsOnMap);
  };

  const handleToggleRestaurant = (restaurantId) => {
    setSelectedRestaurants((prev) =>
      prev.includes(restaurantId) ? prev.filter((id) => id !== restaurantId) : [...prev, restaurantId]
    );
  };

  const handleFocusOnRestaurant = (restaurantId) => {
    const restaurant = restaurants.find((r) => r.id === parseInt(restaurantId));
    if (restaurant && restaurant.coordinates) {
      map.current.flyTo({ center: restaurant.coordinates, zoom: 15 });
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await apiClient.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      );
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Не удалось обновить статус заказа. Попробуйте снова.');
    }
  };

  const assignDriver = async (orderId, driverId) => {
    try {
      const driver = drivers.find((d) => d.id === parseInt(driverId));
      if (!driver) {
        console.error(`Driver with ID ${driverId} not found`);
        return;
      }
  
      const requestData = {
        driverId: parseInt(driverId),
        driverName: driver.name,
      };
  
      console.log('Assigning driver to order:', {
        orderId,
        driverId: requestData.driverId,
        driverName: requestData.driverName,
      });
  
      const response = await apiClient.put(`/orders/${orderId}/assign-driver`, requestData);
  
      console.log('Server response:', {
        status: response.status,
        data: response,
      });
  
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, driver_id: parseInt(driverId), driver_name: driver.name, status: 'assigned' }
            : order
        )
      );
    } catch (err) {
      console.error('Error assigning driver:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers,
        } : 'No response from server',
      });
      alert('Не удалось назначить курьера. Пожалуйста, проверьте консоль для деталей.');
    }
  };

  if (isLoading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error-container">{error}</div>;

  const filteredOrders = orders
    .filter((order) => {
      if (filterStatus !== 'all' && order.status !== filterStatus) return false;
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
    .sort((a, b) =>
      sortOrder === 'desc'
        ? new Date(b.created_at) - new Date(a.created_at)
        : new Date(a.created_at) - new Date(b.created_at)
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Тапсырыстарды басқару</h1>
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4 md:mb-0">
            <div className="form-group">
              <label className="form-label">Күй- жайы</label>
              <select className="form-control" value={filterStatus} onChange={handleFilterStatusChange}>
                <option value="all">Барлық мәртебелер</option>
                <option value="new">Жаңа</option>
                <option value="assigned">Тағайындалған</option>
                <option value="preparing">Дайындалып жатыр</option>
                <option value="in-transit">Жолда</option>
                <option value="delivered">Жеткізілген</option>
                <option value="cancelled">Болдырмау</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Сұрыптау</label>
              <select className="form-control" value={sortOrder} onChange={handleSortOrderChange}>
                <option value="desc">Алдымен жаңа</option>
                <option value="asc">Алдымен ескі</option>
              </select>
            </div>
          </div>
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
        <div className="flex justify-between">
          <div>
            <button
              className={`btn ${showRestaurantsOnMap ? 'btn-success' : 'btn-outline-success'} mr-2`}
              onClick={handleShowAllRestaurants}
            >
              {showRestaurantsOnMap ? 'Мейрамханаларды жасыру' : 'Барлық мейрамханаларды көрсету'}

            </button>
          </div>
          <button className="btn btn-primary" onClick={toggleNewOrderForm}>
            {showNewOrderForm ? 'Болдырмау' : 'Жаңа тапсырысты жасау'}
          </button>
        </div>
      </div>
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
      <div className="card mb-8">
        <h3 className="card-title mb-4">Жеткізу картасы</h3>
        <div ref={mapContainer} className="h-96 rounded-md" />
      </div>
      <div className="card">
        <h3 className="card-title mb-4">Тапсырыстар тізімі</h3>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Тапсырыстар табылмады</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                <th>ID</th>
                <th>Клиент</th>
                <th>Мейрамхана</th>
                <th>Курьер</th>
                <th>Сома</th>
                <th>Мекенжай</th>
                <th>Күйі</th>
                <th>Құрылған күні</th>
                <th>Әрекеттер</th>
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
                            .filter((driver) => driver.status === 'available')
                            .map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.name}
                              </option>
                            ))}
                        </select>
                      )}
                    </td>
                    <td>{order.total_amount?.toFixed(2)}₸</td>
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
                        Әрекеттер
                      </button>
                      <div className="dropdown-menu dropdown-menu-right">
                        {order.status === 'new' && (
                          <>
                            <button className="dropdown-item" onClick={() => updateStatus(order.id, 'preparing')}>
                              Дайындауды бастау
                            </button>
                            <button className="dropdown-item" onClick={() => updateStatus(order.id, 'cancelled')}>
                              Бас тарту
                            </button>
                          </>
                        )}
                        {order.status === 'assigned' && (
                          <>
                            <button className="dropdown-item" onClick={() => updateStatus(order.id, 'preparing')}>
                              Дайындауды бастау
                            </button>
                            <button className="dropdown-item" onClick={() => updateStatus(order.id, 'cancelled')}>
                              Бас тарту
                            </button>
                          </>
                        )}
                        {order.status === 'preparing' && (
                          <>
                            <button className="dropdown-item" onClick={() => updateStatus(order.id, 'in-transit')}>
                              Жөнелту
                            </button>
                            <button className="dropdown-item" onClick={() => updateStatus(order.id, 'cancelled')}>
                              Бас тарту
                            </button>
                          </>
                        )}
                        {order.status === 'in-transit' && (
                          <button className="dropdown-item" onClick={() => updateStatus(order.id, 'delivered')}>
                            Жеткізілді деп белгілеу
                          </button>
                        )}
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            const detailsElement = document.getElementById(`order-details-${order.id}`);
                            if (detailsElement) detailsElement.classList.toggle('hidden');
                          }}
                        >
                          Тапсырыс мәліметтері
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
        {filteredOrders.map((order) => (
        <div
          id={`order-details-${order.id}`}
          key={`details-${order.id}`}
          className="hidden mt-4 bg-gray-100 p-4 rounded-md"
        >
          <h4 className="font-medium mb-2">Тапсырыс мәліметтері #{order.id}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Клиент:</strong> {order.customer_name}</p>
              <p><strong>Жеткізу мекенжайы:</strong> {order.delivery_address}</p>
            </div>
            <div>
              <p><strong>Мейрамхана:</strong> {order.restaurant_name}</p>
              <p><strong>Курьер:</strong> {order.driver_name || 'Тағайындалмаған'}</p>
            </div>
          </div>
          <h5 className="font-medium mt-4 mb-2">Тапсырыс элементтері</h5>
          <table className="table w-full">
            <thead>
              <tr>
                <th>Атауы</th>
                <th>Бағасы</th>
                <th>Саны</th>
                <th>Жалпы</th>
              </tr>
            </thead>
            <tbody>
              {order.items && typeof order.items === 'string' ? (
                JSON.parse(order.items).map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{parseFloat(item.price).toFixed(2)}₸</td>
                    <td>{item.quantity}</td>
                    <td>{parseFloat(item.subtotal).toFixed(2)}₸</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">
                    Тапсырыс элементтері туралы ақпарат жоқ
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-right font-medium">
                  Барлығы:
                </td>
                <td className="font-semibold">{parseFloat(order.total_amount).toFixed(2)}₸</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}
    </div>
  );
};

export default OrderManagement;