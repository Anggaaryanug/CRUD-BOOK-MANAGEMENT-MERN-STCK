const mysql = require('mysql2/promise');

// Konfigurasi koneksi database
const dbConfig = {
  host: 'localhost',
  user: 'root',           // Sesuaikan dengan username MySQL Anda
  password: '',           // Sesuaikan dengan password MySQL Anda
  database: 'book_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Buat connection pool
const pool = mysql.createPool(dbConfig);

// Test koneksi
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();

module.exports = pool;