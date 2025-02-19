const mongoose = require('mongoose');
const { Schema } = mongoose;

const reportSchema = new Schema({
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  isUrgent: { type: Boolean, default: false },
  locationType: { type: String },
  location: { type: String },
  hasWitnesses: { type: Boolean, default: false },
  witnessDetails: { type: String },
  hasEvidence: { type: Boolean, default: false },
  evidenceFiles: { type: [String], default: [] },
  contactName: { type: String },
  contactPhone: { type: String },
  reporter: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  anonymousId: { type: String },
  reportCode: { type: String },
  status: { type: String, default: 'submitted' },
  priority: { type: String, default: 'medium' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema); 