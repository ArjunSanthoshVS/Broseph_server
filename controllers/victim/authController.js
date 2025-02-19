const User = require('../../models/user');
const { generateOTP, generateToken, isOTPExpired, generateOTPExpiry } = require('../../utils/auth');

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

// Register user and send OTP
exports.register = async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Check if user already exists
    let user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Create new user
    user = new User({ name, phone });
    
    // Generate OTP
    const otp = 123456; // For demo purposes
    user.otp = {
      code: otp,
      expiresAt: generateOTPExpiry()
    };

    await user.save();

    // In a real application, you would send the OTP via SMS here
    res.status(201).json({
      message: 'Registration successful. Please verify your phone number.',
      otp // Remove in production
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Send OTP for login
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    // Generate new OTP
    const otp = 123456; // For demo purposes
    user.otp = {
      code: otp,
      expiresAt: generateOTPExpiry()
    };

    await user.save();

    res.json({
      message: 'OTP sent successfully',
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
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
}; 