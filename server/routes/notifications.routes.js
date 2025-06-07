const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Notification = require('../models/Notification');
const Equipment = require('../models/Equipment');
const Maintenance = require('../models/Maintenance');
const Intervention = require('../models/Intervention');

// GET /api/notifications
// Get notifications with optional filters and pagination
router.get('/', async (req, res) => {
  try {
    const { read, type, email, notificationCategory, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (read) {
      if (read !== 'true' && read !== 'false') {
        return res.status(400).json({ message: 'Invalid value for "read". Use "true" or "false".' });
      }
      filter.read = read === 'true';
    }

    if (type) {
      if (!['maintenance_upcoming', 'maintenance_overdue', 'intervention_upcoming', 'intervention_missed'].includes(type)) {
        return res.status(400).json({ message: 'Invalid notification type.' });
      }
      filter.type = type;
    }

    if (email) {
      filter.emailTo = email;
    }

    if (notificationCategory) {
      if (notificationCategory === 'maintenance') {
        filter.maintenanceId = { $exists: true, $ne: null };
      } else if (notificationCategory === 'interventions' || notificationCategory === 'intervention') {
        filter.interventionId = { $exists: true, $ne: null };
      } else {
        return res.status(400).json({
          message: 'Invalid notificationCategory. Use "maintenance" or "interventions".',
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

    console.log(`Fetched ${notifications.length} notifications (page: ${page}, category: ${notificationCategory || 'all'})`);

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

// GET /api/notifications/interventions
// Get intervention notifications only
router.get('/interventions', async (req, res) => {
  try {
    const { read, type, email, page = 1, limit = 10 } = req.query;
    const filter = {
      interventionId: { $exists: true, $ne: null },
    };

    if (read) {
      if (read !== 'true' && read !== 'false') {
        return res.status(400).json({ message: 'Invalid value for "read". Use "true" or "false".' });
      }
      filter.read = read === 'true';
    }

    if (type) {
      if (!['intervention_upcoming', 'intervention_missed'].includes(type)) {
        return res.status(400).json({ message: 'Invalid type. Use "intervention_upcoming" or "intervention_missed".' });
      }
      filter.type = type;
    }

    if (email) {
      filter.emailTo = email;
    }

    const notifications = await Notification.find(filter)
      .populate('interventionId', 'description plannedDate status technician')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalNotifications = await Notification.countDocuments(filter);

    console.log(`Fetched ${notifications.length} intervention notifications (page: ${page})`);

    res.status(200).json({
      notifications,
      total: totalNotifications,
      page: parseInt(page),
      totalPages: Math.ceil(totalNotifications / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error fetching intervention notifications:', error.message);
    res.status(500).json({
      message: 'Error fetching intervention notifications',
      error: error.message,
    });
  }
});

// GET /api/notifications/maintenance
// Get maintenance notifications only
router.get('/maintenance', async (req, res) => {
  try {
    const { read, type, email, page = 1, limit = 10 } = req.query;
    const filter = {
      maintenanceId: { $exists: true, $ne: null },
    };

    if (read) {
      if (read !== 'true' && read !== 'false') {
        return res.status(400).json({ message: 'Invalid value for "read". Use "true" or "false".' });
      }
      filter.read = read === 'true';
    }

    if (type) {
      if (!['maintenance_upcoming', 'maintenance_overdue'].includes(type)) {
        return res.status(400).json({ message: 'Invalid type. Use "maintenance_upcoming" or "maintenance_overdue".' });
      }
      filter.type = type;
    }

    if (email) {
      filter.emailTo = email;
    }

    const notifications = await Notification.find(filter)
      .populate('equipmentId', 'name')
      .populate('maintenanceId', 'description performedBy status')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalNotifications = await Notification.countDocuments(filter);

    console.log(`Fetched ${notifications.length} maintenance notifications (page: ${page})`);

    res.status(200).json({
      notifications,
      total: totalNotifications,
      page: parseInt(page),
      totalPages: Math.ceil(totalNotifications / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error fetching maintenance notifications:', error.message);
    res.status(500).json({
      message: 'Error fetching maintenance notifications',
      error: error.message,
    });
  }
});

// GET /api/notifications/all
// Get all notifications without filters or pagination
router.get('/all', async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('equipmentId', 'name')
      .populate('maintenanceId', 'description performedBy status')
      .populate('interventionId', 'description plannedDate status technician');

    console.log(`Fetched ${notifications.length} total notifications`);

    res.status(200).json({
      notifications,
      total: notifications.length,
    });
  } catch (error) {
    console.error('Error fetching all notifications:', error.message);
    res.status(500).json({
      message: 'Error fetching all notifications',
      error: error.message,
    });
  }
});

// PUT /api/notifications/:id/read
// Mark a notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
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

// DELETE /api/notifications/:id
// Delete a notification by ID
router.delete('/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
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