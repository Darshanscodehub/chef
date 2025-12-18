const express = require('express');
const router = express.Router();
const { 
    createBooking, 
    getChefBookings, 
    getUserBookings, 
    updateBookingStatus 
} = require('../controllers/bookingController');

router.post('/', createBooking);
router.get('/chef/:chefId', getChefBookings);
router.get('/user/:userId', getUserBookings);
router.put('/:id', updateBookingStatus);

module.exports = router;