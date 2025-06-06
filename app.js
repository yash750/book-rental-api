const express = require('express');
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const rentalRoutes = require('./routes/rentals');

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/rentals', rentalRoutes);

module.exports = app;
