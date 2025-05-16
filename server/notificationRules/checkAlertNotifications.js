const Notification = require('../models/Notification');
const { sendEmailNotification } = require('../email');

const checkAlertNotifications = async (alert) => {
  if (alert.type === 'overheat' && alert.severity === 'high') {
    const message = `🔥 Site ${alert.siteName} is overheating! Temperature: ${alert.temperature}°C`;

    await Notification.create({
      type: 'site_overheat',
      message,
      sourceId: alert._id,
    });

    await sendEmailNotification(process.env.TEST_EMAIL, message);
  }
};

module.exports = { checkAlertNotifications };
