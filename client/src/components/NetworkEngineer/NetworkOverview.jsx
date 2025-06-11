import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Devices as DevicesIcon,
  Map as MapIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import NetworkDeviceManagement from './NetworkDeviceManagement';
import NetworkTopology from './NetworkTopology';
import NetworkReports from './NetworkReports';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Validate MongoDB ObjectId
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const NetworkOverview = () => {
  const [dashboardData, setDashboardData] = useState({
    totalSites: 0,
    activeSites: 0,
    totalInterventions: 0,
    activeTechnicians: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentUser = useSelector((state) => state.user?.currentUser);

  useEffect(() => {
    if (!currentUser?._id || !isValidObjectId(currentUser._id)) {
      setError('Please log in to view the dashboard');
      return;
    }
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch sites
      const sitesResponse = await axios.get(`${API_URL}/api/sites?_=${new Date().getTime()}`);
      const sites = sitesResponse.data || [];
      const activeSites = sites.filter((site) => site.status?.toLowerCase() === 'active').length;

      // Fetch interventions
      const interventionsResponse = await axios.get(
        `${API_URL}/api/interventions?createdBy=${currentUser._id}`
      );
      const interventions = interventionsResponse.data?.data || [];

      // Fetch technicians
      const techniciansResponse = await axios.get(`${API_URL}/api/technicians`);
      const technicians = techniciansResponse.data?.data || techniciansResponse.data;
      const activeTechnicians = technicians.filter((tech) => tech.isActive).length;

      setDashboardData({
        totalSites: sites.length,
        activeSites,
        totalInterventions: interventions.length,
        activeTechnicians,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  const summaryCards = [
    {
      title: 'Total Sites',
      value: dashboardData.totalSites,
      icon: <DevicesIcon sx={{ fontSize: 40, color: '#3b82f6' }} />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Active Sites',
      value: dashboardData.activeSites,
      icon: <MapIcon sx={{ fontSize: 40, color: '#10b981' }} />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Total Interventions',
      value: dashboardData.totalInterventions,
      icon: <AssignmentIcon sx={{ fontSize: 40, color: '#f59e0b' }} />,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Active Technicians',
      value: dashboardData.activeTechnicians,
      icon: <PeopleIcon sx={{ fontSize: 40, color: '#ef4444' }} />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: '1400px', mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
        Network Operations Dashboard
      </Typography>

      {error && (
        <Snackbar
          open={Boolean(error)}
          autoHideDuration={6000}
          onClose={handleCloseError}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 6 }}>
            {summaryCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  className={`animate-fade-in ${card.bgColor} shadow-md hover:shadow-lg transition-shadow duration-300`}
                  sx={{ borderRadius: 2 }}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {card.icon}
                    <Box>
                      <Typography variant="h6" className={card.textColor}>
                        {card.title}
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" className={card.textColor}>
                        {card.value}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Integrated Components */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Device Management
            </Typography>
            <NetworkDeviceManagement />
          </Box>

          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Intervention Management
            </Typography>
            <NetworkTopology />
          </Box>

          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              User Reports
            </Typography>
            <NetworkReports />
          </Box>
        </>
      )}
    </Box>
  );
};

// Custom Tailwind animation for fade-in
const styles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
`;
document.head.insertAdjacentHTML('beforeend', `<style>${styles}</style>`);

export default NetworkOverview;