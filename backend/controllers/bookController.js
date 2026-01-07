const db = require('../config/database');

// Helper function untuk validasi tanggal
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// @desc    Create new book
// @route   POST /api/books
// @access  Public
exports.createBook = async (req, res) => {
  const { book_name, description, author, published_date } = req.body;

  try {
    // Validasi required fields
    if (!book_name || !author || !published_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'book_name, author, dan published_date wajib diisi' 
      });
    }

    // Validasi panjang book_name
    if (book_name.length > 150) {
      return res.status(400).json({ 
        success: false, 
        message: 'book_name maksimal 150 karakter' 
      });
    }

    // Validasi panjang author
    if (author.length > 150) {
      return res.status(400).json({ 
        success: false, 
        message: 'author maksimal 150 karakter' 
      });
    }

    // Validasi format tanggal
    if (!isValidDate(published_date)) {
      return res.status(400).json({ 
        success: false, 
        message: 'published_date harus tanggal yang valid' 
      });
    }

    // Insert ke database
    const query = `
      INSERT INTO books (book_name, description, author, published_date) 
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [
      book_name,
      description || '',
      author,
      published_date
    ]);

    // Get data yang baru diinsert
    const [newBook] = await db.execute(
      'SELECT * FROM books WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Buku berhasil ditambahkan',
      data: newBook[0]
    });

  } catch (error) {
    // Handle duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'Kombinasi book_name dan author sudah ada' 
      });
    }

    console.error('Create book error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server' 
    });
  }
};

// @desc    Get all books with pagination and search
// @route   GET /api/books
// @access  Public
exports.getAllBooks = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT * FROM books';
    let countQuery = 'SELECT COUNT(*) as total FROM books';
    let queryParams = [];
    let countParams = [];

    // Search berdasarkan book_name atau description
    if (search) {
      query += ' WHERE book_name LIKE ? OR description LIKE ?';
      countQuery += ' WHERE book_name LIKE ? OR description LIKE ?';
      const searchPattern = `%${search}%`;
      queryParams = [searchPattern, searchPattern];
      countParams = [searchPattern, searchPattern];
    }

    // Order by newest first
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    // Get books
    const [books] = await db.execute(query, queryParams);

    // Get total count
    const [countResult] = await db.execute(countQuery, countParams);
    const totalBooks = countResult[0].total;

    res.json({
      success: true,
      data: books,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalBooks / limit),
        total_books: totalBooks,
        books_per_page: limit
      }
    });

  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server' 
    });
  }
};

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
exports.getBookById = async (req, res) => {
  const { id } = req.params;

  try {
    const [books] = await db.execute(
      'SELECT * FROM books WHERE id = ?',
      [id]
    );

    if (books.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Buku tidak ditemukan' 
      });
    }

    res.json({ 
      success: true, 
      data: books[0]
    });

  } catch (error) {
    console.error('Get book by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server' 
    });
  }
};

// @desc    Update book description
// @route   PUT /api/books/:id
// @access  Public
exports.updateBook = async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  try {
    // Validasi description
    if (description === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'description wajib diisi' 
      });
    }

    // Cek apakah buku ada
    const [existingBook] = await db.execute(
      'SELECT * FROM books WHERE id = ?',
      [id]
    );

    if (existingBook.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Buku tidak ditemukan' 
      });
    }

    // Update description
    await db.execute(
      'UPDATE books SET description = ? WHERE id = ?',
      [description, id]
    );

    // Get updated book
    const [updatedBook] = await db.execute(
      'SELECT * FROM books WHERE id = ?',
      [id]
    );

    res.json({ 
      success: true, 
      message: 'Deskripsi buku berhasil diupdate',
      data: updatedBook[0]
    });

  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server' 
    });
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Public
exports.deleteBook = async (req, res) => {
  const { id } = req.params;

  try {
    // Cek apakah buku ada
    const [existingBook] = await db.execute(
      'SELECT * FROM books WHERE id = ?',
      [id]
    );

    if (existingBook.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Buku tidak ditemukan' 
      });
    }

    // Delete book
    await db.execute('DELETE FROM books WHERE id = ?', [id]);

    res.json({ 
      success: true, 
      message: 'Buku berhasil dihapus',
      data: existingBook[0]
    });

  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server' 
    });
  }
};

// @desc    Search books by book_name and/or description
// @route   GET /api/books/search
// @access  Public
exports.searchBooks = async (req, res) => {
  const { book_name, description } = req.query;

  try {
    let query = 'SELECT * FROM books WHERE 1=1';
    let queryParams = [];

    // Filter berdasarkan book_name
    if (book_name) {
      query += ' AND book_name LIKE ?';
      queryParams.push(`%${book_name}%`);
    }

    // Filter berdasarkan description
    if (description) {
      query += ' AND description LIKE ?';
      queryParams.push(`%${description}%`);
    }

    query += ' ORDER BY created_at DESC';

    const [books] = await db.execute(query, queryParams);

    res.json({
      success: true,
      data: books,
      total: books.length
    });

  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server' 
    });
  }
};