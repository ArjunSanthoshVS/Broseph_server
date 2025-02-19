// Validation middleware
const validateRegistration = (req, res, next) => {
  const { name, phone } = req.body;
  
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters long' });
  }
  
  if (!phone || !/^[0-9]{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }
  
  next();
};

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
  validateRegistration,
  validatePhone,
  validateOtp
}; 