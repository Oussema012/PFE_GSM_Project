// controllers/adminController.js
const User = require('../models/User');
const Site = require('../models/Site');

exports.assignTechnicianToSites = async (req, res) => {
  try {
    const { technicianId, siteIds } = req.body;

    // Validate input
    if (!technicianId || !Array.isArray(siteIds)) {
      return res.status(400).json({ message: 'technicianId and siteIds are required' });
    }

    // Check technician exists and is of correct role
    const technician = await User.findById(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({ message: 'Technician not found or invalid role' });
    }

    // Optionally: check if all site IDs exist
    const validSites = await Site.find({ _id: { $in: siteIds } });
    if (validSites.length !== siteIds.length) {
      return res.status(404).json({ message: 'One or more site IDs are invalid' });
    }

    // Assign the sites
    technician.assignedSites = siteIds;
    await technician.save();

    res.json({ message: 'Sites assigned successfully', technician });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning sites', error });
  }
};
