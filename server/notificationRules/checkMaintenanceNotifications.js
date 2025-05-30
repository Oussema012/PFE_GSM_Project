// src/notificationRules/checkNotifications.js
const Maintenance = require('../models/Maintenance');
const Intervention = require('../models/Intervention');
const Notification = require('../models/Notification');
const User = require('../models/User');
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
  tls: {
    rejectUnauthorized: false,
  },
});

// Send email notification with retry mechanism
const sendEmailNotification = async (email, subject, message, retries = 3) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text: message,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${email} on attempt ${attempt}`);
      return true;
    } catch (error) {
      console.error(`Email sending error to ${email} on attempt ${attempt}:`, error.message);
      if (attempt === retries) {
        console.error(`Failed to send email to ${email} after ${retries} attempts`);
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

// Check for upcoming and overdue maintenance notifications
const checkMaintenanceNotifications = async () => {
  try {
    const now = moment().tz('Europe/Paris').toDate();
    const inThreeDays = moment(now).tz('Europe/Paris').add(3, 'days').toDate();

    // Find maintenances within 3 days or overdue
    const maintenances = await Maintenance.find({
      $or: [
        { performedAt: { $lte: inThreeDays, $gte: now }, status: 'planned' }, // Upcoming
        { performedAt: { $lt: now }, status: { $nin: ['completed', 'cancelled'] } }, // Overdue
      ],
    })
      .populate('equipmentId', 'name')
      .populate('performedBy', 'name email')
      .sort({ performedAt: 1 });

    for (const maintenance of maintenances) {
      // Validate required fields
      if (
        !maintenance.equipmentId ||
        !maintenance.performedAt ||
        !maintenance.performedBy ||
        !maintenance.performedBy.email
      ) {
        console.warn(
          `Skipping maintenance ID ${maintenance._id}: Missing equipmentId, performedAt, performedBy, or email`
        );
        continue;
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

      // Check for existing notification
      const existingNotification = await Notification.findOne({
        maintenanceId: maintenance._id,
        type: notificationType,
      });

      if (existingNotification) {
        console.log(`Notification already exists for maintenance ${maintenance._id} (${notificationType})`);
        continue;
      }

      // Create notification
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
      console.log(`Notification created: ${notification._id} (${notificationType})`);

      const emailSent = await sendEmailNotification(
        notification.emailTo,
        isOverdue ? '⚠️ Maintenance Overdue Alert' : '⏰ Maintenance Reminder',
        message
      );

      if (emailSent) {
        notification.sent = true;
        await notification.save();
        console.log(`Email sent for notification ${notification._id}`);
      }
    }
  } catch (err) {
    console.error('Error checking maintenance notifications:', err.message);
    throw err;
  }
};

// Check for upcoming and missed intervention notifications
const checkInterventionNotifications = async () => {
  try {
    const now = moment().tz('Europe/Paris').toDate();
    const inThreeDays = moment(now).tz('Europe/Paris').add(3, 'days').toDate();

    const dueInterventions = await Intervention.find({
      $or: [
        { plannedDate: { $lte: inThreeDays, $gte: now }, status: 'planned' },
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
        console.warn(
          `Skipping intervention ID ${intervention._id}: Missing siteId, plannedDate, technician, or email`
        );
        continue;
      }

      const interventionDate = moment(intervention.plannedDate).tz('Europe/Paris');
      const isMissed = interventionDate.toDate() < now && intervention.status !== 'completed';
      const notificationType = isMissed ? 'intervention_missed' : 'intervention_upcoming';
      const siteName = intervention.siteId;
      const technicianName = intervention.technician.name || 'Unknown Technician';
      const technicianEmail = intervention.technician.email;
      const message = isMissed
        ? `⚠️ Missed intervention for site ${siteName} (Technician: ${technicianName}) was scheduled on ${interventionDate.format('YYYY-MM-DD HH:mm')}.`
        : `⏰ Reminder: Intervention for site ${siteName} (Technician: ${technicianName}) is scheduled on ${interventionDate.format('YYYY-MM-DD HH:mm')}.`;

      const alreadyNotified = await Notification.findOne({
        interventionId: intervention._id,
        type: notificationType,
      });

      if (alreadyNotified) {
        console.log(
          `Notification already exists for intervention ${intervention._id} (${notificationType})`
        );
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
      console.log(`Notification created: ${notification._id} (${notificationType})`);

      const emailSent = await sendEmailNotification(
        notification.emailTo,
        isMissed ? '⚠️ Missed Intervention Alert' : '⏰ Intervention Reminder',
        message
      );

      if (emailSent) {
        notification.sent = true;
        await notification.save();
        console.log(`Email sent for notification ${notification._id}`);
      }
    }
  } catch (err) {
    console.error('Error checking intervention notifications:', err.message);
    throw err;
  }
};

// Check and create both maintenance and intervention notifications
const checkAndCreateNotifications = async () => {
  try {
    console.log('Running notification check...');
    await checkMaintenanceNotifications();
    await checkInterventionNotifications();
    return { success: true, message: 'Checked and created notifications successfully' };
  } catch (error) {
    console.error('Error in checkAndCreateNotifications:', error.message);
    throw error;
  }
};

module.exports = {
  checkMaintenanceNotifications,
  checkInterventionNotifications,
  checkAndCreateNotifications,
};