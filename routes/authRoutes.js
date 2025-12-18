const express = require('express');
const router = express.Router();
// Import the controller functions
const { registerUser, loginUser } = require('../controllers/authController');

// Route for Registration (Matches the fetch call in auth.js)
router.post('/register', registerUser);

// Route for Login
router.post('/login', loginUser);

module.exports = router;