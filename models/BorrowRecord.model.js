const mongoose = require('mongoose');

const borrowRecordSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  bookId: mongoose.Schema.Types.ObjectId,
  issueAt: { type: Date, default: Date.now },
  dueAt: Date,
  returnedAt: Date,
  fineAmount: { type: Number, default: 0 },
  isReturned: { type: Boolean, default: false },
  isLate: { type: Boolean, default: false }
}, 
{ timestamps: true }
);

module.exports = mongoose.model('borrowRecord', borrowRecordSchema);