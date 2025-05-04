const express = require('express');
const router = express.Router();
const InterventionController = require('../controllers/InterventionController');

// CREATE: Add a new intervention
router.post('/', InterventionController.createIntervention);

// READ: Get all interventions for a specific site
router.get('/site/:siteId', InterventionController.getInterventionsBySite);

// READ: Get details of a specific intervention by ID
router.get('/:id', InterventionController.getInterventionById);

// UPDATE: Update the status or data of a specific intervention
router.put('/:id', InterventionController.updateInterventionStatus);

// DELETE: Remove a specific intervention
router.delete('/:id', InterventionController.deleteIntervention);

module.exports = router;
