const mongoose = require('mongoose');
const Intervention = require('../models/Intervention');
const Alert = require('../models/Alert');
const User = require('../models/User');

// Helper to check required fields
const checkRequired = (fields, res) => {
  for (const [key, value] of Object.entries(fields)) {
    if (!value) {
      res.status(400).json({ message: `${key} is required` });
      return false;
    }
  }
  return true;
};

// Resolve an intervention and update associated alert
exports.resolveIntervention = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes, validatedBy } = req.body;

    // Validate intervention ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid intervention ID format'
      });
    }

    // Validate required fields
    if (!checkRequired({ resolutionNotes, validatedBy }, res)) {
      return;
    }

    // Update intervention
    const intervention = await Intervention.findByIdAndUpdate(
      id,
      {
        status: 'completed',
        resolutionNotes,
        validatedBy,
        resolvedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate('technician', 'name email')
      .populate('createdBy', 'name email');

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found'
      });
    }

    // Check if intervention has an associated alert
    if (intervention.alertId && mongoose.isValidObjectId(intervention.alertId)) {
      try {
        const alert = await Alert.findByIdAndUpdate(
          intervention.alertId,
          {
            status: 'resolved',
            resolvedAt: new Date(),
          },
          { new: true, runValidators: true }
        );

        if (!alert) {
          // Rollback intervention update if alert not found
          await Intervention.findByIdAndUpdate(
            id,
            {
              status: 'planned', // Revert to original status (adjust based on your logic)
              resolutionNotes: null,
              validatedBy: null,
              resolvedAt: null,
            },
            { runValidators: true }
          );
          return res.status(404).json({
            success: false,
            message: 'Associated alert not found'
          });
        }
      } catch (alertError) {
        // Rollback intervention update on alert update error
        await Intervention.findByIdAndUpdate(
          id,
          {
            status: 'planned',
            resolutionNotes: null,
            validatedBy: null,
            resolvedAt: null,
          },
          { runValidators: true }
        );
        throw alertError;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Intervention resolved successfully',
      data: intervention
    });

  } catch (error) {
    console.error('Error resolving intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving intervention',
      error: error.message
    });
  }
};

// Other controller functions (unchanged, included for completeness)
exports.createIntervention = async (req, res) => {
  try {
    const {
      siteId,
      description,
      plannedDate,
      timeSlot,
      technician,
      createdBy,
      priority,
      status,
      resolutionNotes,
      resolvedAt,
      validatedBy,
      alertId
    } = req.body;

    // Basic input validation
    if (!siteId || !description || !plannedDate || !technician || !createdBy) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: siteId, description, plannedDate, technician, and createdBy are required'
      });
    }

    // Validate timeSlot format if provided
    if (timeSlot) {
      if (!timeSlot.start || !timeSlot.end) {
        return res.status(400).json({
          success: false,
          message: 'Both start and end times are required for timeSlot'
        });
      }
      // Basic time format validation (HH:mm)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(timeSlot.start) || !timeRegex.test(timeSlot.end)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time format in timeSlot. Use HH:mm format'
        });
      }
    }

    // Validate priority if provided
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority value. Must be low, medium, or high'
      });
    }

    // Validate status if provided
    if (status && !['planned', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be planned, in-progress, completed, or cancelled'
      });
    }

    // Validate alertId if provided
    if (alertId && !mongoose.isValidObjectId(alertId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alertId format'
      });
    }

    // Create new intervention
    const intervention = new Intervention({
      siteId,
      description,
      plannedDate: new Date(plannedDate),
      timeSlot,
      technician,
      createdBy,
      priority,
      status,
      resolutionNotes,
      resolvedAt: resolvedAt ? new Date(resolvedAt) : undefined,
      validatedBy,
      alertId,
      createdAt: new Date()
    });

    // Save intervention to database
    await intervention.save();

    res.status(201).json({
      success: true,
      message: 'Intervention created successfully',
      data: intervention
    });

  } catch (error) {
    console.error('Error creating intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating intervention',
      error: error.message
    });
  }
};

exports.getInterventionsByCreator = async (req, res) => {
  try {
    const { createdBy } = req.query;

    // Validate createdBy
    if (!createdBy) {
      return res.status(400).json({
        success: false,
        message: 'createdBy parameter is required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.isValidObjectId(createdBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid createdBy ID format'
      });
    }

    // Find interventions by createdBy
    const interventions = await Intervention.find({ createdBy })
      .populate('technician', 'name email')
      .populate('createdBy', 'name email');

    if (interventions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No interventions found for this creator'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Interventions retrieved successfully',
      data: interventions
    });

  } catch (error) {
    console.error('Error retrieving interventions:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving interventions',
      error: error.message
    });
  }
};

exports.getInterventionsByTechnician = async (req, res) => {
  try {
    const { technician } = req.query;

    // Validate technician
    if (!technician) {
      return res.status(400).json({
        success: false,
        message: 'technician parameter is required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.isValidObjectId(technician)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid technician ID format'
      });
    }

    // Find interventions by technician
    const interventions = await Intervention.find({ technician })
      .populate('technician', 'name email')
      .populate('createdBy', 'name email');

    if (interventions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No interventions found for this technician'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Interventions retrieved successfully',
      data: interventions
    });

  } catch (error) {
    console.error('Error retrieving interventions by technician:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving interventions',
      error: error.message
    });
  }
};

exports.updateInterventionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate intervention ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid intervention ID format'
      });
    }

    // Validate status
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    if (!['planned', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be planned, in-progress, completed, or cancelled'
      });
    }

    // Find and update intervention
    const updateData = {
      status,
      ...(status === 'completed' ? { resolvedAt: new Date() } : {}),
    };

    const intervention = await Intervention.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('technician', 'name email')
      .populate('createdBy', 'name email');

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Intervention status updated successfully',
      data: intervention
    });

  } catch (error) {
    console.error('Error updating intervention status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating intervention status',
      error: error.message
    });
  }
};

exports.deleteIntervention = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate intervention ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid intervention ID format'
      });
    }

    // Find and delete intervention
    const intervention = await Intervention.findByIdAndDelete(id);

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Intervention deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting intervention',
      error: error.message
    });
  }
};

exports.getInterventionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate intervention ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid intervention ID format',
      });
    }

    // Find intervention by ID
    const intervention = await Intervention.findById(id)
      .populate('technician', 'name email')
      .populate('createdBy', 'name email');

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Intervention retrieved successfully',
      data: intervention,
    });
  } catch (error) {
    console.error('Error retrieving intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving intervention',
      error: error.message,
    });
  }
};

exports.getInterventionsBySite = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { createdBy } = req.query;

    // Validate siteId
    if (!siteId) {
      return res.status(400).json({
        success: false,
        message: 'siteId parameter is required',
      });
    }

    // Validate createdBy if provided
    if (createdBy && !mongoose.isValidObjectId(createdBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid createdBy ID format',
      });
    }

    // Build query
    const query = { siteId };
    if (createdBy) {
      query.createdBy = createdBy;
    }

    // Find interventions
    const interventions = await Intervention.find(query)
      .populate('technician', 'name email')
      .populate('createdBy', 'name email');

    if (interventions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No interventions found for this site',
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Interventions for site retrieved successfully',
      data: interventions,
    });
  } catch (error) {
    console.error('Error retrieving interventions by site:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving interventions by site',
      error: error.message,
    });
  }
};

exports.getCompletedInterventions = async (req, res) => {
  try {
    const { createdBy } = req.query;

    // Validate createdBy
    if (!createdBy) {
      return res.status(400).json({
        success: false,
        message: 'createdBy parameter is required',
      });
    }

    // Validate ObjectId format
    if (!mongoose.isValidObjectId(createdBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid createdBy ID format',
      });
    }

    // Find completed interventions
    const interventions = await Intervention.find({ 
      createdBy, 
      status: 'completed' 
    })
      .populate('technician', 'name email')
      .populate('createdBy', 'name email')
      .sort({ resolvedAt: -1 }); // Sort by resolved date, newest first

    res.status(200).json({
      success: true,
      message: interventions.length 
        ? 'Completed interventions retrieved successfully'
        : 'No completed interventions found for this creator',
      data: interventions,
    });
  } catch (error) {
    console.error('Error retrieving completed interventions:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving completed interventions',
      error: error.message,
    });
  }
};

exports.getAllInterventions = async (req, res) => {
  try {
    const interventions = await Intervention.find()
      .populate('technician', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 }); // newest interventions first

    res.status(200).json({
      success: true,
      message: interventions.length
        ? 'All interventions retrieved successfully'
        : 'No interventions found',
      data: interventions,
    });
  } catch (error) {
    console.error('Error retrieving all interventions:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving all interventions',
      error: error.message,
    });
  }
};

exports.scheduleIntervention = async (req, res) => {
  try {
    const {
      siteId,
      description,
      plannedDate,
      timeSlot,
      technician,
      team,
      priority,
      alertId
    } = req.body;

    if (!checkRequired({ siteId, description, plannedDate }, res)) return;

    // Validate alertId if provided
    if (alertId && !mongoose.isValidObjectId(alertId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alertId format'
      });
    }

    const newIntervention = new Intervention({
      siteId,
      description,
      plannedDate: new Date(plannedDate),
      timeSlot,
      technician,
      team,
      priority,
      alertId,
      createdBy: req.body.createdBy // Assuming createdBy is provided in the body
    });

    await newIntervention.save();
    res.status(201).json({
      success: true,
      message: 'Intervention scheduled successfully',
      data: newIntervention
    });
  } catch (error) {
    console.error('Error scheduling intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling intervention',
      error: error.message
    });
  }
};

exports.uploadImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrls } = req.body;

    if (!Array.isArray(imageUrls)) {
      return res.status(400).json({ 
        success: false,
        message: 'imageUrls must be an array' 
      });
    }

    const intervention = await Intervention.findByIdAndUpdate(
      id,
      { $push: { images: { $each: imageUrls } } },
      { new: true }
    );

    if (!intervention) return res.status(404).json({ 
      success: false,
      message: 'Intervention not found' 
    });

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: intervention
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error uploading images', 
      error: error.message 
    });
  }
};