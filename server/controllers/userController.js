const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ✅ Create a new technician or engineer (No admin check)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Role validation
    if (!['technician', 'engineer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be "technician" or "engineer".' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      isActive: true
    });

    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({ message: 'User created successfully', user: userResponse });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ message: 'Error creating user', error });
  }
};

// ✅ Get all users (No restrictions)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Fetch Users Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
};

// ✅ Get users by role
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    // Validate role
    if (!['technician', 'engineer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const users = await User.find({ role }).select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Fetch Users Error:', error);
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

// ✅ Update user profile
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, isActive } = req.body;

    const user = await User.findById(id);
    if (!user || !['technician', 'engineer'].includes(user.role)) {
      return res.status(404).json({ message: 'User not found or invalid role' });
    }

    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.role = role ?? user.role;
    user.department = department ?? user.department;
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ message: 'User updated successfully', user: userResponse });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ message: 'Error updating user', error });
  }
};

// ✅ Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user || !['technician', 'engineer'].includes(user.role)) {
      return res.status(404).json({ message: 'User not found or invalid role' });
    }

    await User.findByIdAndDelete(id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Error deleting user', error });
  }
};

// ✅ Reset user password
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Password validation
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Error resetting password', error });
  }
};
