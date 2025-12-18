const ChefProfile = require('../models/ChefProfile');
const User = require('../models/User');

// @desc    Update Chef Profile (Onboarding & Menu Updates)
// @route   PUT /api/chefs/profile (or /onboarding)
const updateChefProfile = async (req, res) => {
    try {
        const { userId, bio, experienceYears, hourlyRate, menu } = req.body;
        
        let idProofPath = '';
        if (req.file) {
            idProofPath = req.file.path;
        }

        let parsedMenu = [];
        if (menu) {
            try {
                parsedMenu = JSON.parse(menu);
            } catch (e) {
                console.error("Error parsing menu JSON", e);
            }
        }

        const profile = await ChefProfile.findOne({ user: userId });

        if (profile) {
            if (bio) profile.bio = bio;
            if (experienceYears) profile.experienceYears = experienceYears;
            if (hourlyRate) profile.hourlyRate = hourlyRate;
            // Update menu if provided
            if (menu) profile.menu = parsedMenu;
            
            if (idProofPath) {
                profile.documents.push({ docType: 'id_proof', filePath: idProofPath });
            }

            // Only reset verification if critical ID docs change, otherwise keep as is
            if (idProofPath) profile.isVerified = false; 

            const updatedProfile = await profile.save();
            res.json(updatedProfile);
        } else {
            res.status(404).json({ message: 'Chef Profile not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all verified chefs
const getVerifiedChefs = async (req, res) => {
    try {
        const chefs = await ChefProfile.find({ isVerified: true })
            .populate('user', 'name email');
        res.json(chefs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get chef by Profile ID (For Public Profile Page)
const getChefById = async (req, res) => {
    try {
        const chef = await ChefProfile.findById(req.params.id).populate('user', 'name');
        if (chef) res.json(chef);
        else res.status(404).json({ message: 'Chef not found' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get chef by User ID (For Chef Dashboard)
// @route   GET /api/chefs/user/:userId
const getChefByUserId = async (req, res) => {
    try {
        const chef = await ChefProfile.findOne({ user: req.params.userId }).populate('user', 'name');
        if (chef) res.json(chef);
        else res.status(404).json({ message: 'Chef not found' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { 
    updateChefProfile,
    getVerifiedChefs,
    getChefById,
    getChefByUserId
};