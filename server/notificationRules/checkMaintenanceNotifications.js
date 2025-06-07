const Maintenance = require('../models/Maintenance');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
  },
  logger: false, // Disable verbose logging
  debug: false, // Disable debug output
});

// Send email notification without console logging
const sendMaintenanceEmail = async (recipientEmail, subject, message) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Missing email credentials');
  }

  if (!recipientEmail) {
    throw new Error('Missing recipient email');
  }

  const mailOptions = {
    from: `"GSM Monitor" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    throw err; // Silent failure, no console logging
  }
};

// Check for upcoming and overdue maintenance notifications
const checkMaintenanceTasks = async (io = null) => {
  let newNotifications = 0;
  try {
    const now = moment().tz('Europe/Paris').toDate();
    const inThreeDays = moment(now).tz('Europe/Paris').add(3, 'days').toDate();

    const maintenances = await Maintenance.find({
      $or: [
        { scheduledDate: { $lte: inThreeDays, $gte: now }, status: { $in: ['planned', 'pending', null] } }, // Upcoming
        { scheduledDate: { $lt: now }, status: { $nin: ['completed', 'cancelled'] } }, // Overdue
      ],
    })
      .populate('equipmentId', 'name')
      .populate('performedBy', 'name email')
      .sort({ scheduledDate: 1 });

    for (const maintenance of maintenances) {
      if (
        !maintenance.equipmentId ||
        !maintenance.scheduledDate ||
        !mongoose.Types.ObjectId.isValid(maintenance.equipmentId) ||
        !maintenance.performedBy ||
        !maintenance.performedBy.email
      ) {
        console.log(`Skipping maintenance ${_id}:`, {
          maintenanceId: maintenance._id,
          equipmentId: !!maintenance.equipmentId,
          scheduledDate: !!maintenance.scheduledDate,
          validEquipmentId: mongoose.Types.ObjectId.isValid(maintenance.equipmentId),
          performedBy: !!maintenance.performedBy,
          email: !!maintenance.performedBy?.email,
        });
        continue; // Skip invalid records
      }
      const scheduledAt = moment(maintenance.scheduledDate).tz('Europe/Paris');
      const isOverdue = scheduledAt.toDate() < now && maintenance.status !== 'completed';
      const notificationType = isOverdue ? 'maintenance_overdue' : 'maintenance_upcoming';
      const equipmentName = maintenance.equipmentId.name || 'Unknown Equipment';
const technicianName = maintenance.performedBy?.name || 'Unknown Technician';
if (!maintenance.performedBy?.name) {
  console.log(`Warning: Missing name for technician ID ${maintenance.performedBy?._id} in maintenance ${maintenance._id}`);
}      const technicianEmail = maintenance.performedBy.email;
      const message = isOverdue
        ? `⚠️ Maintenance for ${equipmentName} (Technician: ${technicianName}) is overdue since ${scheduledAt.format('YYYY-MM-DD HH:mm')}.`
        : `⏰ Reminder: Maintenance for ${equipmentName} (Technician: ${technicianName}) is scheduled on ${scheduledAt.format('YYYY-MM-DD HH:mm')}.`;

      // Check for existing notification
      const existingNotification = await Notification.findOne({
        maintenanceId: maintenance._id,
        type: notificationType,
      });

      if (existingNotification) {
        console.log(`Notification already exists for maintenance ${maintenance._id}, type: ${notificationType}`);
        continue; // Skip if notification already exists
      }

      const notification = new Notification({
        maintenanceId: maintenance._id,
        equipmentId: maintenance.equipmentId,
        type: notificationType,
        scheduledDate: maintenance.scheduledDate,
        sent: false,
        emailTo: technicianEmail,
        message,
        read: false,
        readAt: null,
        createdAt: new Date(),
      });

      await notification.save();
      newNotifications++;
      console.log(`Created new notification for maintenance ${maintenance._id}, type: ${notificationType}`);

      const emailSent = await sendMaintenanceEmail(
        notification.emailTo,
        isOverdue ? '⚠️ Maintenance Overdue Alert' : '⏰ Maintenance Reminder',
        message
      );

      if (emailSent) {
        notification.sent = true;
        await notification.save();
        console.log(`Email sent for notification ${notification._id} to ${technicianEmail}`);
      } else {
        console.log(`Failed to send email for notification ${notification._id} to ${technicianEmail}`);
      }

      // Emit notification via Socket.IO if io is provided
      if (io && newNotifications > 0) {
        const notifications = await Notification.find({ read: false })
          .populate('equipmentId', 'name')
          .populate('maintenanceId', 'description performedBy status')
          .limit(10);
        io.emit('new-notifications', { notifications, total: notifications.length });
        console.log(`Emitted ${notifications.length} new notifications via Socket.IO`);
      }
    }
  } catch (err) {
    console.error('Error in checkMaintenanceTasks:', err);
  }
  console.log(`Total new maintenance notifications created: ${newNotifications}`);
  return newNotifications;
};

// Schedule maintenance notification checks with cron
const scheduleMaintenanceNotifications = (io = null) => {
  cron.schedule('*/1 * * * *', async () => {
    console.log('Running scheduled maintenance notification check...');
    let totalNewNotifications = 0;
    try {
      totalNewNotifications += await checkMaintenanceTasks(io);
    } catch (error) {
      console.error('Error in scheduled maintenance notification check:', error);
    }
  });
};

// Get all notifications (filtered to maintenance only)
// Get all notifications (filtered to maintenance only)
const getNotifications = async (req, res) => {
  try {
    const { read, type, email, page = 1, limit = 10 } = req.query;
    const filter = {
      type: { $in: ['maintenance_upcoming', 'maintenance_overdue'] }, // Restrict to maintenance notifications
    };

    if (read) {
      if (read !== 'true' && read !== 'false') {
        return res.status(400).json({ message: 'Invalid value for "read" parameter. Use "true" or "false".' });
      }
      filter.read = read === 'true';
    }

    if (type) {
      if (!['maintenance_upcoming', 'maintenance_overdue'].includes(type)) {
        return res.status(400).json({ message: 'Invalid notification type. Use "maintenance_upcoming" or "maintenance_overdue".' });
      }
      filter.type = type;
    }

    if (email) {
      filter.emailTo = email;
    }

    const notifications = await Notification.find(filter)
      .populate('equipmentId', 'name')
      .populate({
        path: 'maintenanceId',
        select: 'description performedBy status',
        populate: {
          path: 'performedBy',
          select: 'name email',
        },
      })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalNotifications = await Notification.countDocuments(filter);

    console.log(`Fetched ${notifications.length} maintenance notifications for page ${page}`);

    res.status(200).json({
      notifications,
      total: totalNotifications,
      page: parseInt(page),
      totalPages: Math.ceil(totalNotifications / limit),
    });
  } catch (error) {
    console.error('Error fetching maintenance notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: 'Internal server error' });
  }
};

// Mark notification as read
const markNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findOne({
      _id: notificationId,
      type: { $in: ['maintenance_upcoming', 'maintenance_overdue'] },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Maintenance notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    console.log(`Maintenance notification ${notificationId} marked as read`);

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking maintenance notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read', error: 'Internal server error' });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      type: { $in: ['maintenance_upcoming', 'maintenance_overdue'] },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Maintenance notification not found' });
    }

    console.log(`Maintenance notification ${notificationId} deleted`);

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting maintenance notification:', error);
    res.status(500).json({ message: 'Error deleting notification', error: 'Internal server error' });
  }
};

module.exports = {
  checkMaintenanceTasks,
  scheduleMaintenanceNotifications,
  getNotifications,
  markNotificationRead,
  deleteNotification,
  sendMaintenanceEmail,
};