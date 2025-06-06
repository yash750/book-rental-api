const Rental = require('../models/Rental');
const Book = require('../models/Book');

exports.rentBook = async (req, res) => {
  const book = await Book.findById(req.body.bookId);
  if (!book || book.stock < 1) return res.status(400).json({ message: 'Book unavailable' });
  book.stock--;
  await book.save();
  const rental = new Rental({ userId: req.user.id, bookId: req.body.bookId });
  await rental.save();
  res.status(201).json(rental);
};

exports.returnBook = async (req, res) => {
  const rental = await Rental.findOne({ userId: req.user.id, bookId: req.body.bookId, returnedAt: null });
  if (!rental) return res.status(400).json({ message: 'No active rental found' });
  rental.returnedAt = new Date();
  await rental.save();
  const book = await Book.findById(rental.bookId);
  book.stock++;
  await book.save();
  res.json({ message: 'Book returned' });
};

exports.getHistory = async (req, res) => {
  const history = await Rental.find({ userId: req.user.id });
  res.json(history);
};