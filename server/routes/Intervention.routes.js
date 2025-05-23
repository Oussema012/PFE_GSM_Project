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

// PUT → Resolve intervention
router.put('/:id/resolve', InterventionController.resolveIntervention);

// DELETE → Delete intervention
router.delete('/:id', InterventionController.deleteIntervention);

// GET → Get completed interventions (history)
router.get('/history/interventions', InterventionController.getCompletedInterventions);

// POST → Schedule an intervention
router.post('/schedule', InterventionController.scheduleIntervention);

module.exports = router;
