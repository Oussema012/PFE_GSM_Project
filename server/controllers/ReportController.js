const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { generateStatsCharts } = require('./chartGeneration');
const Report = require('../models/Report');
const axios = require('axios'); // Ensure axios is installed

const API_BASE_URL = 'http://localhost:8000'; // Match your API base URL

exports.generateReport = async (req, res) => {
  try {
    const { siteId, fromDate, toDate, reportType = 'summary', generatedBy = 'system' } = req.body;

    if (!siteId || !fromDate || !toDate) {
      return res.status(400).json({ message: 'Missing required parameters.' });
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format.' });
    }

    if (toDate.length <= 10) {
      endDate.setHours(23, 59, 59, 999);
    }

    // Check if report already exists
    const existingReport = await Report.findOne({
      siteId,
      fromDate: startDate,
      toDate: endDate,
      reportType
    });

    if (existingReport) {
      return res.status(400).json({ message: 'Report already exists for this range and type.' });
    }

    // Fetch data from APIs
    const alertsResponse = await axios.get(`${API_BASE_URL}/api/alerts/history/${siteId}`, {
      params: { fromDate, toDate }
    });
    const interventionsResponse = await axios.get(`${API_BASE_URL}/api/interventions/site/${siteId}`, {
      params: { fromDate, toDate }
    });
    const maintenanceResponse = await axios.get(`${API_BASE_URL}/api/maintenances/equipment/${siteId}`, {
      params: { fromDate, toDate }
    });

    const alerts = alertsResponse.data;
    const interventions = interventionsResponse.data;
    const maintenanceRecords = maintenanceResponse.data;

    // Calculate statistics
    const alertStats = {
      total: alerts.length,
      active: alerts.filter(a => a.status === 'active').length,
      resolved: alerts.filter(a => a.status === 'resolved').length
    };

    const interventionTypes = {};
    let totalDuration = 0;
    interventions.forEach(intervention => {
      const type = intervention.type || 'unknown';
      interventionTypes[type] = (interventionTypes[type] || 0) + 1;
      totalDuration += intervention.duration || 0;
    });

    const interventionStats = {
      total: interventions.length,
      averageDuration: interventions.length > 0 ? totalDuration / interventions.length : 0,
      byType: interventionTypes
    };

    const maintenanceTypes = {};
    maintenanceRecords.forEach(record => {
      const type = record.type || 'unknown';
      maintenanceTypes[type] = (maintenanceTypes[type] || 0) + 1;
    });

    const maintenanceStats = {
      total: maintenanceRecords.length,
      completed: maintenanceRecords.filter(m => m.status === 'completed').length,
      scheduled: maintenanceRecords.filter(m => m.status === 'scheduled').length,
      byType: maintenanceTypes
    };

    // Save the report record
    const report = new Report({
      siteId,
      reportType,
      fromDate: startDate,
      toDate: endDate,
      generatedBy,
      data: { alertStats, interventionStats, maintenanceStats }
    });
    await report.save();

    // Generate charts
    const { alertBarChart, interventionLineChart, maintenancePieChart } = await generateStatsCharts({
      alertStats,
      interventionStats,
      maintenanceStats
    });

    // Handle PDF generation
    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

    const safeDate = new Date().toISOString().split('T')[0];
    const fileName = `report_${siteId}_${safeDate}_${report._id}.pdf`.replace(/[:\/\\?<>|"]/g, '');
    const filePath = path.join(reportsDir, fileName);

    const doc = new PDFDocument({ autoFirstPage: false, margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    let currentPage = 1;
    const totalPages = (alerts.length > 0 ? 1 : 0) + (interventions.length > 0 ? 1 : 0) + (maintenanceRecords.length > 0 ? 1 : 0) + 1;

    const addFooter = () => {
      doc.fontSize(8).text(`Page ${currentPage} of ${totalPages}`, 50, doc.page.height - 40, { align: 'center' });
    };

    const addNewPage = () => {
      doc.addPage();
      addFooter();
      currentPage++;
    };

    // Summary page
    doc.addPage();
    doc.fontSize(20).text(`Site Report: ${siteId}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12)
      .text(`Report Type: ${reportType}`)
      .text(`Date Range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`)
      .text(`Generated By: ${generatedBy}`)
      .text(`Generated On: ${new Date().toLocaleString()}`)
      .moveDown();

    doc.fontSize(16).text('Alert Statistics', { underline: true }).moveDown(0.5);
    doc.fontSize(12)
      .text(`Total Alerts: ${alertStats.total}`)
      .text(`Active Alerts: ${alertStats.active}`)
      .text(`Resolved Alerts: ${alertStats.resolved}`)
      .moveDown();

    doc.fontSize(16).text('Intervention Statistics', { underline: true }).moveDown(0.5);
    doc.fontSize(12)
      .text(`Total Interventions: ${interventionStats.total}`)
      .text(`Average Duration: ${interventionStats.averageDuration.toFixed(2)} minutes`);
    Object.entries(interventionStats.byType).forEach(([type, count]) => {
      doc.text(`${type}: ${count}`);
    });
    doc.moveDown();

    doc.fontSize(16).text('Maintenance Statistics', { underline: true }).moveDown(0.5);
    doc.fontSize(12)
      .text(`Total Maintenance Activities: ${maintenanceStats.total}`)
      .text(`Completed: ${maintenanceStats.completed}`)
      .text(`Scheduled: ${maintenanceStats.scheduled}`);
    Object.entries(maintenanceStats.byType).forEach(([type, count]) => {
      doc.text(`${type}: ${count}`);
    });
    doc.moveDown();

    doc.image(alertBarChart, { fit: [500, 280], align: 'center' }).moveDown();
    doc.image(interventionLineChart, { fit: [500, 280], align: 'center' }).moveDown();
    doc.image(maintenancePieChart, { fit: [500, 280], align: 'center' }).moveDown();

    // Add images from temp directory
    const tempDir = path.join(__dirname, '..', 'temp');
    const imageFiles = ['image1.jpg', 'image2.png']; // Adjust filenames as needed
    imageFiles.forEach((imageFile, index) => {
      const imagePath = path.join(tempDir, imageFile);
      if (fs.existsSync(imagePath)) {
        doc.addPage();
        doc.image(imagePath, { fit: [500, 280], align: 'center' });
        addFooter();
      } else {
        console.warn(`Image ${imageFile} not found at ${imagePath}`);
      }
    });

    // Detailed pages
    if (alerts.length > 0) {
      addNewPage();
      doc.fontSize(16).text('Alert Details', { underline: true }).moveDown();
      alerts.forEach((alert, index) => {
        doc.fontSize(12).text(`Alert #${index + 1}: ${alert.message || 'Untitled'}`);
        doc.fontSize(10)
          .text(`ID: ${alert._id}`)
          .text(`Status: ${alert.status}`)
          .text(`Site ID: ${alert.siteId}`)
          .text(`Timestamp: ${alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'N/A'}`)
          .text(`Created At: ${alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'N/A'}`)
          .text(`Resolved At: ${alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : 'N/A'}`)
          .moveDown();
      });
      addFooter();
    }

    if (interventions.length > 0) {
      addNewPage();
      doc.fontSize(16).text('Intervention Details', { underline: true }).moveDown();
      interventions.forEach((intervention, index) => {
        doc.fontSize(12).text(`Intervention #${index + 1}: ${intervention.description || 'Untitled'}`);
        doc.fontSize(10)
          .text(`ID: ${intervention._id}`)
          .text(`Type: ${intervention.type || 'N/A'}`)
          .text(`Duration: ${intervention.duration ? intervention.duration + ' minutes' : 'N/A'}`)
          .text(`Created At: ${intervention.createdAt ? new Date(intervention.createdAt).toLocaleString() : 'N/A'}`)
          .moveDown();
      });
      addFooter();
    }

    if (maintenanceRecords.length > 0) {
      addNewPage();
      doc.fontSize(16).text('Maintenance Details', { underline: true }).moveDown();
      maintenanceRecords.forEach((maintenance, index) => {
        doc.fontSize(12).text(`Maintenance #${index + 1}: ${maintenance.description || 'Untitled'}`);
        doc.fontSize(10)
          .text(`ID: ${maintenance._id}`)
          .text(`Type: ${maintenance.type}`)
          .text(`Status: ${maintenance.status}`)
          .text(`Created At: ${maintenance.createdAt ? new Date(maintenance.createdAt).toLocaleString() : 'N/A'}`)
          .text(`Completed At: ${maintenance.completedAt ? new Date(maintenance.completedAt).toLocaleString() : 'N/A'}`)
          .moveDown();
      });
      addFooter();
    }

    doc.end();

    stream.on('finish', () => {
      res.status(201).json({
        message: 'Report generated successfully.',
        filePath,
        report,
        alertCount: alerts.length,
        interventionCount: interventions.length,
        maintenanceCount: maintenanceRecords.length
      });
    });

    stream.on('error', (err) => {
      console.error('PDF stream error:', err);
      res.status(500).json({ error: 'Error writing PDF file: ' + err.message });
    });

  } catch (err) {
    console.error('Report generation error:', err);
    if (err.response) {
      res.status(err.response.status).json({ error: `API error: ${err.response.data.message || err.message}` });
    } else {
      res.status(500).json({ error: 'Internal server error: ' + err.message });
    }
  }
};