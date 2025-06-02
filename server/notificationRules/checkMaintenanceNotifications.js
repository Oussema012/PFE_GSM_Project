const Maintenance = require('../models/Maintenance');
const Intervention = require('../models/Intervention');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const moment = require('moment-timezone');
require('dotenv').config();

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// Send email notification with retry mechanism
const sendEmailNotification = async (email, subject, message, retries = 3) => {
  const mailOptions = { from: process.env.EMAIL_USER, to: email, subject, text: message };
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      if (attempt === retries) {
        return false; // Silent failure
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// Check for upcoming and overdue maintenance notifications
const checkMaintenanceNotifications = async (io) => {
  let newNotifications = 0;
  try {
    const now = moment().tz('Europe/Paris').toDate();
    const inThreeDays = moment(now).tz('Europe/Paris').add(3, 'days').toDate();
    const oneDayAgo = moment(now).tz('Europe/Paris').subtract(24, 'hours').toDate();

    const maintenances = await Maintenance.find({
      $or: [
        { performedAt: { $lte: inThreeDays, $gte: now }, status: { $in: ['planned', null] } }, // Upcoming
        { performedAt: { $lt: now }, status: { $nin: ['completed', 'cancelled'] } }, // Overdue
      ],
    })
      .populate('equipmentId', 'name')
      .populate('performedBy', 'name email')
      .sort({ performedAt: 1 });

    for (const maintenance of maintenances) {
      if (
        !maintenance.equipmentId ||
        !maintenance.performedAt ||
        !maintenance.performedBy ||
        !maintenance.performedBy.email
      ) {
        continue; // Silent skip
      }

      const performedAt = moment(maintenance.performedAt).tz('Europe/Paris');
      const isOverdue = performedAt.toDate() < now && maintenance.status !== 'completed';
      const notificationType = isOverdue ? 'maintenance_overdue' : 'maintenance_upcoming';
      const equipmentName = maintenance.equipmentId.name || 'Unknown Equipment';
      const technicianName = maintenance.performedBy.name || 'Unknown Technician';
      const technicianEmail = maintenance.performedBy.email;
      const message = isOverdue
        ? `⚠️ Maintenance for ${equipmentName} (Technician: ${technicianName}) is overdue since ${performedAt.format('YYYY-MM-DD HH:mm')}.`
        : `⏰ Reminder: Maintenance for ${equipmentName} (Technician: ${technicianName}) is scheduled on ${performedAt.format('YYYY-MM-DD HH:mm')}.`;

      // Check for existing notification (within 24 hours for both types)
      const existingNotification = await Notification.findOne({
        maintenanceId: maintenance._id,
        type: notificationType,
        createdAt: { $gte: oneDayAgo },
      });

      if (existingNotification) {
        console.log(`Notification already exists for maintenance ${maintenance._id} (${notificationType})`);
        continue;
      }

      const notification = new Notification({
        maintenanceId: maintenance._id,
        equipmentId: maintenance.equipmentId,
        type: notificationType,
        scheduledDate: maintenance.performedAt,
        sent: false,
        emailTo: technicianEmail,
        message,
        read: false,
        readAt: null,
        createdAt: new Date(),
      });

      await notification.save();
      newNotifications++;

      const emailSent = await sendEmailNotification(
        notification.emailTo,
        isOverdue ? '⚠️ Maintenance Overdue Alert' : '⏰ Maintenance Reminder',
        message
      );

      if (emailSent) {
        notification.sent = true;
        await notification.save();
      }
    }
  } catch (err) {
    // Silent error handling
  }
  return newNotifications;
};

// Check for upcoming and missed intervention notifications
const checkInterventionNotifications = async (io) => {
  let newNotifications = 0;
  try {
    const now = moment().tz('Europe/Paris').toDate();
    const inThreeDays = moment(now).tz('Europe/Paris').add(3, 'days').toDate();
    const oneDayAgo = moment(now).tz('Europe/Paris').subtract(24, 'hours').toDate();

    const dueInterventions = await Intervention.find({
      $or: [
        { plannedDate: { $lte: inThreeDays, $gte: now }, status: { $in: ['planned', null] } },
        { plannedDate: { $lt: now }, status: { $nin: ['completed', 'cancelled'] } },
      ],
    })
      .populate('technician', 'name email')
      .sort({ plannedDate: 1 });

    for (const intervention of dueInterventions) {
      if (
        !intervention.siteId ||
        !intervention.plannedDate ||
        !intervention.technician ||
        !intervention.technician.email
      ) {
        continue;
      }

      const interventionDate = moment(intervention.plannedDate).tz('Europe/Paris');
      const isMissed = interventionDate.toDate() < now && intervention.status !== 'completed';
      const notificationType = isMissed ? 'intervention_missed' : 'intervention_upcoming';
      const siteName = intervention.siteId; // Ensure siteId is a string or adjust based on schema
      const technicianName = intervention.technician.name || 'Unknown Technician';
      const technicianEmail = intervention.technician.email;
      const message = isMissed
        ? `⚠️ Missed intervention for site ${siteName} (Technician: ${technicianName}) was scheduled on ${interventionDate.format('YYYY-MM-DD HH:mm')}.`
        : `⏰ Reminder: Intervention for site ${siteName} (Technician: ${technicianName}) is scheduled on ${interventionDate.format('YYYY-MM-DD HH:mm')}.`;

      const existingNotification = await Notification.findOne({
        interventionId: intervention._id,
        type: notificationType,
        createdAt: { $gte: oneDayAgo },
      });

      if (existingNotification) {
        console.log(`Notification already exists for intervention ${intervention._id} (${notificationType})`);
        continue;
      }

      const notification = new Notification({
        interventionId: intervention._id,
        siteId: intervention.siteId,
        type: notificationType,
        scheduledDate: intervention.plannedDate,
        sent: false,
        emailTo: technicianEmail,
        message,
        read: false,
        readAt: null,
        createdAt: new Date(),
      });

      await notification.save();
      newNotifications++;

      const emailSent = await sendEmailNotification(
        notification.emailTo,
        isMissed ? '⚠️ Missed Intervention Alert' : '⏰ Intervention Reminder',
        message
      );

      if (emailSent) {
        notification.sent = true;
        await notification.save();
      }
    }
  } catch (err) {
    // Silent error handling
  }
  return newNotifications;
};

// Continuous notification check with retry
const checkAndCreateNotifications = async (io) => {
  const check = async () => {
    let totalNewNotifications = 0;
    try {
      totalNewNotifications += await checkMaintenanceNotifications(io);
      totalNewNotifications += await checkInterventionNotifications(io);

      if (totalNewNotifications > 0 && io) {
        const notifications = await Notification.find({ read: false })
          .populate('equipmentId', 'name')
          .populate('maintenanceId', 'description performedBy status')
          .limit(10);
        io.emit('new-notifications', { notifications, total: notifications.length });
      }

      setTimeout(check, totalNewNotifications > 0 ? 300000 : 60000);
    } catch (error) {
      setTimeout(check, 60000); // Retry after 60 seconds on error
    }
  };
  check();
};

// Get all notifications
const getNotifications = async (req, res) => {
  try {
    const { read, type, email, page = 1, limit = 10, notificationCategory } = req.query;
    const filter = {};

    if (read) {
      if (read !== 'true' && read !== 'false') {
        return res.status(400).json({ message: 'Invalid value for "read" parameter. Use "true" or "false".' });
      }
      filter.read = read === 'true';
    }

    if (type) {
      filter.type = type;
    } else if (notificationCategory) {
      filter.type = {
        $in: notificationCategory === 'maintenance'
          ? ['maintenance_upcoming', 'maintenance_overdue']
          : ['intervention_upcoming', 'intervention_missed'],
      };
    }

    if (email) {
      filter.emailTo = email;
    }

    const notifications = await Notification.find(filter)
      .populate('equipmentId', 'name')
      .populate('maintenanceId', 'description performedBy status')
      .populate('interventionId', 'description technician status')
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
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
};

module.exports = {
  checkMaintenanceNotifications, // Added for server.js compatibility
  checkAndCreateNotifications,
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  sendEmailNotification, // Added for server.js email routes
};