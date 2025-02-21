const Counselor = require('../../models/counselor');

// @desc    Get all counselors with filtering
// @route   GET /api/admin/counselors
// @access  Private/Admin
exports.getCounselors = async (req, res) => {
  try {
    const {
      search,
      department,
      role,
      status,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by department
    if (department && department !== 'All Departments') {
      query.department = department;
    }

    // Filter by role
    if (role && role !== 'All Roles') {
      query.role = role;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const counselors = await Counselor.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Counselor.countDocuments(query);

    res.status(200).json({
      success: true,
      data: counselors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get counselors error:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving counselors'
    });
  }
};

// @desc    Create new counselor
// @route   POST /api/admin/counselors
// @access  Private/Admin
exports.createCounselor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      accessLevel
    } = req.body;

    // Check if counselor already exists
    const existingCounselor = await Counselor.findOne({ email });
    if (existingCounselor) {
      return res.status(400).json({
        success: false,
        error: 'A counselor with this email already exists'
      });
    }

    // Create counselor
    const counselor = await Counselor.create({
      name,
      email,
      password,
      role,
      department,
      accessLevel,
      status: 'training',
      trainingStatus: 'not-started'
    });

    // Remove password from response
    counselor.password = undefined;

    res.status(201).json({
      success: true,
      data: counselor
    });
  } catch (error) {
    console.error('Create counselor error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating counselor'
    });
  }
};

// @desc    Update counselor
// @route   PUT /api/admin/counselors/:id
// @access  Private/Admin
exports.updateCounselor = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      department,
      status,
      accessLevel,
      trainingStatus,
      trainingProgress,
      activityScore,
      casesHandled,
      certifications
    } = req.body;

    const counselor = await Counselor.findById(req.params.id);

    if (!counselor) {
      return res.status(404).json({
        success: false,
        error: 'Counselor not found'
      });
    }

    // Update fields
    if (name) counselor.name = name;
    if (email) counselor.email = email;
    if (role) counselor.role = role;
    if (department) counselor.department = department;
    if (status) counselor.status = status;
    if (accessLevel) counselor.accessLevel = accessLevel;
    if (trainingStatus) counselor.trainingStatus = trainingStatus;
    if (trainingProgress) counselor.trainingProgress = trainingProgress;
    if (activityScore) counselor.activityScore = activityScore;
    if (casesHandled) counselor.casesHandled = casesHandled;
    if (certifications) counselor.certifications = certifications;

    await counselor.save();

    res.status(200).json({
      success: true,
      data: counselor
    });
  } catch (error) {
    console.error('Update counselor error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating counselor'
    });
  }
};

// @desc    Delete counselor
// @route   DELETE /api/admin/counselors/:id
// @access  Private/Admin
exports.deleteCounselor = async (req, res) => {
  try {
    const counselor = await Counselor.findById(req.params.id);

    if (!counselor) {
      return res.status(404).json({
        success: false,
        error: 'Counselor not found'
      });
    }

    await counselor.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete counselor error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting counselor'
    });
  }
}; 