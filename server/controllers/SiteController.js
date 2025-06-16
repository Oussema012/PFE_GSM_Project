const mongoose = require('mongoose');
const Site = require('../models/Site');
const User = require('../models/User');
const Alert = require('../models/Alert'); // Assumed to exist

// Mock equipment data (replace with actual Equipment model if available)
const fetchEquipment = async (siteId) => {
  // This is a placeholder. Implement your actual equipment fetch logic.
  const equipment = [
    { _id: new mongoose.Types.ObjectId(), name: 'Antenna A', type: 'Antenna', status: 'operational' },
    { _id: new mongoose.Types.ObjectId(), name: 'Generator B', type: 'Generator', status: 'operational' },
    { _id: new mongoose.Types.ObjectId(), name: 'Router C', type: 'Router', status: 'maintenance' },
  ];
  return Array.from(new Map(equipment.map((eq) => [eq._id, eq])).values());
};

// Controller to fetch all sites
exports.getSites = async (req, res) => {
  try {
    const sites = await Site.find().lean();
    const enrichedSites = sites.map((site) => ({
      ...site,
      site_reference: site.site_reference || `SITE_${site._id.toString().slice(-4)}`,
      address: site.address || 'Unknown Address',
      technology: Array.isArray(site.technology) ? site.technology : [],
      power_status: site.power_status || 'unknown',
      battery_level: Number.isFinite(site.battery_level) ? site.battery_level : 0,
    }));
    res.status(200).json(enrichedSites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ message: 'Error fetching sites', error: error.message });
  }
};

// Controller to fetch a specific site by ID
exports.getSiteById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid site ID format' });
    }
    const site = await Site.findById(id).lean();
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    res.status(200).json({
      ...site,
      address: site.address || 'Unknown Address',
      technology: Array.isArray(site.technology) ? site.technology : [],
      power_status: site.power_status || 'unknown',
      battery_level: Number.isFinite(site.battery_level) ? site.battery_level : 0,
    });
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({ message: 'Error fetching site', error: error.message });
  }
};

// Controller to create a new site
exports.createSite = async (req, res) => {
  try {
    const {
      site_reference,
      name,
      status,
      location,
      address,
      region,
      technology,
      site_type,
      power_status,
      battery_level,
      temperature,
      last_updated,
      alarms,
      controller_id,
      vendor,
      ac_status,
    } = req.body;

    // Validate required fields
    if (!site_reference || !name || !status || !address || !region) {
      return res.status(400).json({ message: 'site_reference, name, status, address, and region are required' });
    }

    // Check if site_reference is unique
    const existingSite = await Site.findOne({ site_reference });
    if (existingSite) {
      return res.status(400).json({ message: 'Site with this site_reference already exists' });
    }

    const newSite = new Site({
      site_id: new mongoose.Types.ObjectId().toString(),
      site_reference,
      name,
      status,
      location: location || { lat: 0, lon: 0 },
      address,
      region,
      technology: technology || [],
      site_type: site_type || '',
      power_status: power_status || 'unknown',
      battery_level: Number.isFinite(battery_level) ? battery_level : 0,
      temperature: temperature || 0,
      last_updated: last_updated || Date.now(),
      alarms: alarms || [],
      controller_id: controller_id || '',
      vendor: vendor || '',
      ac_status: ac_status || '',
    });

    await newSite.save();
    res.status(201).json(newSite);
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ message: 'Error creating site', error: error.message });
  }
};

// Controller to update a specific site
exports.updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid site ID format' });
    }

    if (req.body.site_reference) {
      const existingSite = await Site.findOne({ site_reference: req.body.site_reference });
      if (existingSite && existingSite._id.toString() !== id) {
        return res.status(400).json({ message: 'Site with this site_reference already exists' });
      }
    }

    const updatedSite = await Site.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedSite) {
      return res.status(404).json({ message: 'Site not found' });
    }

    res.status(200).json(updatedSite);
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ message: 'Error updating site', error: error.message });
  }
};

// Controller to update site status
exports.updateSiteStatus = async (req, res) => {
  try {
    const { site_reference, status } = req.body;
    if (!site_reference || !status) {
      return res.status(400).json({ message: 'site_reference and status are required' });
    }

    const updatedSite = await Site.findOneAndUpdate(
      { site_reference },
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedSite) {
      return res.status(404).json({ message: 'Site not found' });
    }

    res.status(200).json(updatedSite);
  } catch (error) {
    console.error('Error updating site status:', error);
    res.status(500).json({ message: 'Error updating site status', error: error.message });
  }
};

// Controller to search/filter sites
exports.searchSites = async (req, res) => {
  try {
    const { name, status } = req.query;
    const searchQuery = {};
    if (name) searchQuery.name = { $regex: name, $options: 'i' };
    if (status) searchQuery.status = status;

    const sites = await Site.find(searchQuery).lean();
    res.status(200).json(sites);
  } catch (error) {
    console.error('Error searching sites:', error);
    res.status(500).json({ message: 'Error searching sites', error: error.message });
  }
};

// Controller to delete a site by ID
exports.deleteSite = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid site ID format' });
    }

    const alerts = await Alert.find({ siteId: id });
    if (alerts.length > 0) {
      return res.status(400).json({ message: 'Cannot delete site with associated alerts' });
    }

    const site = await Site.findByIdAndDelete(id);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    res.status(200).json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({ message: 'Error deleting site', error: error.message });
  }
};

// Controller to assign sites to a technician
exports.assignTechnicianToSites = async (req, res) => {
  try {
    const { technicianId, siteIds } = req.body;
    if (!technicianId || !siteIds || !Array.isArray(siteIds)) {
      return res.status(400).json({ message: 'technicianId and an array of siteIds are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(technicianId)) {
      return res.status(400).json({ message: 'Invalid technician ID format' });
    }

    for (const siteId of siteIds) {
      if (!mongoose.Types.ObjectId.isValid(siteId)) {
        return res.status(400).json({ message: `Invalid site ID format: ${siteId}` });
      }
    }

    const technician = await User.findById(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({ message: 'Technician not found or invalid role' });
    }

    const sites = await Site.find({ _id: { $in: siteIds } });
    if (sites.length !== siteIds.length) {
      return res.status(404).json({ message: 'One or more sites not found' });
    }

    technician.assignedSites = [...new Set([...technician.assignedSites, ...siteIds])];
    await technician.save();

    res.status(200).json({ message: 'Technician assigned to sites successfully', technician });
  } catch (error) {
    console.error('Error assigning technician to sites:', error);
    res.status(500).json({ message: 'Error assigning technician to sites', error: error.message });
  }
};

// Controller to unassign sites to a technician
exports.unassignTechnicianFromSites = async (req, res) => {
  try {
    const { technicianId, siteIds } = req.body;
    if (!technicianId || !siteIds || !Array.isArray(siteIds)) {
      return res.status(400).json({ message: 'technicianId and an array of siteIds are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(technicianId)) {
      return res.status(400).json({ message: 'Invalid technician ID format' });
    }

    for (const siteId of siteIds) {
      if (!mongoose.Types.ObjectId.isValid(siteId)) {
        return res.status(400).json({ message: `Invalid site ID format: ${siteId}` });
      }
    }

    const technician = await User.findById(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({ message: 'Technician not found or invalid role' });
    }

    const sites = await Site.find({ _id: { $in: siteIds } });
    if (sites.length !== siteIds.length) {
      return res.status(404).json({ message: 'One or more sites not found' });
    }

    technician.assignedSites = technician.assignedSites.filter(
      siteId => !siteIds.includes(siteId.toString())
    );
    await technician.save();

    res.status(200).json({ message: 'Technician unassigned from sites successfully', technician });
  } catch (error) {
    console.error('Error unassigning technician from sites:', error);
    res.status(500).json({ message: 'Error unassigning technician from sites', error: error.message });
  }
};

// Controller to fetch site references
exports.getSiteReferences = async (req, res) => {
  try {
    const sites = await Site.find({}, '_id site_reference').lean();
    res.status(200).json(sites);
  } catch (error) {
    console.error('Error fetching site references:', error);
    res.status(500).json({ message: 'Error fetching site references', error: error.message });
  }
};

// Mock equipment endpoint (replace with actual implementation)
exports.getEquipmentBySiteId = async (req, res) => {
  try {
    const { siteId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return res.status(400).json({ message: 'Invalid site ID format' });
    }
    const equipment = await fetchEquipment(siteId);
    res.status(200).json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'Error fetching equipment', error: error.message });
  }
};