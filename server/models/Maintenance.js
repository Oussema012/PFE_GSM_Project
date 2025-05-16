const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
  {
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: [true, 'Equipment ID is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters long'],
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    performedAt: {
      type: Date,
    },
    performedBy: {
      type: String,
      required: [true, 'Performed by is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'in progress', 'completed'],
        message: 'Status must be either: pending, in progress, or completed',
      },
      default: 'pending',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('Maintenance', maintenanceSchema);
