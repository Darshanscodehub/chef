const Booking = require('../models/Booking');
const ChefProfile = require('../models/ChefProfile');

// Create Booking
exports.createBooking = async (req, res) => {
    const { chefId, date, time, guests, specialRequests } = req.body;

    try {
        const booking = new Booking({
            user: req.user.id,
            chef: chefId, // matches the ChefProfile ID
            date,
            time,
            guests,
            specialRequests
        });

        await booking.save();
        res.json(booking);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get Bookings for Customer
exports.getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id }).populate('chef');
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get Bookings for Chef
exports.getChefBookings = async (req, res) => {
    try {
        // 1. Find the chef profile for the logged-in user
        const chefProfile = await ChefProfile.findOne({ user: req.user.id });
        
        if (!chefProfile) {
            return res.status(404).json({ msg: 'Chef profile not found' });
        }

        // 2. Find bookings linked to this chef profile
        const bookings = await Booking.find({ chef: chefProfile._id })
            .populate('user', ['name', 'email'])
            .sort({ date: 1 });

        res.json(bookings);
    } catch (err) {
        console.error("Error in getChefBookings:", err.message);
        res.status(500).send('Server Error');
    }
};

// Update Status
exports.updateBookingStatus = async (req, res) => {
    const { status } = req.body; // 'confirmed' or 'rejected'

    try {
        let booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Verify ownership: Is the logged-in user the owner of the chef profile for this booking?
        const chefProfile = await ChefProfile.findOne({ user: req.user.id });
        
        if (!chefProfile || booking.chef.toString() !== chefProfile._id.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        booking.status = status;
        await booking.save();
        res.json(booking);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};