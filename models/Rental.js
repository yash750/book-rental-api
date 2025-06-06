const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  bookId: mongoose.Schema.Types.ObjectId,
  rentedAt: { type: Date, default: Date.now },
  returnedAt: Date
});

module.exports = mongoose.model('Rental', rentalSchema);