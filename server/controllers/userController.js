const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('assignedSites', 'site_reference name');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getAllTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }).populate('assignedSites', 'site_reference name');
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
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid technician ID' });
    }

    const technician = await User.findOne({ _id: id, role: 'technician' }).populate('assignedSites', 'site_reference name');
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    if (technician.isActive) {
      return res.status(400).json({ message: 'Technician is already active' });
    }

    technician.isActive = true;
    // Ensure assignedSites and previousAssignedSites are arrays
    technician.assignedSites = Array.isArray(technician.assignedSites) ? technician.assignedSites : [];
    technician.previousAssignedSites = Array.isArray(technician.previousAssignedSites) ? technician.previousAssignedSites : [];

    // Restore previousAssignedSites if they exist and are valid
    if (technician.previousAssignedSites.length > 0) {
      const validSites = technician.previousAssignedSites.filter(siteId =>
        mongoose.Types.ObjectId.isValid(siteId)
      );
      technician.assignedSites = validSites.map(siteId => new mongoose.Types.ObjectId(siteId));
      technician.previousAssignedSites = [];
    }

    console.log('Technician before save (activate):', {
      _id: technician._id,
      isActive: technician.isActive,
      assignedSites: technician.assignedSites,
      previousAssignedSites: technician.previousAssignedSites,
    });

    await technician.save();

    // Populate assignedSites for response
    const populatedTechnician = await User.findById(id).populate('assignedSites', 'site_reference name');

    res.status(200).json({
      message: 'Technician activated successfully',
      data: {
        _id: populatedTechnician._id,
        name: populatedTechnician.name,
        email: populatedTechnician.email,
        role: populatedTechnician.role,
        isActive: populatedTechnician.isActive,
        assignedSites: populatedTechnician.assignedSites,
        previousAssignedSites: populatedTechnician.previousAssignedSites,
      },
    });
  } catch (error) {
    console.error('Activation error:', {
      message: error.message,
      stack: error.stack,
      technicianId: req.params.id,
    });
    res.status(500).json({
      message: 'Server error during activation',
      error: error.message,
      details: error.name === 'ValidationError' ? Object.values(error.errors).map(e => e.message) : [error.message],
    });
  }
};

// Deactivate a technician
exports.deactivateTechnician = async (req, res) => {
  const { id } = req.params; // ✅ Move this here
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid technician ID" });
    }
    const technician = await User.findOne({ _id: id, role: "technician" });
    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }
    if (!technician.isActive) {
      return res.status(400).json({ message: "Technician is already inactive" });
    }

    technician.isActive = false;
    technician.previousAssignedSites = Array.isArray(technician.assignedSites)
      ? technician.assignedSites
          .filter((siteId) => mongoose.Types.ObjectId.isValid(siteId))
          .map((siteId) => siteId.toString())
      : [];
    technician.assignedSites = [];

    console.log("Technician before save (deactivate):", {
      _id: technician._id,
      isActive: technician.isActive,
      assignedSites: technician.assignedSites,
      previousAssignedSites: technician.previousAssignedSites,
    });

    await technician.save();

    res.status(200).json({ message: "Technician deactivated successfully" });
  } catch (error) {
    console.error("Deactivation error:", {
      message: error.message,
      stack: error.stack,
      technicianId: id, // ✅ Now it’s defined
    });
    res.status(500).json({
      message: "Server error during deactivation",
      error: error.message,
      details: error.name === "ValidationError" ? error.errors : error.stack,
    });
  }
};
