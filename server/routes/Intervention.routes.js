const express = require('express');
const router = express.Router();
const InterventionController = require('../controllers/InterventionController');

// POST → Create intervention
router.get('/all', InterventionController.getAllInterventions);
router.post('/', InterventionController.createIntervention);
router.get('/', InterventionController.getInterventionsByCreator);
router.get('/tech', InterventionController.getInterventionsByTechnician);
router.put('/:id', InterventionController.updateInterventionStatus);
router.post('/:id/resolve', InterventionController.resolveIntervention);
router.put('/:id/resolve', InterventionController.resolveIntervention);
router.delete('/:id', InterventionController.deleteIntervention);
router.get('/:id', InterventionController.getInterventionById);
router.get('/site/:siteId', InterventionController.getInterventionsBySite);
router.get('/completed', InterventionController.getCompletedInterventions);







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
