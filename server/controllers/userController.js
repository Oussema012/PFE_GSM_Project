const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); // fetch all users
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all technicians only
exports.getAllTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' });
    res.status(200).json({ success: true, data: technicians });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};


// Get one technician by ID
exports.getTechnicianById = async (req, res) => {
  try {
    const technician = await User.findOne({ _id: req.params.id, role: 'technician' });
    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }
    res.status(200).json(technician);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
exports.signout = (req, res) => {
  // This depends on how you handle authentication (JWT, sessions, etc.)
  // Here's a basic example assuming session-based auth:

  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: "Error signing out" });
      } else {
        return res.status(200).json({ message: "Signed out successfully" });
      }
    });
  } else {
    res.status(200).json({ message: "No active session found" });
  }
};