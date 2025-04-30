const mongoose = require('mongoose');
const { Schema } = mongoose;

const interventionSchema = new Schema({
  siteId: { type: String, required: true },
  description: { type: String, required: true },
  plannedDate: { type: Date, required: true },
  technician: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['planned', 'in-progress', 'completed', 'cancelled'], 
    default: 'planned' 
  },
  createdAt: { type: Date, default: Date.now }
});

const Intervention = mongoose.model('Intervention', interventionSchema);
module.exports = Intervention;
