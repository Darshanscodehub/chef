const express = require('express');
const router = express.Router();
const { 
    updateChefProfile, 
    getVerifiedChefs, 
    getChefById,
    getChefByUserId
} = require('../controllers/chefController');
const upload = require('../middleware/uploadMiddleware');

// Update/Onboarding Route
router.put('/onboarding', upload.single('idProof'), updateChefProfile);
router.put('/profile', upload.single('idProof'), updateChefProfile); // Alias for clarity

// Getters
router.get('/public', getVerifiedChefs);
router.get('/user/:userId', getChefByUserId); // NEW: Get by User ID
router.get('/:id', getChefById);

module.exports = router;