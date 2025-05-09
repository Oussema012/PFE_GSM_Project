const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  createUser,
  getAllUsers,
  getUsersByRole,
  updateUser,
  deleteUser,
  resetUserPassword
} = require('../controllers/userController');

// Create a new user
router.post('/create', createUser);

// Get all users
router.get('/', getAllUsers);

// Get users by role
router.get('/role/:role', getUsersByRole);

// Update user profile
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

// Reset user password
router.put('/reset-password/:id', resetUserPassword);

module.exports = router;
