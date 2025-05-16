const nodemailer = require('nodemailer');

const sendEmailNotification = async (recipientEmail, message, htmlMessage = null) => {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('❌ Missing EMAIL_USER or EMAIL_PASS in environment variables.');
    throw new Error('Missing email credentials');
  }

  if (!recipientEmail) {
    console.error('❌ Recipient email is missing.');
    throw new Error('Missing recipient email');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // Use STARTTLS
    secure: false, // Enable STARTTLS
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Still needed for proxies
      minVersion: 'TLSv1.2', // Gmail requires TLS 1.2+
    },
    logger: true,
    debug: true,
  });

  const mailOptions = {
    from: `"GSM Monitor" <${EMAIL_USER}>`,
    to: recipientEmail,
    subject: '🔧 Maintenance Alert',
    text: message,
    html: htmlMessage || undefined,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${recipientEmail}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send email to ${recipientEmail}:`, err.message, err.stack);
    throw err;
  }
};

module.exports = { sendEmailNotification };