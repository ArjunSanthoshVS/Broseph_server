// Validation middleware
const validatePhone = (req, res, next) => {
  const { phone } = req.body;
  if (!phone || !/^[0-9]{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }
  next();
};

const validateOtp = (req, res, next) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }
  if (!/^[0-9]{6}$/.test(otp)) {
    return res.status(400).json({ error: 'Invalid OTP format' });
  }
  next();
};

module.exports = {
  validatePhone,
  validateOtp
}; 