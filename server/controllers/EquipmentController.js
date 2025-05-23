const Equipment = require('../models/Equipment');

// Add new equipment to a site
const addEquipment = async (req, res) => {
  console.log("REQ.BODY:", req.body);
    try {
      const { siteId, name, type, status } = req.body;
  
      if (!siteId || !name || !type || !status) {
        return res.status(400).json({ message: 'siteId, name, type, and status are required' });
      }
  
      const newEquipment = new Equipment({ siteId, name, type, status });
      await newEquipment.save();
  
      res.status(201).json(newEquipment);
    } catch (err) {
      console.error('Add Equipment Error:', err); // 👈 log full error
      res.status(500).json({ message: 'Error adding equipment', error: err.message || err });
    }
  };
  

// Get all equipment for a specific site
const getEquipmentBySite = async (req, res) => {
  try {
    const { siteId } = req.params;

    const equipment = await Equipment.find({ siteId });
    res.status(200).json(equipment);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving equipment', error: err });
  }
};

// Update equipment by its ID
const updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Equipment.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!updated) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating equipment', error: err });
  }
};

// Delete equipment by its ID
const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Equipment.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    res.status(200).json({ message: 'Equipment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting equipment', error: err });
  }
};
// Return equipment options (e.g., types of equipment)
const fallbackEquipmentOptions = (req, res) => {
  console.log('fallbackEquipmentOptions called');
  const options = [
    { equipment_id: 'eq001', name: 'Antenna A', type: 'Antenna' },
    { equipment_id: 'eq002', name: 'Generator B', type: 'Generator' },
    { equipment_id: 'eq003', name: 'Router C', type: 'Router' },
  ];
  console.log('Options sent:', options);
  res.status(200).json(options);
};
// Return equipment options (static for now)
const getEquipmentOptions = (req, res) => {
  const options = [
    { label: 'Router', value: 'router' },
    { label: 'Switch', value: 'switch' },
    { label: 'Firewall', value: 'firewall' },
    { label: 'Server', value: 'server' },
    { label: 'Access Point', value: 'access_point' }
  ];
  res.status(200).json(options);
};

module.exports = {
  addEquipment,
  getEquipmentBySite,
  updateEquipment,
  deleteEquipment,
  fallbackEquipmentOptions,
  getEquipmentOptions 
};
