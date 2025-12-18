const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chef: { // We link to the User ID of the chef, not the profile ID, for easier querying
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    // Optional: time of day as string (used by frontend display)
    time: {
        type: String
    },
    hours: {
        type: Number,
        required: true
    },
    guests: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    includeIngredients: {
        type: Boolean,
        default: false
    },
    dishes: [{ type: String }], // Optional: list of dish names requested
    specialRequests: {
        type: String
    },
    
    // Status Flow: pending -> confirmed -> completed (or rejected)
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', bookingSchema);