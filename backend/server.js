const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bookRoutes = require('./routes/bookRoutes');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/books', bookRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Book Management API',
    version: '1.0.0',
    endpoints: {
      'POST /api/books': 'Create new book',
      'GET /api/books': 'Get all books with pagination',
      'GET /api/books/:id': 'Get single book',
      'PUT /api/books/:id': 'Update book description',
      'DELETE /api/books/:id': 'Delete book',
      'GET /api/books/search': 'Search books'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server'
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});