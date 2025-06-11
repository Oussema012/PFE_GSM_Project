import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  TextField,
  Typography,
  Paper,
  Snackbar,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Box,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  People as PeopleIcon,
  Power as PowerIcon,
  PowerOff as PowerOffIcon,
} from '@mui/icons-material';

const DashUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:8000/api';

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  useEffect(() => {
    let filtered = users;
    if (selectedRole !== 'all') {
      filtered = users.filter(user => user.role === selectedRole);
    }
    filtered = filtered.filter(
      (user) =>
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users, selectedRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/users`);
      let usersData = res.data.data || res.data;
      console.log('Raw API response:', usersData);

      usersData = usersData.map(user => ({
        ...user,
        assignedSiteNames: user.assignedSites?.map(site => site.site_reference || site.name || 'Unknown Site') || [],
      }));
      setUsers(usersData);
    } catch (err) {
      showSnackbar('Failed to fetch users', 'error');
      console.error('Error fetching users:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const activateTechnician = async (id) => {
    setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/technicians/${id}/activate`, {});
      showSnackbar(res.data.message || 'Technician activated successfully', 'success');
      await fetchUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to activate technician';
      const errorDetails = err.response?.data?.details ? `: ${err.response.data.details.join(', ')}` : '';
      showSnackbar(`${errorMessage}${errorDetails}`, 'error');
      console.error('Error activating technician:', err.response || err);
    } finally {
      setLoading(false);
    }
  };

  const deactivateTechnician = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this technician? This will remove all site assignments.')) return;
    setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/technicians/${id}/deactivate`, {});
      showSnackbar(res.data.message || 'Technician deactivated successfully', 'success');
      await fetchUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to deactivate technician';
      const errorDetails = err.response?.data?.details ? `: ${err.response.data.details.join(', ')}` : '';
      showSnackbar(`${errorMessage}${errorDetails}`, 'error');
      console.error('Error deactivating technician:', err.response || err);
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
            <Typography variant="h4" fontWeight="bold">
              User Management
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
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: 240 } }}
          />
        </Box>
      </Box>

      <Paper sx={{ p: 2, mt: 3, boxShadow: 3 }}>
        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Role</TableCell>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Assigned Sites</TableCell>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">Actions</TableCell>
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
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.role === 'technician'
                        ? user.assignedSiteNames?.length > 0
                          ? user.assignedSiteNames.join(', ')
                          : 'No Sites'
                        : '-'}
                    </TableCell>
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
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No users found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DashUserManagement;