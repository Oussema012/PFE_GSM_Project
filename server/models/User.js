// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "engineer", "technician"], required: true },
  assignedSites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Site' }], // Array of site IDs assigned to technician
});

module.exports = mongoose.model("User", userSchema);
