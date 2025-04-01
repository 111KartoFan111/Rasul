export const generateDemoOrders = () => [
  {
    id: 'order-1',
    customerId: 'customer-1',
    restaurantId: 'restaurant-1',
    items: [
      { id: 'item-1', name: 'Pizza', price: 10.99, quantity: 2, subtotal: 21.98 },
      { id: 'item-2', name: 'Burger', price: 8.99, quantity: 1, subtotal: 8.99 },
    ],
    totalAmount: 30.97,
    deliveryAddress: '123 Elm St',
    deliveryCoordinates: [71.433783, 51.158894], // Координаты доставки
    status: 'new',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'order-2',
    customerId: 'customer-2',
    restaurantId: 'restaurant-2',
    items: [
      { id: 'item-3', name: 'Sushi Roll', price: 5.99, quantity: 4, subtotal: 23.96 },
    ],
    totalAmount: 23.96,
    deliveryAddress: '456 Oak St',
    deliveryCoordinates: [71.443783, 51.168894], // Координаты доставки
    status: 'assigned',
    driverId: 'driver-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'order-3',
    customerId: 'customer-3',
    restaurantId: 'restaurant-1',
    items: [
      { id: 'item-4', name: 'Salad', price: 7.99, quantity: 1, subtotal: 7.99 },
    ],
    totalAmount: 7.99,
    deliveryAddress: '789 Pine St',
    deliveryCoordinates: [71.453783, 51.178894], // Координаты доставки
    status: 'preparing',
    driverId: 'driver-2',
    createdAt: new Date().toISOString(),
  },
];

export const generateDemoDrivers = () => [
  { id: 'driver-1', name: 'John Doe', status: 'available' },
  { id: 'driver-2', name: 'Jane Smith', status: 'busy' },
  { id: 'driver-3', name: 'Alice Johnson', status: 'available' },
];

export const generateDemoRestaurants = () => [
  { id: 'restaurant-1', name: 'Pizza Place', address: '123 Elm St' },
  { id: 'restaurant-2', name: 'Sushi Spot', address: '456 Oak St' },
  { id: 'restaurant-3', name: 'Healthy Eats', address: '789 Pine St' },
];

export const generateDemoCustomers = () => [
  { id: 'customer-1', name: 'Bob Brown' },
  { id: 'customer-2', name: 'Charlie Davis' },
  { id: 'customer-3', name: 'David Wilson' },
];