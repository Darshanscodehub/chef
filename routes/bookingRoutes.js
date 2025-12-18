const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.js');
const bookingController = require('../controllers/bookingController');

// @route   POST api/bookings
// @desc    Create a booking (Customer creates)
// @access  Private
router.post('/', auth, bookingController.createBooking);

// @route   GET api/bookings
// @desc    Get bookings for current user (Customer view)
// @access  Private
router.get('/', auth, bookingController.getBookings);

// @route   GET api/bookings/chef
// @desc    Get bookings for current user (Chef view)
// @access  Private
router.get('/chef', auth, bookingController.getChefBookings);

// @route   PUT api/bookings/:id/status
// @desc    Update booking status (Chef accepts/rejects)
// @access  Private
router.put('/:id/status', auth, bookingController.updateBookingStatus);

module.exports = router;