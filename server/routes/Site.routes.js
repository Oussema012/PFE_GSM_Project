const express = require('express');
const router = express.Router();
const siteController = require('../controllers/SiteController');

router.post('/', siteController.createSite);
router.get('/references', siteController.getSiteReferences);
router.get('/', siteController.getSites);
router.get('/:id', siteController.getSiteById);
router.put('/:id', siteController.updateSite);
router.delete('/:id', siteController.deleteSite);
router.post('/technicians/assign', siteController.assignTechnicianToSites);
router.get('/equipment/:siteId', siteController.getEquipmentBySiteId);

module.exports = router;