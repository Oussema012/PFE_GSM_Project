import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';

const NetworkReports = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [selectedRole, setSelectedRole] = useState('all');
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [openResetModal, setOpenResetModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: '', department: '' });
  const [updateUser, setUpdateUser] = useState({ id: '', name: '', email: '', role: '', department: '' });
  const [resetPassword, setResetPassword] = useState('');
  const [resetUserId, setResetUserId] = useState(null);

  const API_URL = 'http://localhost:3000/api/users';

  useEffect(() => {
    if (selectedRole === 'all') {
      fetchUsers();
    } else {
      fetchUsersByRole(selectedRole);
    }
  }, [selectedRole]);

  useEffect(() => {
    setFilteredUsers(
      users.filter(
        (user) =>
          (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.department || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}`);
      const usersData = res.data.data || res.data;
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      triggerSnackbar('Failed to fetch user reports', 'error');
    }
  };

  const fetchUsersByRole = async (role) => {
    try {
      const res = await axios.get(`${API_URL}/role/${role}`);
      const usersData = res.data.data || res.data;
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users by role:', err);
      triggerSnackbar('Failed to fetch role-based reports', 'error');
    }
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.role || !newUser.department) {
      triggerSnackbar('All fields are required', 'error');
      return;
    }
    try {
      await axios.post(`${API_URL}/create`, newUser);
      triggerSnackbar('User created successfully', 'success');
      setOpenCreateModal(false);
      setNewUser({ name: '', email: '', role: '', department: '' });
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      triggerSnackbar(err.response?.data?.message || 'Failed to create user', 'error');
    }
  };

  const updateUserDetails = async () => {
    if (!updateUser.id) {
      triggerSnackbar('Invalid user ID', 'error');
      return;
    }
    if (!updateUser.name || !updateUser.email || !updateUser.role || !updateUser.department) {
      triggerSnackbar('All fields are required', 'error');
      return;
    }
    try {
      await axios.put(`${API_URL}/${updateUser.id}`, {
        name: updateUser.name,
        email: updateUser.email,
        role: updateUser.role,
        department: updateUser.department,
      });
      triggerSnackbar('User updated successfully', 'success');
      setOpenUpdateModal(false);
      setUpdateUser({ id: '', name: '', email: '', role: '', department: '' });
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      if (err.response?.status === 404) {
        triggerSnackbar('User not found', 'error');
      } else {
        triggerSnackbar(err.response?.data?.message || 'Failed to update user', 'error');
      }
    }
  };

  const deleteUser = async (id) => {
    if (!id) {
      triggerSnackbar('Invalid user ID', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      triggerSnackbar('User deleted successfully', 'success');
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      if (err.response?.status === 404) {
        triggerSnackbar('User not found', 'error');
      } else {
        triggerSnackbar(err.response?.data?.message || 'Failed to delete user', 'error');
      }
    }
  };

  const resetUserPassword = async () => {
    if (!resetUserId) {
      triggerSnackbar('Invalid user ID', 'error');
      return;
    }
    if (!resetPassword) {
      triggerSnackbar('Password is required', 'error');
      return;
    }
    try {
      await axios.put(`${API_URL}/reset-password/${resetUserId}`, { newPassword: resetPassword });
      triggerSnackbar('Password reset successfully', 'success');
      setOpenResetModal(false);
      setResetPassword('');
      setResetUserId(null);
      fetchUsers();
    } catch (err) {
      console.error('Error resetting password:', err);
      if (err.response?.status === 404) {
        triggerSnackbar('User not found', 'error');
      } else {
        triggerSnackbar(err.response?.data?.message || 'Failed to reset password', 'error');
      }
    }
  };

  const triggerSnackbar = (message, severity = 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setShowSnackbar(true);
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    setSearchTerm('');
  };

  const openUpdateModalForUser = (user) => {
    setUpdateUser({
      id: user._id || '',
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
      department: user.department || '',
    });
    setOpenUpdateModal(true);
  };

  const openResetModalForUser = (id) => {
    setResetUserId(id);
    setResetPassword('');
    setOpenResetModal(true);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Network Activity Reports</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Select
            value={selectedRole}
            onChange={handleRoleChange}
            size="small"
            sx={{ width: 150 }}
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="engineer">Engineer</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
          <TextField
            variant="outlined"
            placeholder="Search by name, email, or department"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ width: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <IconButton
            onClick={() => setOpenCreateModal(true)}
            color="primary"
            aria-label="create user"
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            ➕
          </IconButton>
        </Box>
      </Box>

      {/* Create User Modal */}
      <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={newUser.name || ''}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            margin="normal"
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={newUser.email || ''}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            margin="normal"
            variant="outlined"
          />
          <Select
            fullWidth
            value={newUser.role || ''}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            displayEmpty
            margin="normal"
            variant="outlined"
            sx={{ mt: 2, mb: 1 }}
          >
            <MenuItem value="">Select Role</MenuItem>
            <MenuItem value="engineer">Engineer</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
          <TextField
            fullWidth
            label="Department"
            value={newUser.department || ''}
            onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
            margin="normal"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <IconButton
            onClick={createUser}
            color="primary"
            aria-label="create"
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            ✅
          </IconButton>
          <IconButton
            onClick={() => setOpenCreateModal(false)}
            color="secondary"
            aria-label="cancel"
            sx={{ bgcolor: 'grey.500', color: 'white', '&:hover': { bgcolor: 'grey.700' } }}
          >
            ❌
          </IconButton>
        </DialogActions>
      </Dialog>

      {/* Update User Modal */}
      <Dialog open={openUpdateModal} onClose={() => setOpenUpdateModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Update User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={updateUser.name || ''}
            onChange={(e) => setUpdateUser({ ...updateUser, name: e.target.value })}
            margin="normal"
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={updateUser.email || ''}
            onChange={(e) => setUpdateUser({ ...updateUser, email: e.target.value })}
            margin="normal"
            variant="outlined"
          />
          <Select
            fullWidth
            value={updateUser.role || ''}
            onChange={(e) => setUpdateUser({ ...updateUser, role: e.target.value })}
            displayEmpty
            margin="normal"
            variant="outlined"
            sx={{ mt: 2, mb: 1 }}
          >
            <MenuItem value="">Select Role</MenuItem>
            <MenuItem value="engineer">Engineer</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
          <TextField
            fullWidth
            label="Department"
            value={updateUser.department || ''}
            onChange={(e) => setUpdateUser({ ...updateUser, department: e.target.value })}
            margin="normal"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <IconButton
            onClick={updateUserDetails}
            color="primary"
            aria-label="update"
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            ✅
          </IconButton>
          <IconButton
            onClick={() => setOpenUpdateModal(false)}
            color="secondary"
            aria-label="cancel"
            sx={{ bgcolor: 'grey.500', color: 'white', '&:hover': { bgcolor: 'grey.700' } }}
          >
            ❌
          </IconButton>
        </DialogActions>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={openResetModal} onClose={() => setOpenResetModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={resetPassword || ''}
            onChange={(e) => setResetPassword(e.target.value)}
            margin="normal"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <IconButton
            onClick={resetUserPassword}
            color="primary"
            aria-label="reset"
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            ✅
          </IconButton>
          <IconButton
            onClick={() => setOpenResetModal(false)}
            color="secondary"
            aria-label="cancel"
            sx={{ bgcolor: 'grey.500', color: 'white', '&:hover': { bgcolor: 'grey.700' } }}
          >
            ❌
          </IconButton>
        </DialogActions>
      </Dialog>

      {/* Users Table */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Department</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Login Count</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Last Active</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>{user.name || 'N/A'}</TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell>
                  <Box
                    component="span"
                    sx={{
                      p: 0.5,
                      borderRadius: 1,
                      bgcolor: user.role === 'engineer' ? 'info.light' : 'success.light',
                      color: user.role === 'engineer' ? 'info.contrastText' : 'success.contrastText',
                    }}
                  >
                    {user.role || 'N/A'}
                  </Box>
                </TableCell>
                <TableCell>{user.department || 'N/A'}</TableCell>
                <TableCell>{user.loginCount || 0}</TableCell>
                <TableCell>{formatDate(user.lastActive)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => openUpdateModalForUser(user)}
                    sx={{ bgcolor: 'warning.main', color: 'white', '&:hover': { bgcolor: 'warning.dark' }, mr: 1 }}
                    aria-label="edit user"
                  >
                    ✏️
                  </IconButton>
                  <IconButton
                    onClick={() => deleteUser(user._id)}
                    sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' }, mr: 1 }}
                    aria-label="delete user"
                  >
                    🗑️
                  </IconButton>
                  <IconButton
                    onClick={() => openResetModalForUser(user._id)}
                    sx={{ bgcolor: 'info.main', color: 'white', '&:hover': { bgcolor: 'info.dark' } }}
                    aria-label="reset password"
                  >
                    🔑
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NetworkReports;
