const Intervention = require('../models/Intervention');

// Create a new intervention
exports.createIntervention = async (req, res) => {
  try {
    const intervention = new Intervention(req.body);
    await intervention.save();
    res.status(201).json(intervention);
  } catch (error) {
    res.status(500).json({ message: 'Error creating intervention', error });
  }
};
exports.resolveIntervention = async (req, res) => {
  try {
    const { resolutionNotes, validatedBy } = req.body;

    const intervention = await Intervention.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        resolutionNotes,
        validatedBy,
        resolvedAt: new Date()
      },
      { new: true }
    );

    if (!intervention) {
      return res.status(404).json({ message: 'Intervention not found' });
    }

    res.json(intervention);
  } catch (error) {
    res.status(500).json({ message: 'Error resolving intervention', error });
  }
};

// Get all interventions for a site
exports.getInterventionsBySite = async (req, res) => {
  try {
    const { siteId } = req.params;
    const interventions = await Intervention.find({ siteId }).sort({ plannedDate: 1 });
    res.json(interventions);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving interventions', error });
  }
};

// Get a single intervention by ID
exports.getInterventionById = async (req, res) => {
  try {
    const intervention = await Intervention.findById(req.params.id);
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention not found' });
    }
    res.json(intervention);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving intervention', error });
  }
};

// Update intervention status
exports.updateInterventionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const intervention = await Intervention.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention not found' });
    }
    res.json(intervention);
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error });
  }
};

// Delete an intervention
exports.deleteIntervention = async (req, res) => {
  try {
    const deleted = await Intervention.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Intervention not found' });
    }
    res.json({ message: 'Intervention deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting intervention', error });
  }
};
// Get completed interventions (historical data)
exports.getCompletedInterventions = async (req, res) => {
  try {
    const completed = await Intervention.find({ status: 'completed' }).sort({ plannedDate: -1 });
    res.json(completed);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history', error });
  }
};
