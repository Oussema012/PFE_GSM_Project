// models/Site.js
const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  site_id: String,
  name: String,
  status: String,
  location: {
    lat: Number,
    lon: Number,
    address: String,
    region: String,
  },
  technology: [String],
  site_type: String,
  power_status: String,
  battery_level: Number,
  temperature: Number,
  last_updated: Date,
  alarms: Array,
  controller_id: String,
  vendor: String,
  ac_status: String
});

module.exports = mongoose.model('Site', siteSchema);
