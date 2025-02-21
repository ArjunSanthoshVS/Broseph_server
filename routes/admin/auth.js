const express = require('express');
const router = express.Router();
const authController = require('../../controllers/admin/authController');
const adminAuth = require('../../middleware/admin/adminAuth');

// Public routes
// Register
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Forgot password
router.post('/forgotpassword', authController.forgotPassword);

// Reset password
router.put('/resetpassword/:resettoken', authController.resetPassword);

// Protected routes
router.get('/me', adminAuth, authController.getMe);
router.post('/logout', adminAuth, authController.logout);
router.put('/updatepassword', adminAuth, authController.updatePassword);

module.exports = router;
