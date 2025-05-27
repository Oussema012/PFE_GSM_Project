import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBell, FaWrench, FaNetworkWired, FaUsers, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

// Set axios base URL
axios.defaults.baseURL = 'http://localhost:3000';

// Validate MongoDB ObjectId
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const NetworkOverview = () => {
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    activeAlerts: 0,
    unreadNotifications: 0,
    upcomingMaintenances: 0,
    activeInterventions: 0,
    activeUsers: 0,
  });

  // Fetch all necessary data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch active alerts
      const alertsResponse = await axios.get('/api/alerts');
      const normalizedAlerts = Array.isArray(alertsResponse.data)
        ? alertsResponse.data.map((alert) => ({
            ...alert,
            siteId: alert.siteId?._id || alert.siteId,
          }))
        : [];
      setAlerts(normalizedAlerts);

      // Fetch recent notifications
      const notificationsResponse = await axios.get('/api/notifications', {
        params: { page: 1, limit: 5 },
      });
      setNotifications(notificationsResponse.data.notifications || []);

      // Fetch maintenance records
      const maintenancesResponse = await axios.get('/api/maintenance');
      setMaintenances(Array.isArray(maintenancesResponse.data) ? maintenancesResponse.data : []);

      // Fetch interventions
      const interventionsResponse = await axios.get('/api/interventions');
      setInterventions(Array.isArray(interventionsResponse.data) ? interventionsResponse.data : []);

      // Fetch users
      const usersResponse = await axios.get('/api/users');
      setUsers(Array.isArray(usersResponse.data.data) ? usersResponse.data.data : []);

      // Calculate stats
      setStats({
        activeAlerts: normalizedAlerts.filter((alert) => alert.status === 'active').length,
        unreadNotifications: notificationsResponse.data.notifications?.filter((n) => !n.read).length || 0,
        upcomingMaintenances: maintenancesResponse.data.filter(
          (m) => m.status !== 'completed' && new Date(m.scheduledDate) >= new Date()
        ).length,
        activeInterventions: interventionsResponse.data.filter(
          (i) => i.status === 'planned' || i.status === 'in-progress'
        ).length,
        activeUsers: usersResponse.data.data?.filter((u) => u.isActive).length || 0,
      });
    } catch (err) {
      setError(`Failed to fetch data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="bg-white shadow rounded-lg mb-6">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaNetworkWired className="mr-2 text-indigo-600" />
              Network Dashboard
            </h1>
            <Link
              to="/network-dashboard?tab=details"
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              View Detailed Reports
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
            <div className="flex">
              <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading dashboard...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                <h3 className="text-sm font-medium text-gray-500">Active Alerts</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.activeAlerts}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-teal-500">
                <h3 className="text-sm font-medium text-gray-500">Unread Notifications</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.unreadNotifications}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
                <h3 className="text-sm font-medium text-gray-500">Upcoming Maintenances</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingMaintenances}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <h3 className="text-sm font-medium text-gray-500">Active Interventions</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.activeInterventions}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <FaExclamationTriangle className="mr-2 text-red-600" />
                Recent Alerts
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {alerts.slice(0, 5).map((alert) => (
                      <tr key={alert._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alert.siteId || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {alert.type || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{alert.message || 'No message'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              alert.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {alert.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {alerts.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                          No recent alerts
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Link
                to="/network-alerts"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View All Alerts
              </Link>
            </div>

            {/* Recent Notifications */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <FaBell className="mr-2 text-teal-600" />
                Recent Notifications
              </h2>
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 ${notification.read ? 'bg-gray-100' : 'bg-white'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              notification.type === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'
                            }`}
                          >
                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleString('en-US', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mt-1">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500">No recent notifications</div>
                )}
              </div>
              <Link
                to="/notifications"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View All Notifications
              </Link>
            </div>

            {/* Upcoming Maintenances */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <FaWrench className="mr-2 text-indigo-600" />
                Upcoming Maintenances
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {maintenances
                  .filter((m) => m.status !== 'completed' && new Date(m.scheduledDate) >= new Date())
                  .slice(0, 3)
                  .map((maintenance) => (
                    <div
                      key={maintenance._id}
                      className="p-4 rounded-lg shadow border-l-4 border-orange-500 bg-orange-50"
                    >
                      <h4 className="font-semibold text-gray-900">{maintenance.description}</h4>
                      <p className="text-sm text-gray-600">
                        Equipment: {maintenance.equipmentId?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Technician: {maintenance.performedBy?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Scheduled: {new Date(maintenance.scheduledDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                {maintenances.filter((m) => m.status !== 'completed' && new Date(m.scheduledDate) >= new Date()).length ===
                  0 && (
                  <div className="col-span-full text-center text-sm text-gray-500 py-4">
                    No upcoming maintenances
                  </div>
                )}
              </div>
              <Link
                to="/network-settings"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View All Maintenances
              </Link>
            </div>

            {/* Intervention Status */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <FaNetworkWired className="mr-2 text-blue-600" />
                Intervention Status
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {interventions
                      .filter((i) => i.status === 'planned' || i.status === 'in-progress')
                      .slice(0, 5)
                      .map((intervention) => (
                        <tr key={intervention._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{intervention.siteId || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {intervention.technician?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                intervention.status === 'planned' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {intervention.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {intervention.plannedDate ? new Date(intervention.plannedDate).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    {interventions.filter((i) => i.status === 'planned' || i.status === 'in-progress').length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                          No active interventions
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Link
                to="/network-topology"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View All Interventions
              </Link>
            </div>

            {/* Active Users */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <FaUsers className="mr-2 text-green-600" />
                Active Users
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users
                      .filter((u) => u.isActive)
                      .slice(0, 5)
                      .map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'technician'
                                  ? 'bg-blue-100 text-blue-800'
                                  : user.role === 'engineer'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {user.role || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    {users.filter((u) => u.isActive).length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                          No active users
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Link
                to="/network-reports"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View All Users
              </Link>
            </div>
          </>
        )}
      </main>

      {/* Custom Tailwind animation */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NetworkOverview;