const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const chefController = require('../controllers/chefController');

// --- Specific Routes First ---

// @route   GET api/chef/me
// @desc    Get current chef profile (Protected)
router.get('/me', auth, chefController.getCurrentChefProfile);

// @route   POST api/chef/menu
// @desc    Add dish to menu (Protected)
router.post('/menu', auth, chefController.addDish);

// @route   GET api/chef/public
// @desc    Get verified chefs
router.get('/public', chefController.getVerifiedChefs);

// @route   GET api/chef/user/:userId
// @desc    Get chef by User ID
router.get('/user/:userId', chefController.getChefByUserId);

// @route   POST api/chef
// @desc    Create or update chef profile
router.post('/', [auth, upload.single('idProof')], chefController.createOrUpdateProfile);

// Frontend compatibility aliases
router.put('/onboarding', [auth, upload.single('idProof')], chefController.createOrUpdateProfile);
router.put('/profile', [auth, upload.single('idProof')], chefController.createOrUpdateProfile);

// @route   GET api/chef
// @desc    Get all chefs
router.get('/', chefController.getAllChefs);

// --- Generic/Parameterized Routes Last ---

// @route   GET api/chef/:id
// @desc    Get chef by Profile ID
router.get('/:id', chefController.getChefById);

module.exports = router;