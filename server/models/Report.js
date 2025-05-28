const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
  siteId: { type: String, required: true }, // Consider using ObjectId if linking to another collection
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
      bySeverity: { // Added: to track alerts by severity
        low: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        high: { type: Number, default: 0 }
      }
    },
    interventionStats: {
      total: { type: Number, default: 0 },
      averageDuration: { type: Number, default: 0 }, // In minutes
      byType: { // Added: to categorize interventions by type
        corrective: { type: Number, default: 0 },
        preventive: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
      }
    },
    maintenanceStats: { // Added: to track maintenance activities
      total: { type: Number, default: 0 },
      scheduled: { type: Number, default: 0 },
      unscheduled: { type: Number, default: 0 },
      averageDowntime: { type: Number, default: 0 } // In minutes
    }
  },
  additionalInfo: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  }
});

module.exports = mongoose.model('Report', ReportSchema);