const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all technicians
router.get('/technicians', async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }).select('-password');
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching technicians', error });
  }
});

module.exports = router;
