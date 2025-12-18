const Booking = require('../models/Booking');
const ChefProfile = require('../models/ChefProfile');

exports.createBooking = async (req, res) => {
  const { chefId, date, time, guests, specialRequests } = req.body;

  try {
    const booking = new Booking({
      user: req.user.id,
      chef: chefId,
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

exports.getBookings = async (req, res) => {
  try {
    // Bookings for the CUSTOMER (filtered by user: req.user.id)
    const bookings = await Booking.find({ user: req.user.id })
      .populate('chef')
      .sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get bookings specifically for the logged-in chef
exports.getChefBookings = async (req, res) => {
  try {
    // 1. Find the chef profile associated with this logged-in user
    const chefProfile = await ChefProfile.findOne({ user: req.user.id });
    
    if (!chefProfile) {
        return res.status(404).json({ msg: 'Chef profile not found for this user' });
    }

    // 2. Find bookings where the 'chef' field matches this ChefProfile ID
    const bookings = await Booking.find({ chef: chefProfile._id })
        .populate('user', ['name', 'email']) // Populate customer details
        .sort({ date: 1 }); // Pending jobs usually need soonest first

    res.json(bookings);
  } catch (err) {
    console.error("Error in getChefBookings:", err.message);
    res.status(500).send('Server Error');
  }
};

// Update Booking Status (Accept/Reject)
exports.updateBookingStatus = async (req, res) => {
    const { status } = req.body; // Expecting 'confirmed' or 'rejected'

    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Verify that the logged-in user is actually the chef for this booking
        const chefProfile = await ChefProfile.findOne({ user: req.user.id });
        
        if (!chefProfile || booking.chef.toString() !== chefProfile._id.toString()) {
            return res.status(401).json({ msg: 'Not authorized to manage this booking' });
        }

        booking.status = status;
        await booking.save();

        res.json(booking);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};