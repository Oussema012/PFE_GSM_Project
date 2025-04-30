const express = require('express');

const cors = require('cors');
require("dotenv").config();
require("./config/mongoose");



// Configuration CORS pour autoriser les requêtes du frontend 
    // app.use(cors({
    //   origin: "http://localhost:5173",
    //   credentials: true,
    // }));

// Route files
const siteRoutes = require('./routes/Site.routes');
const equipmentRoutes = require('./routes/Equipment.routes');
const alertRoutes = require('./routes/Alert.routes'); 
const interventionRoutes = require('./routes/Intervention.routes'); 

const app = express();

// Middleware
app.use(cors()); // Optional: allow cross-origin requests if needed
app.use(express.json()); // Parse JSON bodies



// Routes
app.use('/api/sites', siteRoutes);  // Routes for managing sites
app.use('/api/equipment', equipmentRoutes);  // Routes for managing equipment
app.use('/api/alerts', alertRoutes);  // Routes for managing alerts
app.use('/api/interventions', interventionRoutes);  // Routes for managing interventions

// Default route (for testing)
app.get('/', (req, res) => {
  res.send('🚀 GSM Monitoring API is running');
});


// Start the server
const PORT = process.env.PORT ;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
});
