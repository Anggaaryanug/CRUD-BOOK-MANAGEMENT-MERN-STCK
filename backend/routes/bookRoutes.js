const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// Search route harus di atas route dengan :id parameter
// untuk menghindari "search" dianggap sebagai ID
router.get('/search', bookController.searchBooks);

// CRUD Routes
router.post('/', bookController.createBook);
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);
router.put('/:id', bookController.updateBook);
router.delete('/:id', bookController.deleteBook);

module.exports = router;