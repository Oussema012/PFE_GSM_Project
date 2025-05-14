const mongoose = require('mongoose');
const { Schema } = mongoose;

const alertSchema = new Schema({
  siteId: { 
    type: String,   // ← Now accepting string IDs like "SITE001"
    required: true 
  },
  type: { type: String, required: true },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'resolved'],
    default: 'active' 
  },
  resolvedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  acknowledged: { type: Boolean, default: false },
  acknowledgedAt: { type: Date, default: null },
});

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;
