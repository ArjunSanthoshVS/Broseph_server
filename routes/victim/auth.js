const express = require('express');
const router = express.Router();
const authController = require('../../controllers/victim/authController');
const { validatePhone, validateOtp } = require('../../middleware/victim/validateRequest');
const auth = require('../../middleware/victim/auth');

// Public routes
// Send OTP (handles both registration and login)
router.post('/send-otp', validatePhone, authController.sendOtp);

// Verify OTP
router.post('/verify-otp', validateOtp, authController.verifyOtp);

// Get current user
router.get('/me', auth, authController.getCurrentUser);

module.exports = router; 