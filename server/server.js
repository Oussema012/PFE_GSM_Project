const express = require('express');
const cors = require('cors');
require("dotenv").config();
require("./config/mongoose"); // MongoDB connection
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // For parsing JSON request bodies

// Routes
const authRoutes = require('./routes/auth.routes'); // ✅ Auth route (your file)
const authMiddleware = require('./middleware/auth'); // ✅ Role-based auth middleware
const siteRoutes = require('./routes/Site.routes');
const equipmentRoutes = require('./routes/Equipment.routes');
const alertRoutes = require('./routes/Alert.routes');
const interventionRoutes = require('./routes/Intervention.routes');
const reportRoutes = require('./routes/report.routes');
const userRoutes = require('./routes/user.routes');

// ✅ Auth routes
app.use('/api/auth', authRoutes);  // Authentication routes for signup/login

// ✅ Protected API routes
app.use('/api/sites', authMiddleware(['admin', 'engineer', 'technician']), siteRoutes);
app.use('/api/equipment', authMiddleware(['admin', 'engineer', 'technician']), equipmentRoutes);
app.use('/api/alerts', authMiddleware(['admin', 'engineer', 'technician']), alertRoutes);
app.use('/api/interventions', authMiddleware(['admin', 'engineer', 'technician']), interventionRoutes);
app.use('/api/reports', authMiddleware(['admin', 'engineer']), reportRoutes); // Reports: no technician access
app.use('/api/users', userRoutes);
// Test route to verify role protection (optional)
app.get('/api/test-admin', authMiddleware(['admin']), (req, res) => {
  res.send("✅ You are an admin");
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('🚀 GSM Monitoring API is running');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
});
