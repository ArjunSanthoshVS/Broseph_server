const jwt = require('jsonwebtoken');

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Check if OTP is expired
const isOTPExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

// Generate OTP expiry time (5 minutes from now)
const generateOTPExpiry = () => {
  return new Date(Date.now() + 5 * 60 * 1000);
};

module.exports = {
  generateOTP,
  generateToken,
  verifyToken,
  isOTPExpired,
  generateOTPExpiry
}; 