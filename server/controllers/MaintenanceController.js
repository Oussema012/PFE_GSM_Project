const mongoose = require('mongoose');
const Maintenance = require('../models/Maintenance');
const User = require('../models/User');

// Add a maintenance record
const addMaintenance = async (req, res) => {
  try {
    const { equipmentId, description, performedBy, status, scheduledDate, scheduledTime } = req.body;

    // Validate required fields
    if (!equipmentId || !description || !performedBy || !scheduledDate) {
      return res.status(400).json({
        message: 'equipmentId, description, performedBy, and scheduledDate are required',
      });
    }

    // Validate equipmentId
    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        message: 'Invalid equipmentId format',
      });
    }

    // Validate performedBy as ObjectId and technician
    if (!mongoose.Types.ObjectId.isValid(performedBy)) {
      return res.status(400).json({
        message: 'Invalid technician ID format',
      });
    }
    const technician = await User.findOne({ _id: performedBy, role: 'technician' });
    if (!technician) {
      return res.status(400).json({
        message: 'Technician not found or not a technician',
      });
    }

    // Validate date and time formats
    const isValidDateFormat = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);
    const isValidTimeFormat = (time) => /^\d{2}:\d{2}:\d{2}$/.test(time);

    if (!isValidDateFormat(scheduledDate)) {
      return res.status(400).json({
        message: 'scheduledDate must be in YYYY-MM-DD format',
      });
    }
    if (scheduledTime && !isValidTimeFormat(scheduledTime)) {
      return res.status(400).json({
        message: 'scheduledTime must be in HH:mm:ss format',
      });
    }

    // Combine date and time in CET
    let performedAt;
    try {
      performedAt = scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}+02:00`) // Explicitly CET
        : new Date(`${scheduledDate}T00:00:00+02:00`);
      if (isNaN(performedAt.getTime())) {
        return res.status(400).json({ message: 'Invalid date or time format' });
      }
    } catch (error) {
      return res.status(400).json({
        message: 'Error parsing date or time',
        error: error.message,
      });
    }

    const newMaintenance = new Maintenance({
      equipmentId,
      description,
      performedBy,
      scheduledDate: new Date(`${scheduledDate}T00:00:00+02:00`), // Store date in CET
      performedAt: performedAt || null,
      status: status && ['pending', 'in progress', 'completed'].includes(status) ? status : 'pending',
    });

    await newMaintenance.save();
    const populatedMaintenance = await Maintenance.findById(newMaintenance._id)
      .populate('equipmentId', 'name')
      .populate('performedBy', 'name');
    res.status(201).json(populatedMaintenance);
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
    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        message: 'Invalid equipmentId format',
      });
    }
    const maintenance = await Maintenance.find({ equipmentId })
      .populate('equipmentId', 'name')
      .populate('performedBy', 'name')
      .sort({ performedAt: -1 });

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
    const allMaintenances = await Maintenance.find()
      .populate('equipmentId', 'name')
      .populate('performedBy', 'name')
      .sort({ performedAt: -1 });

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
    const { equipmentId, description, performedBy, status, scheduledDate, scheduledTime } = req.body;

    // Validate at least one field is provided
    if (!equipmentId && !description && !performedBy && !status && !scheduledDate && !scheduledTime) {
      return res.status(400).json({
        message: 'At least one field must be provided for update',
      });
    }

    const updatedFields = {};

    // Validate and set equipmentId
    if (equipmentId) {
      if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
        return res.status(400).json({
          message: 'Invalid equipmentId format',
        });
      }
      updatedFields.equipmentId = equipmentId;
    }

    // Validate and set description
    if (description) {
      if (description.length < 5) {
        return res.status(400).json({
          message: 'Description must be at least 5 characters',
        });
      }
      updatedFields.description = description;
    }

    // Validate and set performedBy
    if (performedBy) {
      if (!mongoose.Types.ObjectId.isValid(performedBy)) {
        return res.status(400).json({
          message: 'Invalid technician ID format',
        });
      }
      const technician = await User.findOne({ _id: performedBy, role: 'technician' });
      if (!technician) {
        return res.status(400).json({
          message: 'Technician not found or not a technician',
        });
      }
      updatedFields.performedBy = performedBy;
    }

    // Validate and set status
    if (status) {
      if (!['pending', 'in progress', 'completed'].includes(status)) {
        return res.status(400).json({
          message: 'Status must be pending, in progress, or completed',
        });
      }
      updatedFields.status = status;
    }

    // Validate and set scheduledDate and performedAt
    if (scheduledDate) {
      const isValidDateFormat = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);
      const isValidTimeFormat = (time) => /^\d{2}:\d{2}:\d{2}$/.test(time);

      if (!isValidDateFormat(scheduledDate)) {
        return res.status(400).json({
          message: 'scheduledDate must be in YYYY-MM-DD format',
        });
      }
      if (scheduledTime && !isValidTimeFormat(scheduledTime)) {
        return res.status(400).json({
          message: 'scheduledTime must be in HH:mm:ss format',
        });
      }

      try {
        const performedAt = scheduledTime
          ? new Date(`${scheduledDate}T${scheduledTime}+02:00`) // Explicitly CET
          : new Date(`${scheduledDate}T00:00:00+02:00`);
        if (isNaN(performedAt.getTime())) {
          return res.status(400).json({ message: 'Invalid date or time format' });
        }
        updatedFields.scheduledDate = new Date(`${scheduledDate}T00:00:00+02:00`);
        updatedFields.performedAt = performedAt;
      } catch (error) {
        return res.status(400).json({
          message: 'Error parsing date or time',
          error: error.message,
        });
      }
    }

    const updated = await Maintenance.findByIdAndUpdate(id, updatedFields, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    const populatedUpdated = await Maintenance.findById(id)
      .populate('equipmentId', 'name')
      .populate('performedBy', 'name');
    res.status(200).json(populatedUpdated);
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid maintenance ID format',
      });
    }
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

module.exports = {
  addMaintenance,
  getMaintenanceByEquipment,
  getAllMaintenances,
  updateMaintenance,
  deleteMaintenance,
};
