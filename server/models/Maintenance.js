const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema({
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: [true, 'Equipment ID is required'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Technician is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending',
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
  },
 scheduledTime: {
  type: String,
  default: '',
  validate: {
    validator: function (v) {
      return v === '' || /^\d{2}:\d{2}:\d{2}$/.test(v);
    },
    message: 'scheduledTime must be in HH:mm:ss format or empty',
  },
},
  performedAt: {
    type: Date,
  },
  resolutionNotes: {
    type: String,
    trim: true,
    default: '',
  },
});

module.exports = mongoose.model('Maintenance', MaintenanceSchema);