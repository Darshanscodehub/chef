const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Create new booking
// @route   POST /api/bookings
const createBooking = async (req, res) => {
    try {
        const { chefId, userId, date, hours, guests, totalPrice, includeIngredients, dishes } = req.body;

        const booking = await Booking.create({
            chef: chefId,
            user: userId,
            date,
            hours,
            guests,
            totalPrice,
            includeIngredients,
            dishes
        });

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get bookings for a specific chef
// @route   GET /api/bookings/chef/:chefId
const getChefBookings = async (req, res) => {
    try {
        // Find bookings where 'chef' matches the ID
        // Populate 'user' to get the customer's name
        const bookings = await Booking.find({ chef: req.params.chefId })
            .populate('user', 'name email phone')
            .sort({ date: 1 }); // Sort by date (soonest first)
            
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get bookings for a specific customer
// @route   GET /api/bookings/user/:userId
const getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.params.userId })
            .populate('chef', 'name')
            .sort({ date: -1 }); // Newest created first
            
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update booking status (Accept/Reject)
// @route   PUT /api/bookings/:id
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'confirmed' or 'rejected'
        const booking = await Booking.findById(req.params.id);

        if (booking) {
            booking.status = status;
            const updatedBooking = await booking.save();
            res.json(updatedBooking);
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createBooking,
    getChefBookings,
    getUserBookings,
    updateBookingStatus
};