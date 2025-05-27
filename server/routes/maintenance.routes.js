const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/MaintenanceController');

// Create a new maintenance record
router.post('/', maintenanceController.addMaintenance);
// Get all maintenance records
router.get('/', maintenanceController.getAllMaintenances);
// Get maintenance records by equipment ID
router.get('/equipment/:equipmentId', maintenanceController.getMaintenanceByEquipment);
// Update a maintenance record by ID
router.put('/:id', maintenanceController.updateMaintenance);
// Delete a maintenance record by ID
router.delete('/:id', maintenanceController.deleteMaintenance);



// In your routes file
router.get('/technician/:technicianId', maintenanceController.getMaintenanceByTechnicianById);
module.exports = router;
