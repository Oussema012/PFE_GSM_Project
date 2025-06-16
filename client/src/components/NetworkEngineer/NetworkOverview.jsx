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
  Button,
} from '@mui/material';
import {
  Devices as DevicesIcon,
  Map as MapIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  People as PeopleIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import NetworkDeviceManagement from './NetworkDeviceManagement';
import NetworkTopology from './NetworkTopology';
import NetworkReports from './NetworkReports';

// Placeholder components (replace with actual implementations when available)
const NetworkMaintenanceManagement = () => (
  <Box>
    <Typography variant="h5" fontWeight="bold" gutterBottom>
      Maintenance Management
    </Typography>
    <Typography>Manage maintenance tasks (placeholder).</Typography>
  </Box>
);

const NetworkTechnicianManagement = () => (
  <Box>
    <Typography variant="h5" fontWeight="bold" gutterBottom>
      Technician Management
    </Typography>
    <Typography>Manage technicians (placeholder).</Typography>
  </Box>
);

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Validate MongoDB ObjectId
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const NetworkOverview = () => {
  const [dashboardData, setDashboardData] = useState({
    totalSites: 0,
    activeSites: 0,
    totalInterventions: 0,
    upcomingMaintenances: 0,
    activeTechnicians: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const currentUser = useSelector((state) => state.user?.currentUser);

  useEffect(() => {
    if (!currentUser?._id || !isValidObjectId(currentUser._id)) {
      setError('Please log in to view the dashboard');
      return;
    }
    if (activeTab === 'overview') {
      fetchDashboardData();
    }
  }, [currentUser, activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch sites
      const sitesResponse = await axios.get(`${API_URL}/api/sites?_=${new Date().getTime()}`);
      const sites = Array.isArray(sitesResponse.data) ? sitesResponse.data : [];

      // Fetch interventions
      const interventionsResponse = await axios.get(
        `${API_URL}/api/interventions?createdBy=${currentUser._id}&status=planned`
      );
      const interventions = Array.isArray(interventionsResponse.data?.data)
        ? interventionsResponse.data.data
        : [];

      // Fetch maintenance
      const maintenanceResponse = await axios.get(
        `${API_URL}/api/maintenance?status=pending`
      );
      const maintenances = Array.isArray(maintenanceResponse.data?.data)
        ? maintenanceResponse.data.data
        : [];

      // Fetch technicians
      const techniciansResponse = await axios.get(`${API_URL}/api/technicians`);
      const technicians = Array.isArray(techniciansResponse.data?.data)
        ? techniciansResponse.data.data
        : [];

      setDashboardData({
        totalSites: sites.length,
        activeSites: sites.filter((site) => site.status?.toLowerCase() === 'active').length,
        totalInterventions: interventions.length,
        upcomingMaintenances: maintenances.length, // Backend filters by status=pending
        activeTechnicians: technicians.filter((tech) => tech.isActive).length,
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const summaryCards = [
    {
      title: 'Total Sites',
      value: dashboardData.totalSites,
      icon: <DevicesIcon sx={{ fontSize: 40, color: '#3b82f6' }} />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      tab: 'devices',
    },
    {
      title: 'Active Sites',
      value: dashboardData.activeSites,
      icon: <MapIcon sx={{ fontSize: 40, color: '#10b981' }} />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      tab: 'devices',
    },
    {
      title: 'Pending Interventions',
      value: dashboardData.totalInterventions,
      icon: <AssignmentIcon sx={{ fontSize: 40, color: '#f59e0b' }} />,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      tab: 'interventions',
    },
    {
      title: 'Upcoming Maintenances',
      value: dashboardData.upcomingMaintenances,
      icon: <BuildIcon sx={{ fontSize: 40, color: '#8b5cf6' }} />,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      tab: 'maintenance',
    },
    {
      title: 'Active Technicians',
      value: dashboardData.activeTechnicians,
      icon: <PeopleIcon sx={{ fontSize: 40, color: '#ef4444' }} />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      tab: 'technicians',
    },
  ];

  const quickAccessLinks = [
    {
      title: 'Device Management',
      description: 'Manage network sites and equipment',
      tab: 'devices',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Interventions',
      description: 'Manage and track network interventions',
      tab: 'interventions',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Maintenance',
      description: 'View and schedule maintenance tasks',
      tab: 'maintenance',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Reports',
      description: 'Access analytics and reports',
      tab: 'reports',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Technician Management',
      description: 'Manage technicians and their assignments',
      tab: 'technicians',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'devices':
        return <NetworkDeviceManagement />;
      case 'interventions':
        return <NetworkTopology />;
      case 'maintenance':
        return <NetworkMaintenanceManagement />;
      case 'reports':
        return <NetworkReports />;
      case 'technicians':
        return <NetworkTechnicianManagement />;
      case 'overview':
      default:
        return (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
              {summaryCards.map((card, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card
                    className={`animate-fade-in ${card.bgColor} shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer`}
                    sx={{ borderRadius: 2 }}
                    onClick={() => handleTabChange(card.tab)}
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

            {/* Quick Access Links */}
            <Box sx={{ mb: 6 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Quick Access
              </Typography>
              <Grid container spacing={3}>
                {quickAccessLinks.map((link, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                      className={`animate-fade-in ${link.bgColor} hover:shadow-lg transition-shadow duration-300 cursor-pointer`}
                      sx={{ borderRadius: 2 }}
                      onClick={() => handleTabChange(link.tab)}
                    >
                      <CardContent>
                        <Typography variant="h6" className={link.textColor}>
                          {link.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {link.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        );
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: '1400px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Network Operations Dashboard
        </Typography>
        {activeTab !== 'overview' && (
          <Button
            variant="contained"
            startIcon={<DashboardIcon />}
            onClick={() => handleTabChange('overview')}
            sx={{ bgcolor: '#6b7280', '&:hover': { bgcolor: '#4b5563' } }}
          >
            Back to Overview
          </Button>
        )}
      </Box>

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

      {loading && activeTab === 'overview' ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderContent()
      )}
    </Box>
  );
};

export default NetworkOverview;