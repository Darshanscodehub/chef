const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const chefController = require('../controllers/chefController');

// --- Specific Routes (Must come BEFORE /:id) ---

// @route   GET api/chef/me
// @desc    Get current chef profile
// @access  Private
router.get('/me', auth, chefController.getCurrentChefProfile);

// @route   POST api/chef/menu
// @desc    Add dish to menu
// @access  Private
router.post('/menu', auth, chefController.addDish);

// @route   GET api/chef/public
// @desc    Get verified chefs
// @access  Public
router.get('/public', chefController.getVerifiedChefs);

// @route   GET api/chef/user/:userId
// @desc    Get chef by User ID
// @access  Public
router.get('/user/:userId', chefController.getChefByUserId);

// @route   POST api/chef (also used as PUT /onboarding in frontend logic)
// @desc    Create or update chef profile
// @access  Private
router.post('/', [auth, upload.single('idProof')], chefController.createOrUpdateProfile);
router.put('/onboarding', [auth, upload.single('idProof')], chefController.createOrUpdateProfile);
router.put('/profile', [auth, upload.single('idProof')], chefController.createOrUpdateProfile);

// @route   GET api/chef
// @desc    Get all chefs
// @access  Public
router.get('/', chefController.getAllChefs);

// --- Parameterized Routes (Must come LAST) ---

// @route   GET api/chef/:id
// @desc    Get chef by Profile ID
// @access  Public
router.get('/:id', chefController.getChefById);

module.exports = router;