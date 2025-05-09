const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
  siteId: { type: String, required: true }, // Consider using ObjectId if you are linking to another collection
  reportType: { 
    type: String, 
    enum: ['summary', 'daily', 'weekly', 'monthly'], 
    default: 'summary' 
  },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  generatedAt: { type: Date, default: Date.now },
  generatedBy: { type: String, default: 'system' },
  data: {
    alertStats: {
      total: { type: Number, default: 0 },
      active: { type: Number, default: 0 },
      resolved: { type: Number, default: 0 },
    },
    interventionStats: {
      total: { type: Number, default: 0 },
      averageDuration: { type: Number, default: 0 }, // Added: to track average duration for interventions
    },
    // More statistics can be added here
  },
  additionalInfo: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  }
});

module.exports = mongoose.model('Report', ReportSchema);
