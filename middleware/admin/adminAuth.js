const { verifyToken } = require('../../utils/auth');
const Admin = require('../../models/admin');

// Protect routes middleware
const adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    if (decoded.adminId) {
      // Get admin from token
      const admin = await Admin.findById(decoded.adminId);

      if (!admin) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.admin = admin;
    } else {
      return res.status(401).json({ error: 'Token payload missing required info' });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = adminAuth;
