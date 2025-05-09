const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const Report = require('../models/Report');

// Generate a new report
router.post('/generate', ReportController.generateReport);

// Get all reports for a specific site
router.get('/:siteId', async (req, res) => {
  try {
    const reports = await Report.find({ siteId: req.params.siteId }).sort({ generatedAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reports for a site within a specific date range
router.get('/date-range/:siteId', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate || isNaN(new Date(fromDate)) || isNaN(new Date(toDate))) {
      return res.status(400).json({ error: 'Invalid or missing date range' });
    }

    const reports = await Report.find({
      siteId: req.params.siteId,
      fromDate: { $lte: new Date(toDate) },
      toDate: { $gte: new Date(fromDate) },
    }).sort({ generatedAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific report by ID
router.get('/report/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a report by ID
router.delete('/:id', async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
