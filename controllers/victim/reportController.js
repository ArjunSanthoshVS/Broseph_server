const Report = require('../../models/report');
const jwt = require('jsonwebtoken');

// Added helper function to generate report code
function generateReportCode() {
  return 'REPORT' + Math.floor(100 + Math.random() * 900);
}

// Added helper function to generate anonymous id
function generateAnonymousId() {
  return 'ANONYMOUS' + Math.floor(100 + Math.random() * 900);
}

// Create a new report
exports.createReport = async (req, res, next) => {
  try {
    const reportData = req.body;
    console.log(reportData, 'reportData in controller');

    let anonymousToken = null;
    if (!reportData.userId) {
      reportData.reporter = 'anonymous';
      reportData.anonymousId = generateAnonymousId();
      anonymousToken = jwt.sign({ anonymousId: reportData.anonymousId }, process.env.JWT_SECRET, { expiresIn: '1y' });
    }
    reportData.reportCode = generateReportCode();
    console.log(reportData, 'reportData');

    const newReport = await Report.create(reportData);
    res.status(201).json({ report: newReport, anonymousToken });
  } catch (err) {
    next(err);
  }
};

// List reports, optionally filter by reporter via query parameter
exports.getReports = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user) {
      filter = { userId: req.user._id };
    } else if (req.anonymous) {
      filter = { anonymousId: req.anonymous.anonymousId };
    }

    if (Object.keys(filter).length === 0) {
      res.json([]);
      return;
    }

    console.log(filter, 'filter');
    const reports = await Report.find(filter);
    console.log(reports, 'reports');

    res.json({ reports });
  } catch (err) {
    next(err);
  }
};

// List reports, optionally filter by reporter via query parameter
exports.getAnonymousReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ anonymousId: req.params.anonymousId });
    if (reports.length === 0) {
      return res.status(404).json({ error: 'No reports found' });
    }
    const anonymousToken = jwt.sign({ anonymousId: req.params.anonymousId }, process.env.JWT_SECRET, { expiresIn: '1y' });
    res.json({ reports, anonymousToken });
  } catch (err) {
    next(err);
  }
};

// Get a specific report by ID
exports.getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (err) {
    next(err);
  }
};

// Update a specific report by ID
exports.updateReport = async (req, res, next) => {
  try {
    console.log(req.body, 'req.body');
    const report = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(report);
  } catch (err) {
    next(err);
  }
}; 