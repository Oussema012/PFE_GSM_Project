const express = require('express');
const router = express.Router();
const { checkAndCreateInterventionNotifications } = require('../notificationRules/checkInterventionNotifications');
const Notification = require('../models/Notification');
const Equipment = require('../models/Equipment');
const Maintenance = require('../models/Maintenance');
const Intervention = require('../models/Intervention');

// Check and Create Intervention Notifications
router.post('/check', async (req, res) => {
  try {
    const result = await checkAndCreateInterventionNotifications();
    console.log('Intervention notification check completed:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error running intervention notification check:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error running intervention notification check',
      error: error.message,
    });
  }
});

// Get All Notifications with Optional Filters
router.get('/', async (req, res) => {
  try {
    const { read, type, email, notificationCategory, page = 1, limit = 10 } = req.query;
    const filter = {};

    // Filter by read status
    if (read) {
      if (read !== 'true' && read !== 'false') {
        return res.status(400).json({
          message: 'Invalid value for "read" parameter. Use "true" or "false".',
        });
      }
      filter.read = read === 'true';
    }

    // Filter by notification type (e.g., intervention_upcoming, overdue)
    if (type) {
      filter.type = type;
    }

    // Filter by email
    if (email) {
      filter.emailTo = email;
    }

    // Filter by notification category (maintenance or intervention)
    if (notificationCategory) {
      if (notificationCategory === 'maintenance') {
        filter.maintenanceId = { $exists: true, $ne: null };
      } else if (notificationCategory === 'intervention') {
        filter.interventionId = { $exists: true, $ne: null };
      } else {
        return res.status(400).json({
          message: 'Invalid value for "notificationCategory". Use "maintenance" or "intervention".',
        });
      }
    }

    const notifications = await Notification.find(filter)
      .populate('equipmentId', 'name')
      .populate('maintenanceId', 'description performedBy status')
      .populate('interventionId', 'description plannedDate status technician')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalNotifications = await Notification.countDocuments(filter);

    console.log(`Fetched ${notifications.length} notifications for page ${page}, filter:`, filter);

    res.status(200).json({
      notifications,
      total: totalNotifications,
      page: parseInt(page),
      totalPages: Math.ceil(totalNotifications / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    res.status(500).json({
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
});

// Mark Notification as Read
router.put('/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Validate ObjectId
    if (!Notification.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    console.log(`Notification ${notificationId} marked as read`);

    res.status(200).json({
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error.message);
    res.status(500).json({
      message: 'Error marking notification as read',
      error: error.message,
    });
  }
});

// Delete Notification
router.delete('/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Validate ObjectId
    if (!Notification.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    console.log(`Notification ${notificationId} deleted`);

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error.message);
    res.status(500).json({
      message: 'Error deleting notification',
      error: error.message,
    });
  }
});

module.exports = router;