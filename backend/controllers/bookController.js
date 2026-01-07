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
    
    if (!book_name || !author || !published_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'book_name, author, dan published_date wajib diisi' 
      });
    }

   
    if (book_name.length > 150) {
      return res.status(400).json({ 
        success: false, 
        message: 'book_name maksimal 150 karakter' 
      });
    }

    
    if (author.length > 150) {
      return res.status(400).json({ 
        success: false, 
        message: 'author maksimal 150 karakter' 
      });
    }


    if (!isValidDate(published_date)) {
      return res.status(400).json({ 
        success: false, 
        message: 'published_date harus tanggal yang valid' 
      });
    }

    
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

    
    if (search) {
      query += ' WHERE book_name LIKE ? OR description LIKE ?';
      countQuery += ' WHERE book_name LIKE ? OR description LIKE ?';
      const searchPattern = `%${search}%`;
      queryParams = [searchPattern, searchPattern];
      countParams = [searchPattern, searchPattern];
    }


    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);


    const [books] = await db.execute(query, queryParams);


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


exports.updateBook = async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  try {
    
    if (description === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'description wajib diisi' 
      });
    }

  
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

    await db.execute(
      'UPDATE books SET description = ? WHERE id = ?',
      [description, id]
    );

   
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


exports.searchBooks = async (req, res) => {
  const { book_name, description } = req.query;

  try {
    let query = 'SELECT * FROM books WHERE 1=1';
    let queryParams = [];

   
    if (book_name) {
      query += ' AND book_name LIKE ?';
      queryParams.push(`%${book_name}%`);
    }

 
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