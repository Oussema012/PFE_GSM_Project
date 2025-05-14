const express = require('express');
const Notification = require('../models/Notification');
const router = express.Router();
const { checkAndCreateNotifications } = require('../controllers/notificationsController');

// ========== Check Maintenance and Create Notifications ==========
// Trigger notification creation based on maintenance checks
router.get('/check-maintenance', async (req, res) => {
  try {
    await checkAndCreateNotifications();
    res.status(200).json({ message: 'Checked and created notifications successfully' });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: 'Error running maintenance check', error: error.message });
  }
});

// ========== Get All Notifications ==========
// Fetch all notifications with optional filters for read/unread and type, with pagination
router.get('/notifications', async (req, res) => {
  try {
    const { read, type, email, page = 1, limit = 10 } = req.query; // Pagination with default values

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
      filter.email = email;
    }

    const notifications = await Notification.find(filter)
      .skip((page - 1) * limit) // Pagination
      .limit(parseInt(limit));

    const totalNotifications = await Notification.countDocuments(filter); // Get the total count for pagination info

    res.status(200).json({
      notifications,
      total: totalNotifications,
      page: parseInt(page),
      totalPages: Math.ceil(totalNotifications / limit),
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// ========== Mark Notification as Read ==========
// Update the notification's read status
router.put('/notifications/:id/read', async (req, res) => {
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
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
});

// ========== Delete Notification ==========
// Delete a specific notification by ID
router.delete('/notifications/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
});

module.exports = router;
