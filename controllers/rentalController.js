const borrowRecord = require('../models/BorrowRecord.model');
const Book = require('../models/Book.model');
const User = require('../models/User.model');
const payFine = require('../models/PayFine.model');

exports.rentBook = async (req, res) => {
  const book = await Book.findById(req.body.bookId);
  const user = await User.findById(req.user.id);
  if (!book || book.copiesAvailable < 1) return res.status(400).json({ message: 'Book unavailable' });
  book.copiesAvailable--;
  await book.save();
  const record = new borrowRecord({ userId: req.user.id, bookId: req.body.bookId });
  record.dueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  record.issueAt = new Date(Date.now());
  user.borrowedBooksCount++;
  await user.save();
  await record.save();
  res.status(201).json(record);
};

const isLate = async (record) => {
  const isLate = await record.dueAt < new Date();
  return isLate;
};

//Calculate fine if user isLate in returning the book
const calculateFine = async (record) => {
  const delayInDays = await Math.ceil((record.dueAt - record.returnedAt) / (1000 * 60 * 60 * 24));
  const fine = delayInDays * 10;
  return fine;
};

exports.returnBook = async (req, res) => {
  const record = await borrowRecord.findOne({ userId: req.user.id, bookId: req.body.bookId, returnedAt: null });
  const user = await User.findById(req.user.id);
  const fineRecord = await payFine.findOne({ BorrowRecordId: record._id });
  if (!record) return res.status(400).json({ message: 'No active rental found' });

  if(isLate(record) && !fineRecord){
    record.fineAmount = await calculateFine(record);
    user.outstandingFine += record.fineAmount;
    fineRecord = new payFine({ BorrowRecordId: record._id, outstandingFine: record.fineAmount });
    record.isLate = true;
    await fineRecord.save();
    await record.save();
    await user.save();
  }
  if(isLate(record) && fineRecord.fineStatus === 'pending'){
    console.log('Pay the fine and then return the book');
    console.log("Click here to make payment :");
    console.log(`https://localhost:5000/payFine/make-payment/${fineRecord._id}`);
    return;
  }

  record.returnedAt = new Date();
  record.isReturned = true;
  user.borrowedBooksCount--;
  await record.save();
  await user.save();
  const book = await Book.findById(record.bookId);
  book.copiesAvailable++;
  await book.save();
  res.json({ message: 'Book returned' });
};

exports.getHistory = async (req, res) => {
  const history = await borrowRecord.find({ userId: req.user.id });
  res.json(history);
};