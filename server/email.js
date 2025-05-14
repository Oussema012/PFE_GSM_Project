const nodemailer = require('nodemailer');

// Function to send email notifications
const sendEmailNotification = async (email, message) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email credentials (EMAIL_USER, EMAIL_PASS) are missing in the environment variables.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,  // Disable strict SSL verification
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,  // Ensure this is set in your .env file
    to: email,
    subject: 'Maintenance Alert',
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);  // Confirm that the email was sent
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
  }
};

module.exports = { sendEmailNotification };
