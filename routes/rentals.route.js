const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const rentalController = require('../controllers/rentalController');

router.post('/', authenticate, rentalController.rentBook);
router.post('/return', authenticate, rentalController.returnBook);
router.get('/history', authenticate, rentalController.getHistory);


module.exports = router;