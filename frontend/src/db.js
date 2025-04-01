// Точный путь к .env файлу
require('dotenv').config({ 
  path: require('path').resolve(__dirname, '../.env') 
});

const { Pool } = require('pg');

// Явная проверка и логирование переменных
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : '1234',
  database: process.env.DB_NAME || 'foodrush11',
  port: parseInt(process.env.DB_PORT || '5432'),
};

console.log('Database Configuration:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
});

const pool = new Pool(dbConfig);

// Расширенная проверка подключения
pool.connect()
  .then(client => {
    console.log('✅ Успешное подключение к базе данных');
    client.release();
  })
  .catch(err => {
    console.error('❌ Ошибка подключения к базе данных:', err);
    console.error('Проверьте настройки подключения');
  });

module.exports = pool;
