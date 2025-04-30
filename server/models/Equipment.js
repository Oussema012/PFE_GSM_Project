const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  siteId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'maintenance']
  }
}, { timestamps: true });

module.exports = mongoose.model('Equipment', EquipmentSchema);
