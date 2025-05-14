// map.routes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Default GNS3 server (adjust as needed)
const GNS3_SERVER = process.env.GNS3_SERVER || 'http://localhost:3080';

// GET /api/projects/:projectId/nodes
router.get('/api/projects/:projectId/nodes', async (req, res) => {
  try {
    const response = await axios.get(`${GNS3_SERVER}/v2/projects/${req.params.projectId}/nodes`);
    res.json(response.data); // Sends nodes data to frontend
  } catch (error) {
    console.error('Error fetching nodes:', error.message);
    res.status(error.response?.status || 500).json({ message: error.message });
  }
});

// GET /api/projects/:projectId/links
router.get('/api/projects/:projectId/links', async (req, res) => {
  try {
    const response = await axios.get(`${GNS3_SERVER}/v2/projects/${req.params.projectId}/links`);
    res.json(response.data); // Sends links data to frontend
  } catch (error) {
    console.error('Error fetching links:', error.message);
    res.status(error.response?.status || 500).json({ message: error.message });
  }
});

module.exports = router;
