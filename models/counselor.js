const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const counselorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  role: {
    type: String,
    enum: ['counselor', 'senior-counselor', 'supervisor', 'trainee'],
    default: 'trainee'
  },
  department: {
    type: String,
    enum: ['crisis-support', 'legal-support', 'mental-health', 'social-services'],
    required: [true, 'Department is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'training', 'suspended'],
    default: 'training'
  },
  accessLevel: {
    type: String,
    enum: ['full', 'limited', 'training'],
    default: 'training'
  },
  trainingStatus: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  trainingProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  activityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  casesHandled: {
    type: Number,
    default: 0
  },
  certifications: [{
    type: String
  }],
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
counselorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
counselorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Counselor = mongoose.model('Counselor', counselorSchema);

module.exports = Counselor; 