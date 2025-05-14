const Maintenance = require('../models/Maintenance');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
require('dotenv').config();  // Ensure that environment variables are loaded

// Function to send email notifications
const sendEmailNotification = async (email, subject, message) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Disable strict SSL verification for self-signed certificates
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER, // From environment variable for security
    to: email,
    subject: subject,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Email sending error:', error);
  }
};

// Function to check for upcoming and overdue maintenance
const checkAndCreateNotifications = async () => {
  try {
    const maintenances = await Maintenance.find(); // Fetch all maintenances
    const currentDate = new Date();

    for (const maintenance of maintenances) {
      const scheduledDate = new Date(maintenance.scheduledDate);
      const timeDifference = scheduledDate - currentDate;

      // Check for upcoming maintenance (3 days before)
      if (timeDifference <= 3 * 24 * 60 * 60 * 1000 && timeDifference > 0) {
        await createNotification(maintenance, 'upcoming', `Maintenance for Equipment ID: ${maintenance.equipmentId} is scheduled in 3 days.`);
      }

      // Check for overdue maintenance
      if (timeDifference < 0 && maintenance.status !== 'completed') {
        await createNotification(maintenance, 'overdue', `Maintenance for Equipment ID: ${maintenance.equipmentId} is overdue.`);
      }
    }
  } catch (err) {
    console.error('Error checking maintenance:', err);
  }
};

// Helper function to create notification
const createNotification = async (maintenance, type, message) => {
  const existingNotification = await Notification.findOne({ maintenanceId: maintenance._id, type: type });
  
  if (!existingNotification) {
    const notification = new Notification({
      message: message,
      date: new Date(),
      type: type,
      email: process.env.EMAIL_USER,  // Use the email from environment variable
      maintenanceId: maintenance._id, // Store maintenance reference in notification
    });

    await notification.save();
    await sendEmailNotification(process.env.EMAIL_USER, `Maintenance Alert: ${type}`, message); // Send email notification
  }
};

module.exports = { checkAndCreateNotifications };
