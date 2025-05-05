// controllers/MapController.js
const Site = require('../models/Site');

// Return all sites with name + coordinates
exports.getSitesForMap = async (req, res) => {
  try {
    const sites = await Site.find({}, {
      name: 1,
      location: 1,
      site_id: 1,
      status: 1,
      _id: 0,
    });

    res.json(sites);
  } catch (err) {
    console.error("Error fetching site map data:", err);
    res.status(500).json({ message: 'Server error' });
  }
};
