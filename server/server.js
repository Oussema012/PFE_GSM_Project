const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/mongoose'); // MongoDB connection setup

const app = express();

// ========== Middleware ==========
app.use(cors());
app.use(express.json());

// ========== Route Imports ==========
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const siteRoutes = require('./routes/Site.routes');
const equipmentRoutes = require('./routes/Equipment.routes');
const alertRoutes = require('./routes/Alert.routes');
const interventionRoutes = require('./routes/Intervention.routes');
const reportRoutes = require('./routes/report.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const mapRoutes = require('./routes/map.routes');

// ========== API Routes ==========
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/maps', mapRoutes);

// ========== Health Check ==========
app.get('/', (req, res) => {
  res.send('🚀 GSM Monitoring API is running');
});

// ========== 404 & Error Handling ==========
app.use((req, res, next) => {
  res.status(404).json({ message: '❌ Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('💥 Internal Server Error:', err);
  res.status(500).json({ message: '❌ Internal server error. Please try again later.' });
});

// ========== Start Server ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
