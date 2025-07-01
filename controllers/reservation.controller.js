// add logic to create a new reservation
const Reservation = require('../models/Reservation.model');
const books = require('../models/Book.model');
const borrowRecord = require('../models/BorrowRecord.model');
const User = require('../models/User.model');

exports.createReservation = async (req, res) => {
    try {
        const { bookId } = req.body;
        const userId = req.user.id; // Use authenticated user's ID, not from body
        const reservation = new Reservation({ userId, bookId});
        const book = await books.findById(bookId);
        if (!book || book.copiesAvailable < 1) return res.status(400).json({ message: 'Book unavailable' });
        
        book.copiesAvailable--;
        await book.save();
        
        reservation.expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now
        await reservation.save();
        res.status(201).json(reservation);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

exports.getReservations = async (req, res) => {
    try {
        // Assuming only admins can see all reservations. A user might see their own.
        const query = req.user.role === 'admin' ? {} : { userId: req.user.id };
        const reservations = await Reservation.find(query);
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};


exports.rejectReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
        if (reservation.status !== 'pending') return res.status(400).json({ message: `Reservation already ${reservation.status}` });

        const book = await books.findById(reservation.bookId);
        reservation.status = 'rejected';
        book.copiesAvailable++;
        await book.save();
        await reservation.save();
        res.json(reservation);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

exports.acceptReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
        if (reservation.status !== 'pending') return res.status(400).json({ message: `Reservation already ${reservation.status}` });
        if (reservation.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Reservation expired' });
        }
        
        const user = await User.findById(reservation.userId);
        reservation.status = 'accepted';
        
        const record = new borrowRecord({ userId: reservation.userId, bookId: reservation.bookId });
        record.dueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        user.borrowedBooksCount++;
        
        await record.save();
        await user.save();
        await reservation.save();
        res.json(reservation);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}