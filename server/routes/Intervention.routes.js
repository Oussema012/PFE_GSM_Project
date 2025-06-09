const express = require('express');
const router = express.Router();
const InterventionController = require('../controllers/InterventionController');

// GET → Get all interventions
router.get('/all', InterventionController.getAllInterventions);

// POST → Create a new intervention
router.post('/', InterventionController.createIntervention);

// GET → Get interventions by creator
router.get('/', InterventionController.getInterventionsByCreator);

// GET → Get interventions by technician
router.get('/tech', InterventionController.getInterventionsByTechnician);

// PUT → Update intervention status
router.put('/:id', InterventionController.updateInterventionStatus);

// PUT → Resolve an intervention and associated alert
router.put('/:id/resolve', InterventionController.resolveIntervention);

// DELETE → Delete an intervention
router.delete('/:id', InterventionController.deleteIntervention);

// GET → Get intervention by ID
router.get('/:id', InterventionController.getInterventionById);

// GET → Get interventions by site
router.get('/site/:siteId', InterventionController.getInterventionsBySite);

// GET → Get completed interventions
router.get('/completed', InterventionController.getCompletedInterventions);

module.exports = router;






// GET → Get all interventions by siteId
//router.get('/:siteId', InterventionController.getInterventionsBySite);

// GET → Get single intervention by ID
//router.get('/details/:id', InterventionController.getInterventionById);

// PUT → Resolve intervention
//router.put('/:id/resolve', InterventionController.resolveIntervention);

// DELETE → Delete intervention
//router.delete('/:id', InterventionController.deleteIntervention);

// GET → Get completed interventions (history)
//router.get('/history/interventions', InterventionController.getCompletedInterventions);

// POST → Schedule an intervention
//router.post('/schedule', InterventionController.scheduleIntervention);

module.exports = router;
