// server/middleware/validationMiddleware.js
const validateSiteData = (req, res, next) => {
    const { site_id, name, status } = req.body;
    if (!site_id || !name || !status) {
      return res.status(400).json({ message: 'site_id, name, and status are required' });
    }
    next(); // Proceed to the next middleware/route handler
  };
  // middleware/validationMiddleware.js
module.exports.validateIntervention = (req, res, next) => {
    const { siteId, description, plannedDate, priority, status } = req.body;
  
    // Ensure required fields are present
    if (!siteId || !description || !plannedDate || !priority || !status) {
      return res.status(400).json({ message: 'Missing required fields: siteId, description, plannedDate, priority, status' });
    }
  
    // Ensure priority and status are valid
    const validPriorities = ['low', 'medium', 'high'];
    const validStatuses = ['planned', 'in-progress', 'completed', 'cancelled'];
  
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority. Must be one of: low, medium, high.' });
    }
  
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: planned, in-progress, completed, cancelled.' });
    }
  
    next(); // Proceed to the next middleware/route handler if everything is valid
  };
  
  module.exports = validateSiteData;
  