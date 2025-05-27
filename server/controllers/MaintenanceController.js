const mongoose = require('mongoose');
const Maintenance = require('../models/Maintenance');
const User = require('../models/User');

// @route   POST /api/maintenance
// @access  Private
const addMaintenance = async (req, res) => {
  try {
    const { equipmentId, description, performedBy, status, scheduledDate, scheduledTime } = req.body;

    // Validate required fields
    if (!equipmentId || !description || !performedBy || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'equipmentId, description, performedBy, and scheduledDate are required',
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipmentId format',
      });
    }
    if (!mongoose.Types.ObjectId.isValid(performedBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid technician ID format',
      });
    }

    // Validate technician
    const technician = await User.findOne({ _id: performedBy, role: 'technician' });
    if (!technician) {
      return res.status(400).json({
        success: false,
        message: 'Technician not found or not a technician',
      });
    }

    // Validate date and time formats
    const isValidDateFormat = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);
    const isValidTimeFormat = (time) => /^\d{2}:\d{2}:\d{2}$/.test(time);

    if (!isValidDateFormat(scheduledDate)) {
      return res.status(400).json({
        success: false,
        message: 'scheduledDate must be in YYYY-MM-DD format',
      });
    }
    if (scheduledTime && !isValidTimeFormat(scheduledTime)) {
      return res.status(400).json({
        success: false,
        message: 'scheduledTime must be in HH:mm:ss format',
      });
    }

    // Combine date and time in CET
    let performedAt = null;
    if (scheduledTime) {
      performedAt = new Date(`${scheduledDate}T${scheduledTime}+02:00`);
      if (isNaN(performedAt.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date or time format',
        });
      }
    }

    const newMaintenance = await Maintenance.create({
      equipmentId,
      description,
      performedBy,
      status: status && ['pending', 'in progress', 'completed'].includes(status) ? status : 'pending',
      scheduledDate: new Date(`${scheduledDate}T00:00:00+02:00`),
      scheduledTime: scheduledTime || '',
      performedAt: status === 'completed' ? performedAt || new Date() : null,
    });

    const populatedMaintenance = await Maintenance.findById(newMaintenance._id)
      .populate('equipmentId', 'name type serialNumber')
      .populate('performedBy', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedMaintenance,
    });
  } catch (error) {
    console.error('Add maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating maintenance',
      error: error.message,
    });
  }
};

// @route   GET /api/maintenance
// @access  Private
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
// @desc    Get maintenance records by equipment ID
// @route   GET /api/maintenance/equipment/:equipmentId
// @access  Private
const getMaintenanceByEquipment = async (req, res) => {
  try {
    const { equipmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipmentId format',
      });
    }

    const maintenances = await Maintenance.find({ equipmentId })
      .populate('equipmentId', 'name type serialNumber')
      .populate('performedBy', 'name email')
      .sort({ scheduledDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: maintenances.length,
      data: maintenances,
    });
  } catch (error) {
    console.error('Get maintenance by equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving maintenance records',
      error: error.message,
    });
  }
};

// @desc    Update a maintenance record by ID
// @route   PUT /api/maintenance/:id
// @access  Private
const updateMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { equipmentId, description, performedBy, status, scheduledDate, scheduledTime } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid maintenance ID format',
      });
    }

    // Validate at least one field is provided
    if (!equipmentId && !description && !performedBy && !status && !scheduledDate && !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update',
      });
    }

    const updatedFields = {};

    // Validate and set equipmentId
    if (equipmentId) {
      if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid equipmentId format',
        });
      }
      updatedFields.equipmentId = equipmentId;
    }

    // Validate and set description
    if (description) {
      if (description.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Description must be at least 5 characters',
        });
      }
      updatedFields.description = description;
    }

    // Validate and set performedBy
    if (performedBy) {
      if (!mongoose.Types.ObjectId.isValid(performedBy)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid technician ID format',
        });
      }
      const technician = await User.findOne({ _id: performedBy, role: 'technician' });
      if (!technician) {
        return res.status(400).json({
          success: false,
          message: 'Technician not found or not a technician',
        });
      }
      updatedFields.performedBy = performedBy;
    }

    // Validate and set status
    if (status) {
      if (!['pending', 'in progress', 'completed'].includes(status)) {
        return res.status(400).json({
          success: false,
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
          success: false,
          message: 'scheduledDate must be in YYYY-MM-DD format',
        });
      }
      if (scheduledTime && !isValidTimeFormat(scheduledTime)) {
        return res.status(400).json({
          success: false,
          message: 'scheduledTime must be in HH:mm:ss format',
        });
      }

      updatedFields.scheduledDate = new Date(`${scheduledDate}T00:00:00+02:00`);
      if (scheduledTime) {
        const performedAt = new Date(`${scheduledDate}T${scheduledTime}+02:00`);
        if (isNaN(performedAt.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid date or time format',
          });
        }
        updatedFields.performedAt = performedAt;
        updatedFields.scheduledTime = scheduledTime;
      } else {
        updatedFields.scheduledTime = '';
      }
    }

    const updated = await Maintenance.findByIdAndUpdate(id, updatedFields, {
      new: true,
      runValidators: true,
    })
      .populate('equipmentId', 'name type serialNumber')
      .populate('performedBy', 'name email')
      .lean();

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating maintenance',
      error: error.message,
    });
  }
};

// @desc    Delete a maintenance record by ID
// @route   DELETE /api/maintenance/:id
// @access  Private
const deleteMaintenance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid maintenance ID format',
      });
    }

    const deleted = await Maintenance.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Maintenance record deleted successfully',
    });
  } catch (error) {
    console.error('Delete maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting maintenance',
      error: error.message,
    });
  }
};

// @desc    Get maintenance task by ID
// @route   GET /api/maintenance/:id
// @access  Private
const getMaintenanceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid maintenance ID format',
      });
    }

    const maintenance = await Maintenance.findById(id)
      .populate('equipmentId', 'name type serialNumber')
      .populate('performedBy', 'name email')
      .lean();

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance task not found',
      });
    }

    res.status(200).json({
      success: true,
      data: maintenance,
    });
  } catch (error) {
    console.error('Get maintenance by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving maintenance task',
      error: error.message,
    });
  }
};

// @desc    Get maintenance tasks by technician ID
// @route   GET /api/maintenance/technician/:technicianId
// @access  Private
const getMaintenanceByTechnicianById = async (req, res) => {
  try {
    const { technicianId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(technicianId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid technician ID format',
      });
    }

    const technician = await User.findOne({ _id: technicianId, role: 'technician' });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found or not a technician',
      });
    }

    const maintenanceRecords = await Maintenance.find({ performedBy: technicianId })
      .populate('equipmentId', 'name type serialNumber')
      .populate('performedBy', 'name email')
      .sort({ scheduledDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: maintenanceRecords.length,
      data: maintenanceRecords,
    });
  } catch (error) {
    console.error('Get maintenance by technician error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving maintenance records',
      error: error.message,
    });
  }
};

const resolveMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid maintenance ID format',
      });
    }

    const maintenance = await Maintenance.findById(id);
    
    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance task not found',
      });
    }

    if (maintenance.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Maintenance task is already completed',
      });
    }

    maintenance.status = 'completed';
    maintenance.performedAt = new Date();
    if (resolutionNotes) {
      maintenance.resolutionNotes = resolutionNotes;
    }
    
    await maintenance.save();

    const populatedMaintenance = await Maintenance.findById(id)
      .populate('equipmentId', 'name type serialNumber')
      .populate('performedBy', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Maintenance task resolved successfully',
      data: populatedMaintenance,
    });
  } catch (error) {
    console.error('Resolve maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving maintenance task',
      error: error.message,
    });
  }
};

module.exports = {
  addMaintenance,
  getAllMaintenances,
  getMaintenanceByEquipment,
  updateMaintenance,
  deleteMaintenance,
  getMaintenanceById,
  getMaintenanceByTechnicianById,
  resolveMaintenance,
};