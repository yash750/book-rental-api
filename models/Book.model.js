const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  name: String,
  author: String,
  isbn: String,
  genre: String,
  description: String,
  language: String,
  copiesTotal: Number,
  copiesAvailable: Number,
  price: Number
},
{timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);