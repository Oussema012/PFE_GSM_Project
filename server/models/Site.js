const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  site_id: { type: String, required: true, unique: true },
  site_reference: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'maintenance', 'offline'],
    default: 'active',
  },
  location: {
    lat: { type: Number, default: 0 },
    lon: { type: Number, default: 0 },
  },
  address: { type: String, required: true, default: '' },
  region: { type: String, required: true, default: '' },
  technology: { type: [String], default: [] },
  site_type: { type: String, default: '' },
  power_status: { type: String, default: 'unknown' },
  battery_level: { type: Number, default: 0 },
  temperature: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now },
  alarms: { type: [String], default: [] },
  controller_id: { type: String, default: '' },
  vendor: { type: String, default: '' },
  ac_status: { type: String, default: '' },
  reference: { type: String },
  created_at: { type: Date, default: Date.now },
  equipment_status: { type: String, default: 'unknown' },
  humidity: { type: Number, default: 0 },
  last_temperature: { type: Number, default: 0 },
  signal_strength: { type: Number, default: 0 },
  voltage_level: { type: Number, default: 0 },
  ac_on_timestamp: { type: Number, default: 0 },
}, { strict: true });

module.exports = mongoose.model('Site', siteSchema);