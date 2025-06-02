const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/mongoose'); // MongoDB connection setup
const { checkAndCreateNotifications, checkMaintenanceNotifications } = require('./notificationRules/checkMaintenanceNotifications');
const { sendEmailNotification } = require('./email');
const cron = require('node-cron');

const app = express();

// ========== Middleware ==========
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// ========== Route Imports ==========
require('./routes/user.routes')(app);
const siteRoutes = require('./routes/Site.routes');
const equipmentRoutes = require('./routes/Equipment.routes');
const alertRoutes = require('./routes/Alert.routes');
const authRoutes = require('./routes/Authentification.routes');
const interventionRoutes = require('./routes/Intervention.routes');
const reportRoutes = require('./routes/report.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const mapRoutes = require('./routes/map.routes');
const notificationRoutes = require('./routes/notifications.routes');
const userRoutes = require('./routes/user.routes'); // ✅ Correct router import

// ========== Initial Maintenance Check on Startup ==========
try {
  checkAndCreateNotifications();
} catch (error) {
  console.error('Error during maintenance check on startup:', error);
}

try {
  checkMaintenanceNotifications();
} catch (error) {
  console.error('Error during maintenance check on startup:', error);
}
// ========== API Routes ==========

app.use('/api/sites', siteRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/notifications', notificationRoutes);


// ========== Manual Email Notification Route ==========
app.post('/send-notification', async (req, res) => {
  const { email, message } = req.body;
  try {
    await sendEmailNotification(email, message);
    res.status(200).send('✅ Email sent successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('❌ Error sending email');
  }
});

// ========== Test Email Route ==========
app.get('/send-test-email', async (req, res) => {
  const testMessage = 'This is a test email to verify email sending functionality.';
  const recipient = process.env.TEST_EMAIL;

  if (!recipient) {
    console.warn('⚠️ TEST_EMAIL is not set in the .env file');
    return res.status(400).send('❌ TEST_EMAIL is not configured in environment variables.');
  }

  try {
    await sendEmailNotification(recipient, testMessage);
    res.send(`✅ Test email sent successfully to ${recipient}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error sending test email');
  }
});

// ========== Health Check ==========
app.get('/', (req, res) => {
  res.send('🚀 GSM Monitoring API is running');
});





// ========== Start Server ==========
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message
  });
});
// ========== Graceful Shutdown ==========
const shutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};


process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ========== Daily Maintenance Notification Check at 9:00 AM ==========

