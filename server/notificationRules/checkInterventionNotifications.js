const Notification = require('../models/Notification');
const { sendEmailNotification } = require('../email');

const checkInterventionNotifications = async (intervention) => {
  const now = new Date();
  const date = new Date(intervention.date);

  const diffDays = (date - now) / (1000 * 60 * 60 * 24);

  if (diffDays <= 2 && diffDays >= 0) {
    const message = `🚨 Upcoming intervention for site ${intervention.siteName} on ${intervention.date}.`;

    await Notification.create({
      type: 'intervention_upcoming',
      message,
      sourceId: intervention._id,
    });

    await sendEmailNotification(process.env.TEST_EMAIL, message);
  }

  if (date < now) {
    const message = `⚠️ Missed intervention for site ${intervention.siteName} scheduled on ${intervention.date}.`;

    await Notification.create({
      type: 'intervention_missed',
      message,
      sourceId: intervention._id,
    });

    await sendEmailNotification(process.env.TEST_EMAIL, message);
  }
};

module.exports = { checkInterventionNotifications };
