const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/AlertController');

// POST /api/alerts → create alert
router.post('/', AlertController.createAlert);

// GET /api/alerts → get all alerts
router.get('/', AlertController.getAllAlerts);

// GET /api/alerts/active/:siteId → get active alerts for a site
router.get('/active/:siteId', AlertController.getActiveAlertsBySite);

// PUT /api/alerts/resolve/:id → resolve an alert by ID
router.put('/resolve/:id', AlertController.resolveAlert);

// DELETE /api/alerts/:id → delete an alert by ID
router.delete('/:id', AlertController.deleteAlert);

// GET /api/alerts/history/:siteId → get alert history (active and resolved alerts)
router.get('/history/:siteId', AlertController.getAlertHistory);

// GET /api/alerts/resolved/:siteId → get resolved alerts for a site
router.get('/resolved/:siteId', AlertController.getResolvedAlerts);

// GET /api/alerts/resolved → get all resolved alerts
router.get('/resolved', AlertController.getAllResolvedAlerts);

// GET /api/alerts/history/resolved/:siteId → get resolved alerts history by siteId and optional date range
router.get('/history/resolved/:siteId', AlertController.getResolvedAlertsHistory);

// PUT /api/alerts/resolve-by-type → resolve alerts by type
router.put('/resolve-by-type', AlertController.resolveAlertByType);

// PUT /api/alerts/acknowledge/:id → acknowledge an alert by ID
router.put('/acknowledge/:id', AlertController.acknowledgeAlert);

module.exports = router;
