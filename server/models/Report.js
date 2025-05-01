const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
  siteId: { type: String, required: true },
  reportType: { 
    type: String, 
    enum: ['summary', 'daily', 'weekly', 'monthly'], 
    default: 'summary' 
  },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  generatedAt: { type: Date, default: Date.now },
  generatedBy: { type: String, default: 'system' }, // Track user/admin who generated the report
  data: {
    alertStats: {
      total: { type: Number, default: 0 },
      active: { type: Number, default: 0 },
      resolved: { type: Number, default: 0 }
    },
    interventionStats: {
      total: { type: Number, default: 0 }
      // You can add more fields if needed, e.g., by type of intervention
    },
    // You can add more custom statistics or data as needed in the future
  }
});

module.exports = mongoose.model('Report', ReportSchema);
