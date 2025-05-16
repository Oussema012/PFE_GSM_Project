const Maintenance = require('../models/Maintenance');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const moment = require('moment');
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

// Check for upcoming and overdue maintenance notifications
async function checkMaintenanceNotifications() {
  const now = new Date();
  const inThreeDays = moment(now).add(3, 'days').toDate();

  // Find upcoming (within 3 days) and overdue maintenances
  const dueMaintenances = await Maintenance.find({
    $or: [
      { scheduledDate: { $lte: inThreeDays, $gte: now } }, // Upcoming
      { scheduledDate: { $lt: now }, status: { $ne: 'completed' } }, // Overdue
    ],
  }).populate('equipmentId', 'name');

  for (const m of dueMaintenances) {
    // Validate required fields
    if (!m.equipmentId || !mongoose.Types.ObjectId.isValid(m.equipmentId) || !m.scheduledDate) {
      console.warn(`Skipping maintenance ID ${m._id}: Missing or invalid equipmentId or scheduledDate`);
      continue;
    }

    // Determine notification type and message
    const scheduledDate = new Date(m.scheduledDate);
    const isOverdue = scheduledDate < now && m.status !== 'completed';
    const notificationType = isOverdue ? 'overdue' : 'upcoming';
    const equipmentName = m.equipmentId?.name || 'Unknown Equipment';
    const message = isOverdue
      ? `Overdue: Maintenance for equipment ${equipmentName} was due on ${moment(m.scheduledDate).format('YYYY-MM-DD')}.`
      : `Reminder: Maintenance for equipment ${equipmentName} is scheduled on ${moment(m.scheduledDate).format('YYYY-MM-DD')}.`;

    // Check if this maintenance has already been notified for this type
    const alreadyNotified = await Notification.findOne({
      maintenanceId: m._id,
      type: notificationType,
    });

    if (alreadyNotified) {
      console.log(`Notification already exists for maintenance ${m._id} (${notificationType})`);
      continue;
    }

    try {
      // Send the email to the recipient
      const emailSent = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.TEST_EMAIL,
        subject: isOverdue ? '🚨 Overdue Maintenance Alert' : '⏰ Maintenance Reminder',
        text: message,
      });

      // Create and save the notification in the database
      const notification = new Notification({
        maintenanceId: m._id,
        equipmentId: m.equipmentId,
        type: notificationType,
        scheduledDate: m.scheduledDate,
        sent: true,
        message,
        emailTo: process.env.TEST_EMAIL,
        createdAt: new Date(),
      });

      await notification.save();

      console.log(`✅ Notification sent and saved for maintenance ${m._id} (${notificationType})`);
    } catch (err) {
      console.error(`❌ Error sending email for maintenance ${m._id}:`, err.message);
    }
  }
}

// Check and create notifications (for startup or manual trigger)
async function checkAndCreateNotifications() {
  try {
    console.log('Running startup maintenance notification check...');
    await checkMaintenanceNotifications();
  } catch (error) {
    console.error('Error in checkAndCreateNotifications:', error.message);
  }
}

module.exports = {
  checkMaintenanceNotifications,
  checkAndCreateNotifications,
};