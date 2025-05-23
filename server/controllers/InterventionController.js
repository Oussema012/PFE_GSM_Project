const mongoose = require('mongoose');
const Intervention = require('../models/Intervention');
const User = require('../models/User'); // Make sure you have this

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

// Create a new intervention
exports.createIntervention = async (req, res) => {
  try {
    const { siteId, description, plannedDate } = req.body;
    if (!checkRequired({ siteId, description, plannedDate }, res)) return;

    const intervention = new Intervention(req.body);
    await intervention.save();
    res.status(201).json(intervention);
  } catch (error) {
    console.error('Error creating intervention:', error);
    res.status(500).json({ message: 'Error creating intervention', error: error.message });
  }
};

// Resolve an intervention
exports.resolveIntervention = async (req, res) => {
  try {
    const { resolutionNotes, validatedBy } = req.body;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid intervention ID' });
    }

    const intervention = await Intervention.findByIdAndUpdate(
      id,
      {
        status: 'completed',
        resolutionNotes,
        validatedBy,
        resolvedAt: new Date(),
      },
      { new: true }
    );

    if (!intervention) return res.status(404).json({ message: 'Intervention not found' });

    res.json(intervention);
  } catch (error) {
    console.error('Error resolving intervention:', error);
    res.status(500).json({ message: 'Error resolving intervention', error: error.message });
  }
};

// Get all interventions for a site
exports.getInterventionsBySite = async (req, res) => {
  try {
    const { siteId } = req.params;
    if (!siteId) return res.status(400).json({ message: 'siteId is required' });

    const interventions = await Intervention.find({ siteId }).sort({ plannedDate: 1 });
    res.json(interventions);
  } catch (error) {
    console.error('Error retrieving interventions by site:', error);
    res.status(500).json({ message: 'Error retrieving interventions', error: error.message });
  }
};

// Get intervention by ID
exports.getInterventionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid ID' });

    const intervention = await Intervention.findById(id);
    if (!intervention) return res.status(404).json({ message: 'Intervention not found' });

    res.json(intervention);
  } catch (error) {
    console.error('Error retrieving intervention:', error);
    res.status(500).json({ message: 'Error retrieving intervention', error: error.message });
  }
};

// Update intervention status or notes
exports.updateInterventionStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { id } = req.params;

    if (!status && !notes)
      return res.status(400).json({ message: 'At least one of status or notes is required' });

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid ID' });

    const intervention = await Intervention.findByIdAndUpdate(
      id,
      { ...(status && { status }), ...(notes && { notes }) },
      { new: true }
    );

    if (!intervention) return res.status(404).json({ message: 'Intervention not found' });

    res.json(intervention);
  } catch (error) {
    console.error('Error updating intervention status:', error);
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
};

// Delete intervention
exports.deleteIntervention = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid ID' });

    const intervention = await Intervention.findByIdAndDelete(id);
    if (!intervention) return res.status(404).json({ message: 'Intervention not found' });

    res.json({ message: 'Intervention deleted successfully' });
  } catch (error) {
    console.error('Error deleting intervention:', error);
    res.status(500).json({ message: 'Error deleting intervention', error: error.message });
  }
};

// Get completed interventions (history)
exports.getCompletedInterventions = async (req, res) => {
  try {
    const { technicianId } = req.query;
    const query = { status: 'completed' };
    if (technicianId) query.technicianId = String(technicianId);

    const completed = await Intervention.find(query).sort({ resolvedAt: -1 });
    res.json(completed);
  } catch (error) {
    console.error('Error fetching completed interventions:', error);
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
};

// Schedule intervention
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
    } = req.body;

    if (!checkRequired({ siteId, description, plannedDate }, res)) return;

    const newIntervention = new Intervention({
      siteId,
      description,
      plannedDate,
      timeSlot,
      technician,
      team,
      priority,
    });

    await newIntervention.save();
    res.status(201).json(newIntervention);
  } catch (error) {
    console.error('Error scheduling intervention:', error);
    res.status(500).json({ message: 'Error scheduling intervention', error: error.message });
  }
};

// Get interventions by technician with filters
exports.getInterventionsByTechnician = async (req, res) => {
  try {
    const { technicianId, status, priority, dateFrom, dateTo } = req.query;

    if (!technicianId || technicianId === 'null') {
      return res.status(400).json({ message: 'Valid technicianId is required' });
    }

    const query = { technicianId: String(technicianId) };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (dateFrom || dateTo) {
      query.plannedDate = {};
      if (dateFrom) query.plannedDate.$gte = new Date(dateFrom);
      if (dateTo) query.plannedDate.$lte = new Date(dateTo);
    }

    const interventions = await Intervention.find(query).sort({ plannedDate: 1 });
    res.json(interventions);
  } catch (error) {
    console.error('Error fetching interventions by technician:', error);
    res.status(500).json({ message: 'Error fetching interventions', error: error.message });
  }
};

// Upload intervention images
exports.uploadImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrls } = req.body;

    if (!Array.isArray(imageUrls)) {
      return res.status(400).json({ message: 'imageUrls must be an array' });
    }

    const intervention = await Intervention.findByIdAndUpdate(
      id,
      { $push: { images: { $each: imageUrls } } },
      { new: true }
    );

    if (!intervention) return res.status(404).json({ message: 'Intervention not found' });

    res.json(intervention);
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ message: 'Error uploading images', error: error.message });
  }
};
