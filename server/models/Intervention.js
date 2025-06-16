const mongoose = require('mongoose');
const { Schema } = mongoose;

const interventionSchema = new Schema({
  siteId: { type: String, required: true },
  description: { type: String, required: true },
  plannedDate: { type: Date, required: true }, // Date of intervention
  timeSlot: {
    start: { type: String }, // e.g. "09:00"
    end: { type: String }    // e.g. "11:00"
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },   
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
    required: false // Making it optional, adjust based on your requirements
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['planned', 'in-progress', 'completed'],
    default: 'planned'
  },
  resolutionNotes: { type: String },
  resolvedAt: { type: Date },
  validatedBy: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Intervention = mongoose.model('Intervention', interventionSchema);
module.exports = Intervention;