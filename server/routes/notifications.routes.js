const express = require('express');
const Notification = require('../models/Notification');
const router = express.Router();
const { checkAndCreateNotifications } = require('../notificationRules/checkMaintenanceNotifications');

// Check and Create Notifications
router.post('/check', async (req, res) => {
  try {
    await checkAndCreateNotifications();
    res.status(200).json({ message: 'Checked and created notifications successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error running notification check', error: error.message });
  }
});

// Get All Notifications
router.get('/', async (req, res) => {
  try {
    const { read, type, email, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (read) {
      if (read !== 'true' && read !== 'false') {
        return res.status(400).json({ message: 'Invalid value for "read" parameter. Use "true" or "false".' });
      }
      filter.read = read === 'true';
    }

    if (type) {
      filter.type = type;
    }

    if (email) {
      filter.emailTo = email;
    }

    const notifications = await Notification.find(filter)
      .populate('equipmentId', 'name')
      .populate('maintenanceId', 'description performedBy status')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalNotifications = await Notification.countDocuments(filter);

    res.status(200).json({
      notifications,
      total: totalNotifications,
      page: parseInt(page),
      totalPages: Math.ceil(totalNotifications / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// Mark Notification as Read
router.put('/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
});

// Delete Notification
router.delete('/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
});

module.exports = router;