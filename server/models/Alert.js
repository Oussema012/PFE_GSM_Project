// models/Alert.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the schema for alerts
const alertSchema = new Schema({
  siteId: { type: String, required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'resolved'],  // 'active' or 'resolved' status
    default: 'active' 
  },
  resolvedAt: { type: Date, default: null },  // Only set this when resolving
  createdAt: { type: Date, default: Date.now }  // Timestamp when the alert was created
});


const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
