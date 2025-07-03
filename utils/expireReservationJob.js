// expireReservationsJob.js
const cron = require('node-cron');
const mongoose = require('mongoose');
const Reservation = require('../models/Reservation.model'); // adjust path

require('dotenv').config( { path: '../.env'} );
const MONGO_URI = process.env.MONGO_URI;
const expireReservation =  async () =>  {
    try {

        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
          });
          
        cron.schedule('*/5 * * * *', async () => {
        console.log('Running reservation expiry job at', new Date(Date.now()));
        
        const result = await Reservation.updateMany(
            {
            status: 'pending',
            expiryAt: { $lt: new Date(Date.now()) }
            },
            {
            $set: { status: 'expired' }
            }
        );
        console.log(`Updated ${result.modifiedCount} reservations to 'expired'`);
        });

    } catch (error) {
        console.error('Error scheduling reservation expiry job:', error);
        throw error;
    }
}

exports.module = expireReservation;

