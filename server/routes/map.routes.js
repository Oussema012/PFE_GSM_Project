// routes/map.routes.js
const express = require('express');
const router = express.Router();
const MapController = require('../controllers/MapController');

// Route: Get all site locations for the map
router.get('/map/sites', MapController.getSitesForMap);

module.exports = router;
