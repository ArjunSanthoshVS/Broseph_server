const mongoose = require('mongoose');
const { Schema } = mongoose;

const reportSchema = new Schema({
  category: { type: String, required: true },
  details: { type: String, required: true },
  isUrgent: { type: Boolean, default: false },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  contactInfo: {
    name: { type: String },
    mobile: { type: String },
    age: { type: String }
  },
  locationAudioPath: { type: String },
  reporter: { type: String, default: 'anonymous' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  anonymousId: { type: String },
  reportCode: { type: String },
  chatRoomId: { type: String },
  status: {
    type: String,
    enum: ['submitted', 'open', 'in-progress', 'pending', 'resolved', 'closed'],
    default: 'submitted'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'Counselor'
  },
  notes: [{
    content: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Counselor'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  actions: [{
    type: String,
    takenBy: {
      type: Schema.Types.ObjectId,
      ref: 'Counselor'
    },
    takenAt: {
      type: Date,
      default: Date.now
    }
  }],
  nextFollowUp: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  escalatedTo: {
    type: Schema.Types.ObjectId,
    ref: 'Counselor'
  },
  escalationReason: String,
  resolution: {
    summary: String,
    date: Date,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Counselor'
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Update lastUpdated timestamp before saving
reportSchema.pre('save', function (next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Report', reportSchema); 