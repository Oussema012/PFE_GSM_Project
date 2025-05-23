import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, Chip, CircularProgress, Alert, IconButton } from '@mui/material';
import { Notifications, Assignment, CheckCircle, Cancel } from '@mui/icons-material';
import axios from 'axios';

const DeviceCommandCenter = () => {
  const [interventions, setInterventions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const technicianId = 'tech001'; // Replace with actual technician ID (e.g., from auth context)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch interventions
        const interventionsRes = await axios.get(
          `/api/interventions/technician/${technicianId}`
        );
        setInterventions(interventionsRes.data);

        // Fetch notifications
        const notificationsRes = await axios.get(
          `/api/notifications/technician/${technicianId}`
        );
        setNotifications(notificationsRes.data);
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [technicianId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-500';
      case 'in-progress':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" className="font-bold text-gray-800 mb-6 flex items-center">
        <Assignment className="mr-2" /> Device Command Center
      </Typography>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <Box className="flex justify-center">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Interventions Section */}
          <Grid item xs={12} md={8}>
            <Typography variant="h5" className="font-semibold text-gray-700 mb-4">
              Assigned Interventions
            </Typography>
            {interventions.length === 0 ? (
              <Typography>No interventions assigned.</Typography>
            ) : (
              interventions.map((intervention) => (
                <Card key={intervention._id} className="mb-4 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent>
                    <Box className="flex justify-between items-center">
                      <Box>
                        <Typography variant="h6" className="font-semibold">
                          {intervention.description}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                          Site: {intervention.siteId}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                          Planned: {new Date(intervention.plannedDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                          Time: {intervention.timeSlot?.start} - {intervention.timeSlot?.end}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                          Priority: {intervention.priority}
                        </Typography>
                      </Box>
                      <Chip
                        label={intervention.status}
                        className={`${getStatusColor(intervention.status)} text-white`}
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Grid>

          {/* Notifications Section */}
          <Grid item xs={12} md={4}>
            <Typography variant="h5" className="font-semibold text-gray-700 mb-4 flex items-center">
              <Notifications className="mr-2" /> Notifications
            </Typography>
            {notifications.length === 0 ? (
              <Typography>No new notifications.</Typography>
            ) : (
              notifications.map((notification) => (
                <Card key={notification._id} className="mb-4 shadow-lg">
                  <CardContent className="flex justify-between items-center">
                    <Box>
                      <Typography variant="body1">{notification.message}</Typography>
                      <Typography variant="caption" className="text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={async () => {
                        try {
                          await axios.put(`/api/notifications/${notification._id}`, { read: true });
                          setNotifications(notifications.map((n) =>
                            n._id === notification._id ? { ...n, read: true } : n
                          ));
                        } catch (err) {
                          console.error('Error marking notification as read:', err);
                        }
                      }}
                    >
                      {notification.read ? <CheckCircle color="success" /> : <Cancel color="error" />}
                    </IconButton>
                  </CardContent>
                </Card>
              ))
            )}
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default DeviceCommandCenter;