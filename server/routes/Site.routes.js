const express = require('express');
const router = express.Router();
const InterventionController = require('../controllers/InterventionController');

// POST → Create intervention
router.post('/', InterventionController.createIntervention);

// GET → Get all interventions by siteId
router.get('/:siteId', InterventionController.getInterventionsBySite);

// GET → Get single intervention by ID
router.get('/details/:id', InterventionController.getInterventionById);

// PUT → Update intervention status
router.put('/:id', InterventionController.updateInterventionStatus);

// DELETE → Delete intervention
router.delete('/:id', InterventionController.deleteIntervention);

module.exports = router;
