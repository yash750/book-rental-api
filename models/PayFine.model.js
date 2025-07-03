const mongoose = require('mongoose');

const payFineSchema = new mongoose.Schema({
    BorrowRecordId: mongoose.Schema.Types.ObjectId,
    outstandingFine: Number,
    fineStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paidAt: Date
},
{timestamps: true }
);

module.exports = mongoose.model('PayFine', payFineSchema);