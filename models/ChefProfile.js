const mongoose = require('mongoose');

const chefProfileSchema = new mongoose.Schema({
    // Link to the User Login Account
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bio: {
        type: String
    },
    specialties: [{
        type: String // e.g. ["Italian", "Keto"]
    }],
    experienceYears: {
        type: Number,
        default: 0
    },
    hourlyRate: {
        type: Number,
        default: 500
    },
    location: {
        type: String, // e.g. "Pune"
        default: "Unknown"
    },
    
    // Status Logic
    isOnline: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    
    // For the Menu Section
    menu: [{
        name: String,
        price: Number, // Optional (if per dish)
        description: String,
        image: String
    }],

    // For Admin Verification
    documents: [{
        docType: String, // "Aadhar", "Certificate"
        filePath: String
    }],
    
    rating: {
        type: Number,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('ChefProfile', chefProfileSchema);