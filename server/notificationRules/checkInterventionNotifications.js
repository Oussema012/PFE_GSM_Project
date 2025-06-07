const Intervention = require('../models/Intervention');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const moment = require('moment-timezone');
const cron = require('node-cron');
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
const sendInterventionEmail = async (recipientEmail, subject, message) => {
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

// Check for upcoming and missed intervention notifications
const checkInterventionNotifications = async (io) => {
  let newNotifications = 0;
  try {
    const now = moment().tz('Africa/Tunis').toDate();
    const inThreeDays = moment(now).tz('Africa/Tunis').add(3, 'days').toDate();

    const dueInterventions = await Intervention.find({
      $or: [
        { plannedDate: { $lte: inThreeDays, $gte: now }, status: { $in: ['planned', null] } },
        { plannedDate: { $lt: now }, status: { $nin: ['completed', 'cancelled'] } },
      ],
    })
      .populate('technician', 'email') // Keep technician population for email
      .sort({ plannedDate: 1 });

    for (const intervention of dueInterventions) {
      if (
        !intervention.siteId ||
        !intervention.plannedDate ||
        !intervention.technician ||
        !intervention.technician.email
      ) {
        continue; // Silent skip
      }

      const interventionDate = moment(intervention.plannedDate).tz('Africa/Tunis');
      const isMissed = interventionDate.toDate() < now && intervention.status !== 'completed';
      const notificationType = isMissed ? 'intervention_missed' : 'intervention_upcoming';
      const siteName = intervention.siteId;
      const technicianEmail = intervention.technician.email;
      const formattedDate = interventionDate.format('M/D/YY, h:mm A');
      const message = isMissed
        ? `⚠️ Missed intervention for site ${siteName} was scheduled on ${interventionDate.format('YYYY-MM-DD HH:mm')}.\nSite: ${siteName}\nScheduled: ${formattedDate}`
        : `⏰ Reminder: Intervention for site ${siteName} is scheduled on ${interventionDate.format('YYYY-MM-DD HH:mm')}.\nSite: ${siteName}\nScheduled: ${formattedDate}`;

      // Check for existing notification
      const existingNotification = await Notification.findOne({
        interventionId: intervention._id,
        type: notificationType,
      });

      if (existingNotification) {
        continue; // Silent skip
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

      const emailSent = await sendInterventionEmail(
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

// Schedule notification checks with cron
const checkAndCreateNotifications = (io) => {
  cron.schedule('*/1 * * * *', async () => {
    let totalNewNotifications = 0;
    try {
      totalNewNotifications += await checkInterventionNotifications(io);

      if (totalNewNotifications > 0 && io) {
        const notifications = await Notification.find({ read: false })
          .populate('interventionId', 'description status') // Exclude technician from populate
          .limit(10);
        io.emit('new-notifications', { notifications, total: notifications.length });
      }
    } catch (error) {
      // Silent retry (consider logging in production)
    }
  });
};

// Get all notifications (filtered to interventions only)
const getNotifications = async (req, res) => {
  try {
    const { read, type, email, page = 1, limit = 10 } = req.query;
    const filter = {
      type: { $in: ['intervention_upcoming', 'intervention_missed'] }, // Restrict to intervention notifications
    };

    if (read) {
      if (read !== 'true' && read !== 'false') {
        return res.status(400).json({ message: 'Invalid value for "read" parameter. Use "true" or "false".' });
      }
      filter.read = read === 'true';
    }

    if (type) {
      if (!['intervention_upcoming', 'intervention_missed'].includes(type)) {
        return res.status(400).json({ message: 'Invalid notification type. Use "intervention_upcoming" or "intervention_missed".' });
      }
      filter.type = type;
    }

    if (email) {
      filter.emailTo = email;
    }

    const notifications = await Notification.find(filter)
      .populate({
        path: 'interventionId',
        select: 'description status', // Exclude technician from select
      })
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
    res.status(500).json({ message: 'Error fetching notifications', error: 'Internal server error' });
  }
};

// Mark notification as read
const markNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findOne({
      _id: notificationId,
      type: { $in: ['intervention_upcoming', 'intervention_missed'] },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Intervention notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read', error: 'Internal server error' });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      type: { $in: ['intervention_upcoming', 'intervention_missed'] },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Intervention notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification', error: 'Internal server error' });
  }
};

module.exports = {
  checkInterventionNotifications,
  checkAndCreateNotifications,
  getNotifications,
  markNotificationRead,
  deleteNotification,
  sendInterventionEmail,
};