const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/mongoose'); // MongoDB connection setup

const app = express();

// ========== Middleware ==========
// CORS setup to allow cross-origin requests
app.use(cors());

// Automatically parse incoming JSON requests
app.use(express.json());

// ========== Route Imports ==========
// Authentication, users, and other resources
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const siteRoutes = require('./routes/Site.routes');
const equipmentRoutes = require('./routes/Equipment.routes');
const alertRoutes = require('./routes/Alert.routes');
const interventionRoutes = require('./routes/Intervention.routes');
const reportRoutes = require('./routes/report.routes');
const mapRoutes = require('./routes/map.routes');

// ========== Public Routes ==========
// Route for authentication (login/signup)
app.use('/api/auth', authRoutes); 

// Routes for user management (CRUD operations)
app.use('/api/users', userRoutes); 

// Routes for sites, equipment, alerts, interventions, and reports
app.use('/api/sites', siteRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/reports', reportRoutes);

// Map-related routes (no authentication required)
app.use('/api', mapRoutes); 

// ========== Health Check Route ==========
// Simple endpoint to check if the API is running
app.get('/', (req, res) => {
  res.send('🚀 GSM Monitoring API is running');
});

// ========== 404 Handler ==========
// Catch-all for unhandled routes
app.use((req, res, next) => {
  res.status(404).json({ message: '❌ Endpoint not found' });
});

// ========== Global Error Handler ==========
// Handles errors globally in the app
app.use((err, req, res, next) => {
  console.error('💥 Internal Server Error:', err);
  res.status(500).json({ message: '❌ Internal server error. Please try again later.' });
});

// ========== Start Server ==========
// Initialize server on defined port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
