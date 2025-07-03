const mongoose = require('mongoose');
const BorrowRecord = require('../models/BorrowRecord.model');
const User = require('../models/User.model');
const PayFine = require('../models/PayFine.model');

exports.payFine = async (req, res) => {
    try {
        const fineRecord = await payFine.findById(req.params.id);
        if (!fineRecord) return res.status(404).json({ message: 'Payment not found' });
        fineRecord.fineStatus = 'paid';
        fineRecord.paidAt = new Date();
        await fineRecord.save();
        console.log(req.body);
        console.log("Payment received");
        return res.status(200).json({ message: 'Payment received' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};