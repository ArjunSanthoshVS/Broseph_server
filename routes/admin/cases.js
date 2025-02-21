const express = require('express');
const router = express.Router();
const caseController = require('../../controllers/admin/caseController');
const adminAuth = require('../../middleware/admin/adminAuth');

// All routes require admin authentication
router.use(adminAuth);

// Get case statistics
router.get('/stats', caseController.getCaseStats);

// Get all cases with filtering
router.get('/', caseController.getCases);

// Get case by ID
router.get('/:id', caseController.getCaseById);

// Assign case to counselor
router.put('/assign/:id', caseController.assignCase);

// Update case
router.put('/:id', caseController.updateCase);

// Unassign case
router.delete('/:id/unassign', caseController.unassignCase);

module.exports = router; 