const Intervention = require('../models/Intervention');
const Notification = require('../models/Notification');
const User = require('../models/User'); // Added to fetch technician email
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
      // Wait 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
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
        { plannedDate: { $lte: inThreeDays, $gte: now }, status: 'planned' }, // Upcoming, only planned
        { plannedDate: { $lt: now }, status: { $nin: ['completed', 'cancelled'] } }, // Missed, exclude completed/cancelled
      ],
    })
      .populate('technician', 'name email')
      .sort({ plannedDate: 1 });

    for (const intervention of dueInterventions) {
      // Validate required fields
      if (
        !intervention.siteId ||
        !intervention.plannedDate ||
        !intervention.technician ||
        !intervention.technician.email
      ) {
        console.warn(
          `Skipping intervention ID ${intervention._id}: Missing siteId, plannedDate, technician, or technician email`
        );
        continue;
      }

      // Determine notification type and message
      const interventionDate = moment(intervention.plannedDate).tz('Europe/Paris');
      const isMissed = interventionDate.toDate() < now && intervention.status !== 'completed';
      const notificationType = isMissed ? 'intervention_missed' : 'intervention_upcoming';
      const siteName = intervention.siteId; // String, not populated
      const technicianName = intervention.technician.name || 'Unknown Technician';
      const technicianEmail = intervention.technician.email;
      const message = isMissed
        ? `⚠️ Missed intervention for site ${siteName} (Technician: ${technicianName}) was scheduled on ${interventionDate.format('YYYY-MM-DD HH:mm')}.`
        : `⏰ Reminder: Intervention for site ${siteName} (Technician: ${technicianName}) is scheduled on ${interventionDate.format('YYYY-MM-DD HH:mm')}.`;

      // Check if this intervention has already been notified
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

      // Create notification
      const notification = new Notification({
        interventionId: intervention._id,
        siteId: intervention.siteId,
        type: notificationType,
        scheduledDate: intervention.plannedDate,
        sent: false,
        emailTo: technicianEmail, // Use technician's email
        message,
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
    throw err; // Re-throw to handle in calling function
  }
}

// Check and create notifications (for startup or manual trigger)
async function checkAndCreateInterventionNotifications() {
  try {
    console.log('Running intervention notification check...');
    await checkInterventionNotifications();
    return { success: true, message: 'Checked and created intervention notifications successfully' };
  } catch (error) {
    console.error('Error in checkAndCreateInterventionNotifications:', error.message);
    throw error;
  }
}

module.exports = {
  checkInterventionNotifications,
  checkAndCreateInterventionNotifications,
};