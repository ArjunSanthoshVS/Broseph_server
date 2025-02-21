const express = require('express');
const router = express.Router();
const counselorController = require('../../controllers/admin/counselorController');
const adminAuth = require('../../middleware/admin/adminAuth');

// All routes require admin authentication
router.use(adminAuth);

// Get all counselors with filtering
router.get('/', counselorController.getCounselors);

// Create new counselor
router.post('/', counselorController.createCounselor);

// Update counselor
router.put('/:id', counselorController.updateCounselor);

// Delete counselor
router.delete('/:id', counselorController.deleteCounselor);

module.exports = router; 