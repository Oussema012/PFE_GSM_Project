const express = require('express');
const router = express.Router();
const siteController = require('../controllers/SiteController');

// Define routes with valid handler functions
router.post('/', siteController.createSite);
//router.get('/', siteController.getSites);
router.get('/:id', siteController.getSiteById);
router.put('/:id', siteController.updateSite);
router.delete('/:id', siteController.deleteSite);
router.get('/', siteController.getAllSites);
router.get('/references', siteController.getSiteReferences);

module.exports = router;
