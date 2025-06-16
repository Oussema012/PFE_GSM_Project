const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  interventionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intervention' },
  maintenanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintenance' },
  equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' },
  siteId: { type: String },
  type: { 
    type: String, 
    enum: ['maintenance_upcoming', 'maintenance_overdue', 'intervention_upcoming', 'intervention_missed'], 
    required: true 
  },
  scheduledDate: { type: Date, required: true },
  sent: { type: Boolean, default: false },
  emailTo: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);