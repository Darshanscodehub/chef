const ChefProfile = require('../models/ChefProfile');
const User = require('../models/User');

// Create or Update Chef Profile (Used for Onboarding and Updates)
exports.createOrUpdateProfile = async (req, res) => {
  const { specialties, experience, menu } = req.body;
  const profileFields = {};
  profileFields.user = req.user.id;
  if (specialties) profileFields.specialties = specialties.split(',').map(s => s.trim());
  if (experience) profileFields.experience = experience;
  
  // If menu is sent as JSON string (from some frontends), parse it, otherwise assign directly
  if (menu) {
      profileFields.menu = typeof menu === 'string' ? JSON.parse(menu) : menu;
  }
  
  // Handle ID Proof file upload
  if (req.file) {
    profileFields.idProof = req.file.path;
  }

  try {
    let profile = await ChefProfile.findOne({ user: req.user.id });

    if (profile) {
      // Update existing profile
      profile = await ChefProfile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    }

    // Create new profile
    profile = new ChefProfile(profileFields);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Alias for backwards compatibility if routes call 'updateChefProfile'
exports.updateChefProfile = exports.createOrUpdateProfile;

// Get Current Chef Profile
exports.getCurrentChefProfile = async (req, res) => {
  try {
    const profile = await ChefProfile.findOne({ user: req.user.id }).populate('user', ['name', 'email']);
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this chef' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get All Chefs
exports.getAllChefs = async (req, res) => {
  try {
    const profiles = await ChefProfile.find().populate('user', ['name', 'email']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get Verified Chefs (Example implementation)
exports.getVerifiedChefs = async (req, res) => {
    try {
        // Assuming 'isVerified' is a field, or just return all for now
        const profiles = await ChefProfile.find().populate('user', ['name', 'email']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get Chef by Profile ID
exports.getChefById = async (req, res) => {
  try {
    // Check if valid ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ msg: 'Invalid Chef ID' });
    }

    const profile = await ChefProfile.findById(req.params.id).populate('user', ['name', 'email']);
    if (!profile) return res.status(400).json({ msg: 'Chef not found' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get Chef by User ID
exports.getChefByUserId = async (req, res) => {
    try {
      const profile = await ChefProfile.findOne({ user: req.params.userId }).populate('user', ['name', 'email']);
      if (!profile) return res.status(400).json({ msg: 'Chef profile not found' });
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
};

// Add Dish to Menu
exports.addDish = async (req, res) => {
  try {
    const { name, price, description, image } = req.body;

    const profile = await ChefProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ msg: 'Chef profile not found' });
    }

    const newDish = {
      name,
      price,
      description,
      image
    };

    profile.menu.unshift(newDish);
    await profile.save();

    // Return the FULL profile so frontend has the updated menu
    res.json(profile); 
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};