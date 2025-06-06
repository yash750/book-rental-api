const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const bookController = require('../controllers/bookController');

router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);
router.post('/', authenticate, authorize('admin'), bookController.addBook);
router.put('/:id', authenticate, authorize('admin'), bookController.updateBook);
router.delete('/:id', authenticate, authorize('admin'), bookController.deleteBook);

module.exports = router;