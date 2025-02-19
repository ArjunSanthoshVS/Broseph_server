const { verifyToken } = require('../../utils/auth');
const User = require('../../models/user');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log(token, 'token');

    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    if (token === 'Anonymous') {
      return next();
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    if (decoded.userId) {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      req.user = user;
    } else if (decoded.anonymousId) {
      // Token is for an anonymous report
      req.anonymous = { anonymousId: decoded.anonymousId };
    } else {
      return res.status(401).json({ error: 'Token payload missing required info' });
    }
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = auth; 