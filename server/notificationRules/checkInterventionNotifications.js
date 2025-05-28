const Intervention = require('../models/Intervention');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
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
    console.error(`Email sending error to ${email}:`, error.message);
    return false;
  }
};

// Check for upcoming and missed intervention notifications
async function checkInterventionNotifications() {
  try {
    const now = moment().tz('Europe/Paris').toDate();
    const inThreeDays = moment(now).tz('Europe/Paris').add(3, 'days').toDate();

    // Find upcoming (within 3 days) and missed interventions
    const dueInterventions = await Intervention.find({
      $or: [
        { plannedDate: { $lte: inThreeDays, $gte: now } }, // Upcoming
        { plannedDate: { $lt: now }, status: { $ne: 'completed' } }, // Missed, exclude completed
      ],
    })
      .populate('siteId', 'name')
      .populate('technician', 'name')
      .sort({ plannedDate: 1 });

    for (const intervention of dueInterventions) {
      // Validate required fields
      if (
        !intervention.siteId ||
        !mongoose.Types.ObjectId.isValid(intervention.siteId) ||
        !intervention.plannedDate ||
        !intervention.technician ||
        !mongoose.Types.ObjectId.isValid(intervention.technician)
      ) {
        console.warn(
          `Skipping intervention ID ${intervention._id}: Missing or invalid siteId, plannedDate, or technician`
        );
        continue;
      }

      // Determine notification type and message
      const interventionDate = new Date(intervention.plannedDate);
      const isMissed = interventionDate < now && intervention.status !== 'completed';
      const notificationType = isMissed ? 'intervention_missed' : 'intervention_upcoming';
      const siteName = intervention.siteId?.name || 'Unknown Site';
      const technicianName = intervention.technician?.name || 'Unknown Technician';
      const message = isMissed
        ? `⚠️ Missed intervention for site ${siteName} (Technician: ${technicianName}) was scheduled on ${moment(intervention.plannedDate)
            .tz('Europe/Paris')
            .format('YYYY-MM-DD HH:mm')}.`
        : `⏰ Reminder: Intervention for site ${siteName} (Technician: ${technicianName}) is scheduled on ${moment(intervention.plannedDate)
            .tz('Europe/Paris')
            .format('YYYY-MM-DD HH:mm')}.`;

      // Check if this intervention has already been notified
      const alreadyNotified = await Notification.findOne({
        sourceId: intervention._id,
        type: notificationType,
      });

      if (alreadyNotified) {
        console.log(
          `Notification already exists for intervention ${intervention._id} (${notificationType})`
        );
        continue;
      }

      // Create notification
      const notification = new Notification({
        sourceId: intervention._id,
        siteId: intervention.siteId,
        type: notificationType,
        scheduledDate: intervention.plannedDate,
        sent: false,
        message,
        emailTo: process.env.TEST_EMAIL || process.env.EMAIL_USER,
        date: new Date(),
        read: false,
        readAt: null,
        createdAt: new Date(),
      });

      await notification.save();

      // Send email
      const emailSent = await sendEmailNotification(
        notification.emailTo,
        isMissed ? '⚠️ Missed Intervention Alert' : '⏰ Intervention Reminder',
        message
      );

      if (emailSent) {
        notification.sent = true;
        await notification.save();
      }

      console.log(
        `✅ Notification created and ${emailSent ? 'email sent' : 'email failed'} for intervention ${
          intervention._id
        } (${notificationType})`
      );
    }
  } catch (err) {
    console.error('Error checking intervention notifications:', err.message);
  }
}

// Check and create notifications (for startup or manual trigger)
async function checkAndCreateInterventionNotifications() {
  try {
    console.log('Running startup intervention notification check...');
    await checkInterventionNotifications();
  } catch (error) {
    console.error('Error in checkAndCreateInterventionNotifications:', error.message);
  }
}

module.exports = {
  checkInterventionNotifications,
  checkAndCreateInterventionNotifications,
};