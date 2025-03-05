const Report = require('../../models/report');
const Admin = require('../../models/admin');
const ChatRoom = require('../../models/chatRoom');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer for voice uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'public/uploads/voice';
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'voice-' + uniqueSuffix + '.webm');
  }
});

const upload = multer({ storage: storage });

// Added helper function to generate report code
function generateReportCode() {
  return 'TICKET' + Math.floor(100 + Math.random() * 900);
}

// Added helper function to generate anonymous id
function generateAnonymousId() {
  return 'ANONYMOUS' + Math.floor(100 + Math.random() * 900);
}

// Helper function to get an available admin
async function getAvailableAdmin() {
  try {
    // Get an active admin with the least number of active chat rooms
    const admin = await Admin.findOne({ status: 'active' })
      .sort({ lastLogin: -1 }) // Prioritize recently active admins
      .exec();

    if (!admin) {
      throw new Error('No active admin available');
    }

    return admin;
  } catch (error) {
    console.error('Error getting available admin:', error);
    throw error;
  }
}

// Create a new report
exports.createReport = [
  upload.single('locationAudio'),
  async (req, res, next) => {
    try {
      // Parse the JSON data from the form
      const reportData = JSON.parse(req.body.data);

      // Add voice recording path if uploaded
      if (req.file) {
        reportData.locationAudioPath = `/uploads/voice/${req.file.filename}`;
      }

      let anonymousToken = null;
      if (!req.user._id) {
        reportData.reporter = 'anonymous';
        reportData.anonymousId = generateAnonymousId();
        anonymousToken = jwt.sign({ anonymousId: reportData.anonymousId }, process.env.JWT_SECRET, { expiresIn: '1y' });
      }
      reportData.reportCode = generateReportCode();

      const newReport = await Report.create(reportData);

      // Create a chat room for the report
      try {
        const admin = await getAvailableAdmin();

        const chatRoomData = {
          roomId: `report-${newReport._id}`,
          victimType: 'registered',
          victimId: req.user._id,
          victimRef: req.user._id,
          adminId: admin._id,
          messages: []
        };
        newReport.userId = req.user._id;
        const chatRoom = await ChatRoom.create(chatRoomData);

        // Add chatRoomId to the report
        newReport.chatRoomId = chatRoom.roomId;
        await newReport.save();

        res.status(201).json({
          ticket: newReport,
          anonymousToken,
          chatRoom: chatRoom
        });
      } catch (chatError) {
        console.error('Error creating chat room:', chatError);
        // Still return the report even if chat room creation fails
        res.status(201).json({
          ticket: newReport,
          anonymousToken,
          error: 'Chat room creation failed'
        });
      }
    } catch (err) {
      // Clean up uploaded file if there's an error
      if (req.file) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      }
      return res.status(500).json({ error: err.message });
    }
  }
];

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
    console.log(filter);
    const reports = await Report.find(filter);

    res.json({ reports });
  } catch (err) {
    return res.status(500).json({ error: err.message });
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
    return res.status(500).json({ error: err.message });
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
    return res.status(500).json({ error: err.message });
  }
};

// Update a specific report by ID
exports.updateReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(report);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
