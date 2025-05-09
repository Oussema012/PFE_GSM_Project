const Site = require('../models/Site');
const User = require('../models/User');

// Controller to fetch all sites
const getSites = async (req, res) => {
  try {
    const sites = await Site.find();
    res.status(200).json(sites);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sites', error: err });
  }
};

// Controller to fetch a specific site by ID
const getSiteById = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    res.status(200).json(site);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching site', error: err });
  }
};

// Controller to create a new site
const createSite = async (req, res) => {
  try {
    const {
      site_id,
      name,
      status,
      location,
      technology,
      site_type,
      power_status,
      battery_level,
      temperature,
      last_updated,
      alarms,
      controller_id,
      vendor,
      ac_status
    } = req.body;

    if (!site_id || !name || !status) {
      return res.status(400).json({ message: 'site_id, name, and status are required' });
    }

    const newSite = new Site({
      site_id,
      name,
      status,
      location,
      technology,
      site_type,
      power_status,
      battery_level,
      temperature,
      last_updated,
      alarms,
      controller_id,
      vendor,
      ac_status
    });

    await newSite.save();
    res.status(201).json(newSite);
  } catch (err) {
    res.status(500).json({ message: 'Error creating site', error: err });
  }
};


// Controller to update a specific site
const updateSite = async (req, res) => {
  try {
    const updatedSite = await Site.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedSite) {
      return res.status(404).json({ message: 'Site not found' });
    }

    res.status(200).json(updatedSite);
  } catch (err) {
    res.status(500).json({ message: 'Error updating site', error: err.message || err });
  }
};


// Controller to update site status
const updateSiteStatus = async (req, res) => {
  try {
    const { site_id, status } = req.body;

    if (!site_id || !status) {
      return res.status(400).json({ message: 'site_id and status are required' });
    }

    const updatedSite = await Site.findOneAndUpdate(
      { site_id },
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedSite) {
      return res.status(404).json({ message: 'Site not found' });
    }

    res.status(200).json(updatedSite);
  } catch (err) {
    res.status(500).json({ message: 'Error updating site status', error: err });
  }
};

// Controller to search/filter sites by name or status
const searchSites = async (req, res) => {
  try {
    const { name, status } = req.query;
    const searchQuery = {};

    if (name) {
      searchQuery.name = { $regex: name, $options: 'i' };
    }

    if (status) {
      searchQuery.status = status;
    }

    const sites = await Site.find(searchQuery);
    res.status(200).json(sites);
  } catch (err) {
    res.status(500).json({ message: 'Error searching sites', error: err });
  }
};

// Controller to delete a site by ID
const deleteSite = async (req, res) => {
  try {
    const result = await Site.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ message: 'Site not found' });
    }

    res.status(200).json({ message: 'Site deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting site', error: err });
  }
};

// Controller to assign sites to a technician
const assignTechnicianToSites = async (req, res) => {
  const { technicianId, siteIds } = req.body;

  if (!technicianId || !siteIds || !Array.isArray(siteIds)) {
    return res.status(400).json({ message: 'Technician ID and an array of site IDs are required' });
  }

  try {
    const technician = await User.findById(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({ message: 'Technician not found' });
    }

    technician.assignedSites = [...new Set([...technician.assignedSites, ...siteIds])];
    await technician.save();

    res.status(200).json({ message: 'Technician assigned to sites successfully', technician });
  } catch (err) {
    res.status(500).json({ message: 'Error assigning technician to sites', error: err });
  }
};

// Export all controllers
module.exports = {
  getSites,
  getSiteById,
  createSite,
  updateSite,
  updateSiteStatus,
  searchSites,
  deleteSite,
  assignTechnicianToSites
};
