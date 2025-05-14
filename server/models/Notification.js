const mongoose = require('mongoose');

// Notification Schema
const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  date: { type: Date, required: true },
  type: { 
    type: String, 
    enum: ['maintenance', 'alert', 'intervention'], 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  email: { 
    type: String, 
    required: true 
  },
  maintenanceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Maintenance', 
    required: false  // Optional if not applicable to all notifications
  },
  readAt: { 
    type: Date, 
    required: false  // Optional field for tracking when the notification was read
  },
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt fields
});

// Automatically set 'readAt' when 'read' is true
notificationSchema.pre('save', function (next) {
  if (this.isModified('read') && this.read) {
    this.readAt = new Date();
  }
  next();
});

// Indexing for faster queries
notificationSchema.index({ email: 1, type: 1 }); // Index by email and type
notificationSchema.index({ maintenanceId: 1 }); // Index by maintenanceId

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
