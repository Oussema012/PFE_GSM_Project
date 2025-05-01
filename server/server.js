const express = require('express');
const cors = require('cors');
require("dotenv").config();
require("./config/mongoose");

// Import bodyParser if you still want to use it (optional since express.json() is enough)
const bodyParser = require('body-parser');

// Route files
const siteRoutes = require('./routes/Site.routes');
const equipmentRoutes = require('./routes/Equipment.routes');
const alertRoutes = require('./routes/Alert.routes'); 
const interventionRoutes = require('./routes/Intervention.routes'); 
const reportRoutes = require('./routes/report.routes'); // ✅ NEW

const app = express();

// Middleware
app.use(cors()); // Optional: allow cross-origin requests if needed

// Body parser (express.json() can handle this, body-parser is redundant)
app.use(express.json()); 

// Routes
app.use('/api/sites', siteRoutes);  // Routes for managing sites
app.use('/api/equipment', equipmentRoutes);  // Routes for managing equipment
app.use('/api/alerts', alertRoutes);  // Routes for managing alerts
app.use('/api/interventions', interventionRoutes);  // Routes for managing interventions
app.use('/api/reports', reportRoutes); // ✅ Mount report routes

// Default route (for testing)
app.get('/', (req, res) => {
  res.send('🚀 GSM Monitoring API is running');
});

// Start the server
const PORT = process.env.PORT || 5000; // Add a fallback port value
app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
});
