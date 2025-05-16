const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  maintenanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintenance', required: true },
  equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  type: { type: String, default: 'maintenance' },
  scheduledDate: { type: Date, required: true },
  sent: { type: Boolean, default: false },
  emailTo: { type: String }, // Optional: recipient email
  message: { type: String },
    date: { type: Date, default: Date.now },  // or createdAt
   read: { type: Boolean, default: false },       // Add this
  readAt: { type: Date },                         // Add this
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);