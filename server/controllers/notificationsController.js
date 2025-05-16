const Maintenance = require('../models/Maintenance');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const moment = require('moment-timezone');
require('dotenv').config();

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Send email notification
const sendEmailNotification = async (email, subject, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error.message);
    return false;
  }
};

// Check for upcoming and overdue maintenance notifications
const checkMaintenanceNotifications = async () => {
  try {
    const now = new Date();
    const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find maintenances within 3 days or overdue
    const maintenances = await Maintenance.find()
      .populate('equipmentId', 'name')
      .sort({ performedAt: 1 });

    for (const maintenance of maintenances) {
      // Validate required fields
      if (!maintenance.equipmentId || !maintenance.performedAt) {
        console.warn(`Skipping maintenance ID ${maintenance._id}: Missing equipmentId or performedAt`);
        continue;
      }
      if (!mongoose.Types.ObjectId.isValid(maintenance.equipmentId)) {
        console.warn(`Skipping maintenance ID ${maintenance._id}: Invalid equipmentId`);
        continue;
      }

      const performedAt = new Date(maintenance.performedAt);
      const timeDifference = performedAt - now;
      const equipmentName = maintenance.equipmentId?.name || 'Unknown Equipment';

      // Check for upcoming maintenance (within 3 days)
      if (timeDifference <= 3 * 24 * 60 * 60 * 1000 && timeDifference > 0) {
        const message = `Maintenance for ${equipmentName} (Technician: ${maintenance.performedBy}) is scheduled on ${moment(performedAt).tz('Europe/Paris').format('YYYY-MM-DD HH:mm')}.`;
        await createNotification(maintenance, 'upcoming', message);
      }

      // Check for overdue maintenance
      if (timeDifference < 0 && maintenance.status !== 'completed') {
        const message = `Maintenance for ${equipmentName} (Technician: ${maintenance.performedBy}) is overdue since ${moment(performedAt).tz('Europe/Paris').format('YYYY-MM-DD HH:mm')}.`;
        await createNotification(maintenance, 'overdue', message);
      }
    }
  } catch (err) {
    console.error('Error checking maintenance notifications:', err.message);
  }
};

// Helper function to create notification
const createNotification = async (maintenance, type, message) => {
  try {
    const existingNotification = await Notification.findOne({
      maintenanceId: maintenance._id,
      type,
    });

    if (existingNotification) {
      console.log(`Notification already exists for maintenance ${maintenance._id} (${type})`);
      return;
    }

    const notification = new Notification({
      maintenanceId: maintenance._id,
      equipmentId: maintenance.equipmentId,
      type,
      scheduledDate: maintenance.performedAt, // Use performedAt for precision
      sent: false,
      emailTo: process.env.TEST_EMAIL || process.env.EMAIL_USER,
      message,
      date: new Date(),
      read: false,
      readAt: null,
      createdAt: new Date(),
    });

    await notification.save();
    console.log(`Notification created: ${notification._id} (${type})`);

    const emailSent = await sendEmailNotification(
      notification.emailTo,
      `Maintenance Alert: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      message
    );

    if (emailSent) {
      notification.sent = true;
      await notification.save();
      console.log(`Email sent for notification ${notification._id}`);
    }
  } catch (error) {
    console.error(`Error creating notification for maintenance ${maintenance._id}:`, error.message);
  }
};

// Check and create notifications (for startup or manual trigger)
const checkAndCreateNotifications = async () => {
  try {
    console.log('Running startup maintenance notification check...');
    await checkMaintenanceNotifications();
  } catch (error) {
    console.error('Error in checkAndCreateNotifications:', error.message);
  }
};
// Get all notifications
const getNotifications = async (req, res) => {
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
    console.error('Error fetching notifications:', error.message);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
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
    console.error('Error marking notification as read:', error.message);
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error.message);
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
};

module.exports = {
  checkMaintenanceNotifications,
  checkAndCreateNotifications,
  
};