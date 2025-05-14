const mongoose = require('mongoose');
const Alert = require('../models/Alert');
const Site = require('../models/Site');

// Create a new alert
exports.createAlert = async (req, res) => {
  try {
    const { siteId, type, message } = req.body;

    // Validate siteId
    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return res.status(400).json({ message: 'Invalid site ID format' });
    }

    // Check if site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const alert = new Alert({
      siteId,
      type,
      message,
      status: 'active',
      createdAt: new Date(),
    });

    await alert.save();
    const populatedAlert = await Alert.findById(alert._id).populate('siteId', 'site_reference name location');
    res.status(201).json(populatedAlert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'Error creating alert', error: error.message });
  }
};

// Get all alerts
exports.getAllAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().lean();
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Error fetching alerts', error: error.message });
  }
};

// Get active alerts for a site
exports.getActiveAlertsBySite = async (req, res) => {
  try {
    const { siteId } = req.params;

    // Validate siteId
    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return res.status(400).json({ message: 'Invalid site ID format' });
    }

    // Check if site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const alerts = await Alert.find({ siteId, status: 'active' })
      .populate('siteId', 'site_reference name location')
      .lean();
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({ message: 'Error fetching active alerts', error: error.message });
  }
};

// Resolve an alert by its ID
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate alert ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid alert ID format' });
    }

    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (alert.status === 'resolved') {
      return res.status(400).json({ message: 'Alert is already resolved' });
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    await alert.save();

    const populatedAlert = await Alert.findById(id).populate('siteId', 'site_reference name location');
    res.status(200).json({ message: 'Alert resolved successfully', alert: populatedAlert });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ message: 'Error resolving alert', error: error.message });
  }
};

// Resolve alerts by type for a site
exports.resolveAlertByType = async (req, res) => {
  try {
    const { siteId, type } = req.body;

    // Validate inputs
    if (!siteId || !type) {
      return res.status(400).json({ message: 'siteId and type are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return res.status(400).json({ message: 'Invalid site ID format' });
    }

    // Check if site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const result = await Alert.updateMany(
      { siteId, type, status: 'active' },
      { status: 'resolved', resolvedAt: new Date() }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'No active alerts found for this type' });
    }

    res.status(200).json({ message: `${result.modifiedCount} alerts resolved successfully` });
  } catch (error) {
    console.error('Error resolving alerts by type:', error);
    res.status(500).json({ message: 'Error resolving alerts by type', error: error.message });
  }
};

// Fetch resolved alerts by siteId and optional date range
exports.getResolvedAlertsHistory = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate siteId
    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return res.status(400).json({ message: 'Invalid site ID format' });
    }

    // Check if site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const filter = { siteId, status: 'resolved' };

    // Add date range filter if provided
    if (startDate && endDate) {
      filter.resolvedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const alerts = await Alert.find(filter)
      .populate('siteId', 'site_reference name location')
      .sort({ resolvedAt: -1 })
      .lean();
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching resolved alerts history:', error);
    res.status(500).json({ message: 'Error fetching resolved alerts history', error: error.message });
  }
};

// Delete an alert by ID
exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate alert ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid alert ID format' });
    }

    const alert = await Alert.findByIdAndDelete(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.status(200).json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ message: 'Error deleting alert', error: error.message });
  }
};

// Get alert history for a site (active and resolved alerts)
exports.getAlertHistory = async (req, res) => {
  try {
    const { siteId } = req.params;

    // Validate siteId
    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return res.status(400).json({ message: 'Invalid site ID format' });
    }

    // Check if site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const alerts = await Alert.find({ siteId })
      .populate('siteId', 'site_reference name location')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({ message: 'Error fetching alert history', error: error.message });
  }
};

// Get resolved alerts for a site
exports.getResolvedAlerts = async (req, res) => {
  try {
    const { siteId } = req.params;

    // Validate siteId
    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return res.status(400).json({ message: 'Invalid site ID format' });
    }

    // Check if site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const alerts = await Alert.find({ siteId, status: 'resolved' })
      .populate('siteId', 'site_reference name location')
      .lean();
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching resolved alerts:', error);
    res.status(500).json({ message: 'Error fetching resolved alerts', error: error.message });
  }
};

// Get all resolved alerts
exports.getAllResolvedAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ status: 'resolved' })
      .populate('siteId', 'site_reference name location')
      .lean();
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching all resolved alerts:', error);
    res.status(500).json({ message: 'Error fetching resolved alerts', error: error.message });
  }
};

// Acknowledge an alert
exports.acknowledgeAlert = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate alert ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid alert ID format' });
    }

    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (alert.acknowledged) {
      return res.status(400).json({ message: 'Alert is already acknowledged' });
    }

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    await alert.save();

    const populatedAlert = await Alert.findById(id).populate('siteId', 'site_reference name location');
    res.status(200).json({ message: 'Alert acknowledged successfully', alert: populatedAlert });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ message: 'Error acknowledging alert', error: error.message });
  }
};