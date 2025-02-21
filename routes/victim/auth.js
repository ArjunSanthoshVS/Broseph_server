const express = require('express');
const router = express.Router();
const authController = require('../../controllers/victim/authController');
const { validateRegistration, validatePhone, validateOtp } = require('../../middleware/victim/validateRequest');
const auth = require('../../middleware/victim/auth');

// Public routes
// Register new user
router.post('/register', validateRegistration, authController.register);

// Send OTP (for login)
router.post('/send-otp', validatePhone, authController.sendOtp);

// Verify OTP
router.post('/verify-otp', validateOtp, authController.verifyOtp);

// Get current user
router.get('/me', auth, authController.getCurrentUser);

module.exports = router; 