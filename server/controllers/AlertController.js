const Alert = require('../models/Alert');

// ✅ Create a new alert (only if not already active)
exports.createAlert = async (req, res) => {
  const { siteId, type, message } = req.body;

  try {
    // Check if the same active alert already exists
    const existing = await Alert.findOne({ siteId, type, status: 'active' });
    if (existing) {
      return res.status(409).json({ message: 'Alert already active.' });
    }

    // Create and save the new alert
    const newAlert = new Alert({ siteId, type, message });
    await newAlert.save();
    res.status(201).json(newAlert);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ✅ Get all active alerts for a given site
exports.getActiveAlertsBySite = async (req, res) => {
  const { siteId } = req.params;

  try {
    const alerts = await Alert.find({ siteId, status: 'active' }).sort({ timestamp: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ✅ Resolve a specific alert by its ID
exports.resolveAlert = async (req, res) => {
  const { id } = req.params;

  try {
    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Check if the alert is already resolved
    if (alert.status === 'resolved') {
      return res.status(400).json({ message: 'Alert is already resolved' });
    }

    // Mark the alert as resolved
    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    await alert.save();

    res.json({ message: 'Alert resolved successfully', alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ✅ Delete an alert by ID
exports.deleteAlert = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Alert.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({ message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ✅ Get all alerts (resolved & active) for a site
exports.getAlertHistory = async (req, res) => {
  const { siteId } = req.params;

  try {
    const alerts = await Alert.find({ siteId }).sort({ timestamp: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
// ✅ Get resolved alerts for a specific site
exports.getResolvedAlerts = async (req, res) => {
    const { siteId } = req.params;
  
    try {
      const alerts = await Alert.find({ siteId, status: 'resolved' }).sort({ resolvedAt: -1 });
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };
  
// ✅ Get all resolved alerts
exports.getAllResolvedAlerts = async (req, res) => {
    try {
      const resolvedAlerts = await Alert.find({ status: 'resolved' }).sort({ resolvedAt: -1 });
      res.json(resolvedAlerts);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };
  