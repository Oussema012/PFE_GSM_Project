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



// hethom tnjm tfasa5ohom , zedthom jdid 
// Activate a technician
exports.activateTechnician = async (req, res) => {
  try {
    // Check if the requesting user is an engineer or admin
    if (!['engineer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: "Only engineers or admins can activate technicians" });
    }

    const technician = await User.findOne({ _id: req.params.id, role: 'technician' });
    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    if (technician.isActive) {
      return res.status(400).json({ message: "Technician is already active" });
    }

    technician.isActive = true;
    // Restore previous assignedSites if they exist
    if (technician.previousAssignedSites && technician.previousAssignedSites.length > 0) {
      technician.assignedSites = [...technician.previousAssignedSites];
      // Optionally clear previousAssignedSites after restoration
      technician.previousAssignedSites = [];
    }
    await technician.save();

    res.status(200).json({
      message: "Technician activated successfully",
      data: technician,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while activating technician",
      error,
    });
  }
};
// Deactivate a technician
exports.deactivateTechnician = async (req, res) => {
  try {
    // Check if the requesting user is an engineer or admin
    if (!['engineer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: "Only engineers or admins can deactivate technicians" });
    }

    const technician = await User.findOne({ _id: req.params.id, role: 'technician' });
    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    if (!technician.isActive) {
      return res.status(400).json({ message: "Technician is already deactivated" });
    }

    // Save current assignedSites to previousAssignedSites
    technician.previousAssignedSites = [...technician.assignedSites];
    technician.isActive = false;
    // Remove all privileges by clearing assignedSites
    technician.assignedSites = [];
    await technician.save();

    res.status(200).json({
      message: "Technician deactivated successfully",
      data: technician,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while deactivating technician",
      error,
    });
  }
};

