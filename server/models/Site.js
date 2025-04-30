const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  site_id: {
    type: String,
    required: true,
    unique: true, // Ensure site_id is unique for each site
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const Site = mongoose.model('Site', siteSchema);

module.exports = Site;
