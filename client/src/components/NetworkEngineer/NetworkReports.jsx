import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  InputLabel,
  FormControl,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  Power as PowerIcon,
  PowerOff as PowerOffIcon,
} from '@mui/icons-material';

const NetworkReports = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'error' });
  const [selectedRole, setSelectedRole] = useState('all');
  const [loading, setLoading] = useState(false);

  const currentUser = useSelector((state) => state.user?.currentUser);
  const API_URL = 'http://localhost:3000/api';

  useEffect(() => {
    if (!currentUser) {
      showToast('Please log in to access this page', 'error');
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
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
    setLoading(true);
    try {
      const endpoint = selectedRole === 'all' ? `${API_URL}/users` : `${API_URL}/technicians`;
      const res = await axios.get(endpoint);
      const usersData = res.data.data || res.data;
      setUsers(usersData);
    } catch (err) {
      showToast('Failed to fetch user reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const activateTechnician = async (id) => {
    setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/technicians/${id}/activate`, {});
      showToast(res.data.message || 'Technician activated successfully', 'success');
      fetchUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to activate technician';
      const errorDetails = err.response?.data?.error ? `: ${err.response.data.error}` : '';
      showToast(`${errorMessage}${errorDetails}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deactivateTechnician = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this technician? This will remove all site assignments.')) return;
    setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/technicians/${id}/deactivate`, {});
      showToast(res.data.message || 'Technician deactivated successfully', 'success');
      fetchUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to deactivate technician';
      const errorDetails = err.response?.data?.error ? `: ${err.response.data.error}` : '';
      showToast(`${errorMessage}${errorDetails}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '1400px', mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 4,
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: '8px',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <PeopleIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Network Activity Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and monitor user activities
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              label="Role"
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="technician">Technician</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="engineer">Engineer</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
            sx={{ width: { xs: '100%', sm: 240 } }}
          />
        </Box>
      </Box>
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sites</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon fontSize="small" />
                    Last Login
                  </Box>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role || 'N/A'}
                        color={
                          user.role === 'technician'
                            ? 'info'
                            : user.role === 'engineer'
                            ? 'warning'
                            : 'success'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.department || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.assignedSites?.length || 0} Site(s)
                    </TableCell>
                    <TableCell>{formatDate(user.lastLogin)}</TableCell>
                    <TableCell align="right">
                      {user.role === 'technician' && (
                        <>
                          <IconButton
                            color="success"
                            onClick={() => activateTechnician(user._id)}
                            aria-label={`Activate technician ${user.name || 'unknown'}`}
                            disabled={user.isActive}
                          >
                            <PowerIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => deactivateTechnician(user._id)}
                            aria-label={`Deactivate technician ${user.name || 'unknown'}`}
                            disabled={!user.isActive}
                          >
                            <PowerOffIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No users found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NetworkReports;
