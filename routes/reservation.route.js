const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const reservation = require('../controllers/reservation.controller');

router.get('/', authenticate, authorize('admin'), reservation.getReservations);
router.post('/create', authenticate, reservation.createReservation);
router.post('/accept/:id', authenticate, reservation.acceptReservation);
router.post('/reject/:id', authenticate, authorize('admin'), reservation.rejectReservation);


module.exports = router;