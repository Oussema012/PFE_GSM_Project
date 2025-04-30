const Site = require('../models/Site');

// Controller to fetch all sites
const getSites = async (req, res) => {
  try {
    const sites = await Site.find(); // Retrieve all sites
    res.status(200).json(sites);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sites', error: err });
  }
};

// Controller to fetch a specific site by ID
const getSiteById = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id); // Retrieve site by ID
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
    const { site_id, name, status } = req.body;

    if (!site_id || !name || !status) {
      return res.status(400).json({ message: 'site_id, name, and status are required' });
    }

    const newSite = new Site({ site_id, name, status });
    await newSite.save();
    res.status(201).json(newSite);
  } catch (err) {
    res.status(500).json({ message: 'Error creating site', error: err });
  }
};

// Controller to update a specific site
const updateSite = async (req, res) => {
  try {
    const { name, status } = req.body;

    // Validation for the incoming data
    if (!name && !status) {
      return res.status(400).json({ message: 'Name or status required for update' });
    }

    const updatedSite = await Site.findByIdAndUpdate(
      req.params.id, // The site ID to be updated
      req.body, // The updated fields
      { new: true, runValidators: true } // Return the updated site and validate input
    );

    if (!updatedSite) {
      return res.status(404).json({ message: 'Site not found' });
    }

    res.status(200).json(updatedSite);
  } catch (err) {
    console.error('Error updating site:', err);  // Log the error to the console
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
      { site_id }, // Search by site_id field
      { status },   // Update the status field
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

// Controller for searching/filtering sites (by name or status)
const searchSites = async (req, res) => {
  try {
    const { name, status } = req.query; // Retrieve query parameters
    const searchQuery = {};

    if (name) {
      searchQuery.name = { $regex: name, $options: 'i' }; // Case-insensitive search
    }

    if (status) {
      searchQuery.status = status;
    }

    const sites = await Site.find(searchQuery); // Fetch filtered sites
    res.status(200).json(sites);
  } catch (err) {
    res.status(500).json({ message: 'Error searching sites', error: err });
  }
};

// Function to delete a site by its ID
const deleteSite = async (req, res) => {
  const siteId = req.params.id;

  try {
    const result = await Site.findByIdAndDelete(siteId); // Delete the site by ID

    if (!result) {
      return res.status(404).json({ message: 'Site not found' });
    }

    res.status(200).json({ message: 'Site deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting site', error: err });
  }
};

module.exports = {
  getSites,
  getSiteById,
  createSite,
  updateSite,
  updateSiteStatus,
  searchSites,
  deleteSite, // Export the delete function
};
