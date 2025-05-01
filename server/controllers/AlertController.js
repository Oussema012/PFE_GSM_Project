const Alert = require('../models/Alert'); // Assuming your Alert model is here

// Create a new alert
exports.createAlert = async (req, res) => {
  try {
    const { siteId, type, message } = req.body;
    const alert = new Alert({
      siteId,
      type,
      message,
      status: 'active',
      createdAt: new Date(),
    });
    await alert.save();
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error creating alert', error });
  }
};

// Get active alerts for a site
exports.getActiveAlertsBySite = async (req, res) => {
  try {
    const alerts = await Alert.find({ siteId: req.params.siteId, status: 'active' });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active alerts', error });
  }
};

// Resolve an alert by its ID
exports.resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    await alert.save();
    res.status(200).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error resolving alert', error });
  }
};

// Resolve alerts by type for a site
exports.resolveAlertByType = async (req, res) => {
  try {
    const { siteId, type } = req.body;
    const alerts = await Alert.find({ siteId, type, status: 'active' });
    if (alerts.length === 0) {
      return res.status(404).json({ message: 'No active alerts found for this type' });
    }
    
    for (let alert of alerts) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      await alert.save();
    }
    
    res.status(200).json({ message: 'Alerts resolved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resolving alerts by type', error });
  }
};
// controllers/AlertController.js

// Fetch resolved alerts by siteId and optional date range
exports.getResolvedAlertsHistory = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { startDate, endDate } = req.query; // optional query parameters for date range
    
    // Build the filter for resolved alerts
    const filter = {
      siteId: siteId,
      status: 'resolved',
    };

    // If start and end date are provided, filter by resolvedAt date range
    if (startDate && endDate) {
      filter.resolvedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    // Fetch the resolved alerts from the database
    const alerts = await Alert.find(filter).sort({ resolvedAt: -1 });  // Sort by resolvedAt descending
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resolved alerts history', error });
  }
};



// Delete an alert by ID
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.status(200).json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting alert', error });
  }
};

// Get alert history for a site (active and resolved alerts)
exports.getAlertHistory = async (req, res) => {
  try {
    const alerts = await Alert.find({ siteId: req.params.siteId });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alert history', error });
  }
};

// Get resolved alerts for a site
exports.getResolvedAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ siteId: req.params.siteId, status: 'resolved' });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resolved alerts', error });
  }
};

// Get all resolved alerts
exports.getAllResolvedAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ status: 'resolved' });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resolved alerts', error });
  }
};
// controllers/AlertController.js
exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        acknowledged: true,
        acknowledgedAt: new Date()  // Set the current date and time
      },
      { new: true }  // Return the updated document
    );
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.json(alert);  // Return the updated alert
  } catch (error) {
    res.status(500).json({ message: 'Error acknowledging alert', error });
  }
};
