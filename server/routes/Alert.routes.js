const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/AlertController');

// POST /api/alerts → create alert
router.post('/', AlertController.createAlert);

// GET /api/alerts/active/:siteId → get active alerts for a site
router.get('/active/:siteId', AlertController.getActiveAlertsBySite);

// PUT /api/alerts/:id → resolve an alert by ID
router.put('/:id', AlertController.resolveAlert);

// DELETE /api/alerts/:id → delete an alert by ID
router.delete('/:id', AlertController.deleteAlert);

// GET /api/alerts/history/:siteId → get alert history (active and resolved alerts)
router.get('/history/:siteId', AlertController.getAlertHistory);

// GET /api/alerts/resolved/:siteId → get resolved alerts for a site
router.get('/resolved/:siteId', AlertController.getResolvedAlerts);

// GET all resolved alerts
router.get('/resolved', AlertController.getAllResolvedAlerts);


// Get resolved alerts history by siteId and optional date range
router.get('/history/resolved/:siteId', AlertController.getResolvedAlertsHistory);

// PUT /api/alerts/resolve-by-type → resolve alerts by type
router.put('/resolve-by-type', AlertController.resolveAlertByType);

module.exports = router;
