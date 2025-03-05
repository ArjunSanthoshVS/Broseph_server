const User = require('../../models/user');
const { generateOTP, generateToken, isOTPExpired, generateOTPExpiry } = require('../../utils/auth');
const ChatRoom = require('../../models/chatRoom');

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
};

// Send OTP (handles both registration and login)
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Find or create user
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      // Create new user if not found
      user = new User({ phone });
      isNewUser = true;
    }

    // Generate new OTP
    const otp = 123456; // For demo purposes
    user.otp = {
      code: otp,
      expiresAt: generateOTPExpiry()
    };

    await user.save();

    // In a real application, you would send the OTP via SMS here
    res.json({
      message: isNewUser ? 'New user created. Please verify your phone number.' : 'OTP sent successfully',
      isNewUser,
      otp // Remove in production
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.otp || !user.otp.code || isOTPExpired(user.otp.expiresAt)) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Clear OTP and mark user as verified
    user.otp = undefined;
    user.isVerified = true;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
}; 