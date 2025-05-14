const Maintenance = require('../models/Maintenance');
const moment = require('moment');

// Add a maintenance record
const addMaintenance = async (req, res) => {
  try {
    const { equipmentId, description, performedBy, status, scheduledDate, scheduledTime } = req.body;

    if (!equipmentId || !description || !performedBy || !scheduledDate) {
      return res.status(400).json({
        message: 'equipmentId, description, performedBy, and scheduledDate are required',
      });
    }

    // Combine date and time if both are provided
    const scheduledAt = scheduledTime 
      ? new Date(`${scheduledDate}T${scheduledTime}`)
      : new Date(scheduledDate);

    const newMaintenance = new Maintenance({
      equipmentId,
      description,
      performedBy,
      scheduledDate: scheduledAt, // Store the combined date-time
      status: status || 'pending',
    });

    await newMaintenance.save();
    res.status(201).json(newMaintenance);
  } catch (err) {
    console.error('Add maintenance error:', err);
    res.status(500).json({
      message: 'Error creating maintenance',
      error: err.message,
    });
  }
};

// Get maintenance records by equipment ID
const getMaintenanceByEquipment = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const maintenance = await Maintenance.find({ equipmentId });

    res.status(200).json(maintenance);
  } catch (err) {
    console.error('Get maintenance by equipment error:', err);
    res.status(500).json({
      message: 'Error retrieving maintenance records',
      error: err.message,
    });
  }
};

// Get all maintenance records
const getAllMaintenances = async (req, res) => {
  try {
    const allMaintenances = await Maintenance.find();
    res.status(200).json(allMaintenances);
  } catch (err) {
    console.error('Get all maintenances error:', err);
    res.status(500).json({
      message: 'Error retrieving maintenance records',
      error: err.message,
    });
  }
};

// Update maintenance record
const updateMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Maintenance.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error('Update maintenance error:', err);
    res.status(500).json({
      message: 'Error updating maintenance',
      error: err.message,
    });
  }
};

// Delete maintenance record
const deleteMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Maintenance.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    res.status(200).json({ message: 'Maintenance record deleted successfully' });
  } catch (err) {
    console.error('Delete maintenance error:', err);
    res.status(500).json({
      message: 'Error deleting maintenance',
      error: err.message,
    });
  }
};


// Export all controller functions
module.exports = {
  addMaintenance,
  getMaintenanceByEquipment,
  getAllMaintenances,
  updateMaintenance,
  deleteMaintenance,
};
