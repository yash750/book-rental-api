const express = require('express');
const router = express.Router();

const payFineController = require('../controllers/payFineController');
const { authenticate } = require('../middleware/auth');

router.post('/:id', authenticate, payFineController.payFine);

module.exports = router;