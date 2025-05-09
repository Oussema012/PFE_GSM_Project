import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Box,
  InputAdornment,
} from '@mui/material';
import { Delete, Search, LockReset } from '@mui/icons-material';

const DashUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetUserId, setResetUserId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:3000/api/users';

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setFilteredUsers(
      users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}`);
      setUsers(res.data.data || res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      showSnackbar('Failed to fetch users', 'error');
    }
  };

  const validateResetPassword = () => {
    if (!resetPassword) return 'New password is required';
    if (resetPassword.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      showSnackbar('User deleted successfully');
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      showSnackbar(err.response?.data?.message || 'Error deleting user', 'error');
    }
  };

  const handleResetPassword = async () => {
    const validationError = validateResetPassword();
    if (validationError) {
      setError(validationError);
      showSnackbar(validationError, 'error');
      return;
    }

    setIsProcessing(true);
    try {
      await axios.put(`${API_URL}/${resetUserId}/reset-password`, {
        newPassword: resetPassword,
      });
      showSnackbar('Password reset successfully');
      setOpenResetDialog(false);
      setResetPassword('');
      setResetUserId(null);
    } catch (err) {
      console.error('Error resetting password:', err);
      showSnackbar(err.response?.data?.message || 'Error resetting password', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const openResetPasswordDialog = (id) => {
    setResetUserId(id);
    setResetPassword('');
    setOpenResetDialog(true);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleCloseResetDialog = () => {
    setOpenResetDialog(false);
    setResetPassword('');
    setResetUserId(null);
    setError('');
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <TextField
          variant="outlined"
          placeholder="Search by name, email, or department"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Password Reset Dialog */}
      <Dialog open={openResetDialog} onClose={handleCloseResetDialog} fullWidth maxWidth="sm">
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            variant="outlined"
            margin="normal"
            error={error.includes('password')}
            helperText={error.includes('password') ? error : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetDialog}>Cancel</Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Users Table */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Role</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Department</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
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
                    {user.role}
                  </Box>
                </TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>
                  <Box
                    component="span"
                    sx={{
                      p: 0.5,
                      borderRadius: 1,
                      bgcolor: user.isActive ? 'success.light' : 'error.light',
                      color: user.isActive ? 'success.contrastText' : 'error.contrastText',
                    }}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="warning"
                    onClick={() => openResetPasswordDialog(user._id)}
                    aria-label="reset-password"
                  >
                    <LockReset />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(user._id)}
                    aria-label="delete"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DashUserManagement;