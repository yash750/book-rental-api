const express = require('express');
const authRoutes = require('./routes/auth.route');
const bookRoutes = require('./routes/books.route');
const rentalRoutes = require('./routes/rentals.route');
const reservationRoutes = require('./routes/reservation.route');
const payFineRoutes = require('./routes/payFines.route');
const nestedRoutes = require('./routes/nested.route');

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/rentals', rentalRoutes);
app.use('/reservations', reservationRoutes);
app.use('/fines', payFineRoutes);
app.use('/nested', nestedRoutes);

module.exports = app;
