const Booking = require('../models/Booking');
const ChefProfile = require('../models/ChefProfile');

exports.createBooking = async (req, res) => {
  // Support both authenticated requests and an explicit userId in body (fallback)
  const {
    chefId,
    date,
    time,
    hours,
    guests,
    totalPrice,
    includeIngredients,
    dishes,
    specialRequests,
    userId
  } = req.body;

  try {
    const booking = new Booking({
      user: req.user ? req.user.id : userId,
      chef: chefId,
      date,
      time,
      hours,
      guests,
      totalPrice,
      includeIngredients,
      dishes,
      specialRequests
    });

    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error('Error creating booking:', err.message);
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
    // Bookings where the 'chef' field matches the logged-in user's ID
    const bookings = await Booking.find({ chef: req.user.id })
      .populate('user', ['name', 'email'])
      .sort({ date: 1 });

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

        if (booking.chef.toString() !== req.user.id) {
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