const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/EquipmentController');

// Add new equipment to a site
router.post('/', equipmentController.addEquipment);

// Get all equipment for a specific site
router.get('/:siteId', equipmentController.getEquipmentBySite);

// Update equipment by ID
router.put('/:id', equipmentController.updateEquipment);

// Delete equipment by ID
router.delete('/:id', equipmentController.deleteEquipment);
router.get('/options', equipmentController.getEquipmentOptions); // 👈 Add this route
module.exports = router;
