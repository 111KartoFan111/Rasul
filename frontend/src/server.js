const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Убедитесь, что путь верный

const app = express();
const PORT = process.env.PORT || 5001; // Используем порт 5001

// Настройка CORS с более широкими правами
app.use(cors({
  origin: '*', // Для разработки, в продакшене укажите конкретный домен
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(orders.rows);
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).send('Server Error');
  }
});

// Update the order creation endpoint in server.js
app.post('/api/orders', async (req, res) => {
  try {
    console.log('Received order data:', req.body); // Debug log
    
    const { 
      customer_id, 
      restaurant_id, 
      driver_id, 
      items, 
      total_amount, 
      status,
      customer_name,
      restaurant_name,
      driver_name,
      delivery_address,
      delivery_coordinates
    } = req.body;

    // Validate required fields
    if (!customer_id || !restaurant_id || !items || !total_amount) {
      return res.status(400).json({ 
        message: 'Missing required fields: customer_id, restaurant_id, items, and total_amount are required' 
      });
    }

    // Ensure items is a string (JSON)
    const itemsJson = typeof items === 'string' ? items : JSON.stringify(items);
    
    // Handle delivery_coordinates format
    let coordinatesValue = null;
    if (delivery_coordinates) {
      coordinatesValue = Array.isArray(delivery_coordinates) 
        ? JSON.stringify(delivery_coordinates) 
        : delivery_coordinates;
    }

    // Insert the order
    const order = await pool.query(
      `INSERT INTO orders 
       (customer_id, restaurant_id, driver_id, items, total_amount, status, 
        customer_name, restaurant_name, driver_name, delivery_address, delivery_coordinates) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        customer_id, 
        restaurant_id, 
        driver_id, 
        itemsJson, 
        total_amount, 
        status || 'new',
        customer_name,
        restaurant_name,
        driver_name,
        delivery_address,
        coordinatesValue
      ]
    );
    
    console.log('Order created:', order.rows[0]); // Debug log
    res.status(201).json(order.rows[0]);
  } catch (err) {
    console.error('Error creating order:', err.message);
    res.status(500).json({ message: `Server Error: ${err.message}` });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order.rows[0]);
  } catch (err) {
    console.error('Error updating order status:', err.message);
    res.status(500).send('Server Error');
  }
});

app.put('/api/orders/:id/assign-driver', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, driverName } = req.body;
    
    const order = await pool.query(
      'UPDATE orders SET driver_id = $1, driver_name = $2, status = $3 WHERE id = $4 RETURNING *',
      [driverId, driverName, 'assigned', id]
    );
    
    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order.rows[0]);
  } catch (err) {
    console.error('Error assigning driver:', err.message);
    res.status(500).send('Server Error');
  }
});

// Restaurants
app.get('/api/restaurants', async (req, res) => {
  try {
    const restaurants = await pool.query('SELECT * FROM restaurants');
    res.json(restaurants.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.post('/api/restaurants', async (req, res) => {
  try {
    const { name, address } = req.body;

    // Проверка на дубликаты
    const existing = await pool.query('SELECT * FROM restaurants WHERE name = $1 AND address = $2', [name, address]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Такой ресторан уже существует' });
    }

    const restaurant = await pool.query(
      'INSERT INTO restaurants (name, address) VALUES ($1, $2) RETURNING *',
      [name, address]
    );
    res.json(restaurant.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.put('/api/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;
    const restaurant = await pool.query(
      'UPDATE restaurants SET name = $1, address = $2 WHERE id = $3 RETURNING *',
      [name, address, id]
    );
    
    if (restaurant.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json(restaurant.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Drivers
app.get('/api/drivers', async (req, res) => {
  try {
    const drivers = await pool.query('SELECT * FROM drivers');
    res.json(drivers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.post('/api/drivers', async (req, res) => {
  try {
    const { name, status } = req.body;
    const driver = await pool.query(
      'INSERT INTO drivers (name, status) VALUES ($1, $2) RETURNING *',
      [name, status]
    );
    res.json(driver.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.put('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const driver = await pool.query(
      'UPDATE drivers SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (driver.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.json(driver.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await pool.query('SELECT * FROM customers');
    res.json(customers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, addresses } = req.body;
    const customer = await pool.query(
      'INSERT INTO customers (name, addresses) VALUES ($1, $2) RETURNING *',
      [name, JSON.stringify(addresses)]
    );
    res.json(customer.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, addresses } = req.body;
    const customer = await pool.query(
      'UPDATE customers SET name = $1, addresses = $2 WHERE id = $3 RETURNING *',
      [name, JSON.stringify(addresses), id]
    );
    
    if (customer.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await pool.query('SELECT * FROM settings LIMIT 1');
    if (settings.rows.length > 0) {
      res.json(settings.rows[0]);
    } else {
      res.json({});
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { platformName, contactEmail, supportPhone } = req.body;
    const settings = await pool.query(
      'INSERT INTO settings (platform_name, contact_email, support_phone) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET platform_name = EXCLUDED.platform_name, contact_email = EXCLUDED.contact_email, support_phone = EXCLUDED.support_phone RETURNING *',
      [platformName, contactEmail, supportPhone]
    );
    res.json(settings.rows[0]);
  } catch (err) {
    console.error('Error saving settings:', err.message);
    res.status(500).send('Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});