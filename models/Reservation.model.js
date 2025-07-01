const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    bookId: mongoose.Schema.Types.ObjectId,
    reservedAt: { type: Date, default: Date.now },
    expiresAt: Date,
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
},
{ timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);