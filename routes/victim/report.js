const express = require('express');
const router = express.Router();
const reportController = require('../../controllers/victim/reportController');
const auth = require('../../middleware/victim/auth');

// POST /victim/report - Create a new report
router.post('/',  reportController.createReport);

// GET /victim/report - List all reports (optionally filter by reporter)
router.get('/', auth, reportController.getReports);

// GET /victim/report - List all reports (optionally filter by reporter)
router.get('/anonymous/:anonymousId', auth, reportController.getAnonymousReports);

// GET /victim/report/:id - Get a specific report by ID
router.get('/:id', auth, reportController.getReportById);

// PUT /victim/report/:id - Update a specific report by ID
router.put('/:id', auth, reportController.updateReport);

module.exports = router; 