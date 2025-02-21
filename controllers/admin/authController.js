const Admin = require('../../models/admin');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    // Convert password to string immediately when destructuring
    const password = req.body.password?.toString();

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    // Check if email is valid
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'An admin with this email already exists'
      });
    }

    // Validate role
    const validRoles = ['admin', 'super_admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role specified'
      });
    }

    // Only super_admin can create other super_admins
    if (role === 'super_admin' && (!req.admin || req.admin.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create super admin accounts'
      });
    }

    // Create admin (password will be hashed by the model's pre-save middleware)
    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: password,  // Just pass the plain password, model will hash it
      role: role || 'admin',
      status: 'active',
      lastLogin: null
    });

    const token = admin.generateAuthToken();

    // Remove password from output
    admin.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      token,
      data: admin
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'An admin with this email already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error during registration process'
    });
  }
};

// @desc    Login admin
// @route   POST /api/admin/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Convert password to string if it's not already
    const passwordStr = password.toString();

    // Check for admin
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if admin is active
    if (admin.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Your account is not active. Please contact super admin.'
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(passwordStr, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save({ validateBeforeSave: false });

    // Generate Token
    const token = admin.generateAuthToken();

    // Remove password from output
    admin.password = undefined;

    res.status(200).json({
      success: true,
      token,
      data: admin
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error during login process'
    });
  }
};

// @desc    Logout admin
// @route   POST /api/admin/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    req.admin = null;
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Error during logout process'
    });
  }
};

// @desc    Get current logged in admin
// @route   GET /api/admin/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving admin information'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/admin/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'There is no admin with that email'
      });
    }

    // Generate reset token
    const resetToken = await bcrypt.hash(admin.email + Date.now().toString(), 10);
    admin.passwordResetToken = resetToken;
    admin.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await admin.save({ validateBeforeSave: false });

    // Create reset url
    const encodedToken = encodeURIComponent(resetToken);
    const resetUrl = `${req.protocol}://${req.get('host')}/admin/resetpassword/${encodedToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please follow this link to reset your password: \n\n ${resetUrl}\n\nThis link will expire in 10 minutes.`;

    try {
      await sendEmail({
        email: admin.email,
        subject: 'Password Reset Request',
        message
      });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (emailError) {
      console.error('Reset email error:', emailError);
      admin.passwordResetToken = undefined;
      admin.passwordResetExpires = undefined;
      await admin.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        error: 'Email could not be sent'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Error processing password reset request'
    });
  }
};

// @desc    Reset password
// @route   PUT /api/admin/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const decodedToken = decodeURIComponent(req.params.resettoken);

    const admin = await Admin.findOne({
      passwordResetToken: decodedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Convert password to string if it's not already
    const passwordStr = req.body.password.toString();

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(passwordStr, salt);
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save();

    // Generate new token
    const token = admin.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token,
      data: admin
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Error resetting password'
    });
  }
};

// @desc    Update password
// @route   PUT /api/admin/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('+password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Convert passwords to strings if they're not already
    const currentPasswordStr = req.body.currentPassword.toString();
    const newPasswordStr = req.body.newPassword.toString();

    // Check current password
    const isMatch = await bcrypt.compare(currentPasswordStr, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPasswordStr, salt);
    await admin.save();

    // Generate new token
    const token = admin.generateAuthToken();

    // Remove password from response
    admin.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      token,
      data: admin
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating password'
    });
  }
};
