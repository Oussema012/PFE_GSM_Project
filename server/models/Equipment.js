const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  siteId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'Unnamed Equipment' // Ensure name is always set
  },
  type: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['operational', 'faulty', 'maintenance']
  }
}, { timestamps: true });

module.exports = mongoose.model('Equipment', EquipmentSchema);