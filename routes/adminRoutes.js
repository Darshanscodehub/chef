const express = require('express');
const router = express.Router();
const ChefProfile = require('../models/ChefProfile');
const User = require('../models/User');

// @desc    Get all pending chefs
// @route   GET /api/admin/pending
router.get('/pending', async (req, res) => {
    try {
        // Find profiles where isVerified is false
        // .populate('user', 'name email') means "Go look up the User table and get the name/email for this ID"
        const pendingChefs = await ChefProfile.find({ isVerified: false }).populate('user', 'name email');
        res.json(pendingChefs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Approve a chef
// @route   PUT /api/admin/approve/:id
router.put('/approve/:id', async (req, res) => {
    try {
        const chef = await ChefProfile.findById(req.params.id);
        if (chef) {
            chef.isVerified = true;
            await chef.save();
            res.json({ message: 'Chef Approved' });
        } else {
            res.status(404).json({ message: 'Chef not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Reject a chef (Delete profile)
// @route   DELETE /api/admin/reject/:id
router.delete('/reject/:id', async (req, res) => {
    try {
        await ChefProfile.findByIdAndDelete(req.params.id);
        res.json({ message: 'Chef Rejected' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;