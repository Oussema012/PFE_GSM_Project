const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const Report = require('../models/Report');

// Route to generate a new report
router.post('/generate', ReportController.generateReport);

// Optional: get saved reports for a site
router.get('/:siteId', async (req, res) => {
  try {
    const reports = await Report.find({ siteId: req.params.siteId });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: get a report by siteId and specific date range
router.get('/date-range/:siteId', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const reports = await Report.find({
      siteId: req.params.siteId,
      fromDate: { $gte: new Date(fromDate) },
      toDate: { $lte: new Date(toDate) },
    });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
