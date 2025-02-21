const Report = require('../../models/report');
const Counselor = require('../../models/counselor');

// @desc    Get all cases with filtering and pagination
// @route   GET /api/admin/cases
// @access  Private/Admin
exports.getCases = async (req, res) => {
  try {
    const {
      search,
      status,
      priority,
      counselorId,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = {};

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Filter by counselor
    if (counselorId) {
      query.assignedTo = counselorId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search in category, description, or reportCode
    if (search) {
      query.$or = [
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { reportCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const cases = await Report.find(query)
      .populate('assignedTo', 'name email department')
      .populate('escalatedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Transform the data to include formatted dates and proper structure
    const transformedCases = cases.map(case_ => {
      const caseObj = case_.toObject();
      return {
        ...caseObj,
        id: caseObj._id,
        assignedTo: caseObj.assignedTo ? caseObj.assignedTo.name : 'Unassigned',
        department: caseObj.assignedTo ? caseObj.assignedTo.department : '-',
        lastUpdated: caseObj.updatedAt,
        status: caseObj.status.charAt(0).toUpperCase() + caseObj.status.slice(1),
        priority: caseObj.priority.charAt(0).toUpperCase() + caseObj.priority.slice(1)
      };
    });

    // Get total count
    const total = await Report.countDocuments(query);

    res.status(200).json({
      success: true,
      data: transformedCases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving cases'
    });
  }
};

// @desc    Get case by ID
// @route   GET /api/admin/cases/:id
// @access  Private/Admin
exports.getCaseById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('assignedTo', 'name email department')
      .populate('escalatedTo', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving case'
    });
  }
};

// @desc    Assign case to counselor
// @route   PUT /api/admin/cases/assign/:id
// @access  Private/Admin
exports.assignCase = async (req, res) => {
  try {
    const { counselorId, status } = req.body;
    const reportId = req.params.id;

    // Check if report exists
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Check if counselor exists
    const counselor = await Counselor.findById(counselorId);
    if (!counselor) {
      return res.status(404).json({
        success: false,
        error: 'Counselor not found'
      });
    }

    // Update report with case management details
    report.assignedTo = counselorId;
    report.status = status || 'open';
    report.lastUpdated = new Date();

    await report.save();

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Assign case error:', error);
    res.status(500).json({
      success: false,
      error: 'Error assigning case'
    });
  }
};

// @desc    Update case
// @route   PUT /api/admin/cases/:id
// @access  Private/Admin
exports.updateCase = async (req, res) => {
  try {
    const {
      status,
      priority,
      notes,
      actions,
      nextFollowUp,
      escalatedTo,
      escalationReason,
      resolution
    } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      });
    }

    // Update fields
    let isUpdated = false;
    if (status) {
      report.status = status;
      isUpdated = true;
    }
    if (priority) {
      report.priority = priority;
      isUpdated = true;
    }
    if (notes) {
      report.notes.push({
        content: notes,
        createdBy: req.admin.id
      });
      isUpdated = true;
    }
    if (actions) {
      report.actions.push({
        type: actions,
        takenBy: req.admin.id
      });
      isUpdated = true;
    }
    if (nextFollowUp) {
      report.nextFollowUp = nextFollowUp;
      isUpdated = true;
    }
    if (escalatedTo) {
      report.escalatedTo = escalatedTo;
      report.escalationReason = escalationReason;
      isUpdated = true;
    }
    if (resolution) {
      report.resolution = {
        ...resolution,
        date: new Date(),
        resolvedBy: req.admin.id
      };
      report.status = 'resolved';
      isUpdated = true;
    }

    // Only update lastUpdated if there were actual changes
    if (isUpdated) {
      report.lastUpdated = new Date();
    }

    await report.save();

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating case'
    });
  }
};

// @desc    Unassign case
// @route   DELETE /api/admin/cases/:id
// @access  Private/Admin
exports.unassignCase = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      });
    }

    // Decrement counselor's casesHandled count
    if (report.assignedTo) {
      await Counselor.findByIdAndUpdate(report.assignedTo, {
        $inc: { casesHandled: -1 }
      });
    }

    // Reset case management fields
    report.assignedTo = undefined;
    report.status = 'submitted';
    report.escalatedTo = undefined;
    report.escalationReason = undefined;
    report.nextFollowUp = undefined;
    report.lastUpdated = new Date();

    await report.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Unassign case error:', error);
    res.status(500).json({
      success: false,
      error: 'Error unassigning case'
    });
  }
};

// @desc    Get case statistics
// @route   GET /api/admin/cases/stats
// @access  Private/Admin
exports.getCaseStats = async (req, res) => {
  try {
    const stats = await Report.aggregate([
      {
        $group: {
          _id: null,
          // Total reports
          totalReports: { $sum: 1 },
          
          // Status counts for all reports
          submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          
          // Priority counts for all reports
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } },
          
          // Assignment stats
          assignedCases: { $sum: { $cond: [{ $ne: ['$assignedTo', null] }, 1, 0] } },
          unassignedCases: { $sum: { $cond: [{ $eq: ['$assignedTo', null] }, 1, 0] } },
          
          // Urgency stats
          urgentUnassigned: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$isUrgent', true] },
                  { $eq: ['$assignedTo', null] }
                ]},
                1,
                0
              ]
            }
          },
          
          // Evidence stats
          withEvidence: { $sum: { $cond: [{ $eq: ['$hasEvidence', true] }, 1, 0] } },
          withWitnesses: { $sum: { $cond: [{ $eq: ['$hasWitnesses', true] }, 1, 0] } },
          
          // Time-based metrics
          recentReports: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] }, // Last 7 days
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalReports: 1,
          statusBreakdown: {
            submitted: '$submitted',
            open: '$open',
            inProgress: '$inProgress',
            pending: '$pending',
            resolved: '$resolved',
            closed: '$closed'
          },
          priorityBreakdown: {
            urgent: '$urgent',
            high: '$high',
            medium: '$medium',
            low: '$low'
          },
          caseAssignment: {
            assigned: '$assignedCases',
            unassigned: '$unassignedCases',
            urgentUnassigned: '$urgentUnassigned'
          },
          evidenceStats: {
            withEvidence: '$withEvidence',
            withWitnesses: '$withWitnesses'
          },
          recentReports: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalReports: 0,
        statusBreakdown: {
          submitted: 0,
          open: 0,
          inProgress: 0,
          pending: 0,
          resolved: 0,
          closed: 0
        },
        priorityBreakdown: {
          urgent: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        caseAssignment: {
          assigned: 0,
          unassigned: 0,
          urgentUnassigned: 0
        },
        evidenceStats: {
          withEvidence: 0,
          withWitnesses: 0
        },
        recentReports: 0
      }
    });
  } catch (error) {
    console.error('Get case stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving case statistics'
    });
  }
}; 