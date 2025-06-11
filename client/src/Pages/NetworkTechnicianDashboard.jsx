import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FaTachometerAlt,
  FaServer,
  FaProjectDiagram,
  FaChartLine,
  FaExclamationTriangle,
  FaTools,
  FaSignOutAlt,
  FaUserCircle,
  FaSearch,
  FaBell,
  FaNetworkWired,
} from 'react-icons/fa';
import { signoutSuccess } from '../redux/user/userSlice';
import axios from 'axios';
import NetworkHealthDashboard from '../components/NetworkTechnician/NetworkHealthDashboard';
import InterventionsTech from '../components/NetworkTechnician/InterventionsTech';
import LiveTopologyViewer from '../components/NetworkTechnician/LiveTopologyViewer';
import TrafficAnalyzer from '../components/NetworkTechnician/TrafficAnalyzer';
import AlertWarRoom from '../components/NetworkTechnician/AlertWarRoom';
import TechToolbox from '../components/NetworkTechnician/TechToolbox';

const NotificationDropdown = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useSelector((state) => state.user);

  // Map backend type to frontend display
  const getDisplayType = (type) => {
    if (['intervention_upcoming', 'maintenance_upcoming'].includes(type)) return 'Upcoming';
    if (['intervention_missed', 'maintenance_overdue'].includes(type)) return 'Overdue';
    return type;
  };

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/api/notifications', {
        params: {
          limit: 10,
          sort: '-createdAt',
          read: 'false',
          email: currentUser?.email,
        },
      });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.total || 0);
      console.log(`Fetched ${response.data.notifications?.length || 0} recent notifications`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error fetching notifications:', err.response || err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:8000/api/notifications/${id}/read`);
      setNotifications(notifications.map((n) => (n._id === id ? { ...n, read: true, readAt: new Date() } : n)));
      setUnreadCount(Math.max(unreadCount - 1, 0));
      console.log(`Notification ${id} marked as read`);
    } catch (err) {
      setError('Failed to mark notification as read');
      console.error('Error marking notification as read:', err.response || err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/notifications/${id}`);
      const deletedNotification = notifications.find((n) => n._id === id);
      setNotifications(notifications.filter((n) => n._id !== id));
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(Math.max(unreadCount - 1, 0));
      }
      console.log(`Notification ${id} deleted`);
    } catch (err) {
      setError('Failed to delete notification');
      console.error('Error deleting notification:', err.response || err);
    }
  };

  useEffect(() => {
    if (currentUser?.email) {
      fetchNotifications();
    }
  }, [currentUser?.email]);

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 overflow-hidden notification-dropdown">
      <div className="p-4 bg-purple-700 text-white flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recent Notifications ({unreadCount} unread)</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {loading && <div className="p-4 text-center text-gray-500">Loading notifications...</div>}
        {error && <div className="p-4 text-center text-red-500">{error}</div>}
        {!loading && !error && notifications.length === 0 && (
          <div className="p-4 text-center text-gray-500">No recent notifications</div>
        )}
        {!loading &&
          !error &&
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                notification.read ? 'bg-gray-100' : 'bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        notification.type.includes('missed') || notification.type.includes('overdue')
                          ? 'bg-red-200 text-red-800'
                          : 'bg-purple-200 text-purple-800'
                      }`}
                    >
                      {getDisplayType(notification.type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                        timeZone: 'Europe/Paris',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mt-1">{notification.message}</p>
                  {notification.equipmentId?.name && (
                    <p className="text-xs text-gray-500 mt-1">Equipment: {notification.equipmentId.name}</p>
                  )}
                  {notification.siteId && <p className="text-xs text-gray-500 mt-1">Site: {notification.siteId}</p>}
                  {(notification.interventionId?.technician || notification.maintenanceId?.performedBy) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Technician:{' '}
                      {notification.interventionId?.technician?.name ||
                        notification.maintenanceId?.performedBy?.name ||
                        'Unknown'}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="text-purple-600 hover:text-purple-800 text-xs"
                      title="Mark as read"
                    >
                      <FaBell className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="text-red-600 hover:text-red-800 text-xs"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
      <div className="p-4 bg-gray-50 text-center">
        <Link
          to="/technician-dashboard?tab=intervention"
          onClick={onClose}
          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
        >
          View All Notifications
        </Link>
      </div>
    </div>
  );
};

const NetworkTechnicianDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('health');
  const { currentUser } = useSelector((state) => state.user);
  const [notificationCounts, setNotificationCounts] = useState({
    maintenance: 0,
    intervention: 0,
  });
  const [showNotifications, setShowNotifications] = useState(false);

  // Set active tab from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [location.search]);

  // Fetch unread notification counts
  useEffect(() => {
    const fetchNotificationCounts = async () => {
      try {
        const maintenanceResponse = await axios.get('http://localhost:8000/api/notifications', {
          params: {
            notificationCategory: 'maintenance',
            read: 'false',
            email: currentUser?.email,
          },
        });
        const interventionResponse = await axios.get('http://localhost:8000/api/notifications', {
          params: {
            notificationCategory: 'intervention',
            read: 'false',
            email: currentUser?.email,
          },
        });
        setNotificationCounts({
          maintenance: maintenanceResponse.data.total || 0,
          intervention: interventionResponse.data.total || 0,
        });
      } catch (error) {
        console.error('Error fetching notification counts:', error);
      }
    };

    if (currentUser?.email) {
      fetchNotificationCounts();
      const interval = setInterval(fetchNotificationCounts, 120000); // Refresh every 2 minutes
      return () => clearInterval(interval);
    }
  }, [currentUser?.email]);

  // Handle click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest('.notification-dropdown') &&
        !event.target.closest('.notification-bell')
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const networkMetrics = {
    totalNodes: 47,
    criticalNodes: 3,
    activeAlerts: 5,
    bandwidthUtilization: '78%',
    avgLatency: '34ms',
    packetLoss: '0.2%',
    uptime: '99.95%',
  };

  const recentIncidents = [
    {
      id: 1,
      device: 'Core Switch A',
      event: 'High CPU utilization (92%)',
      time: '8 mins ago',
      severity: 'high',
    },
    {
      id: 2,
      device: 'Router Cluster',
      event: 'BGP neighbor down',
      time: '15 mins ago',
      severity: 'critical',
    },
    {
      id: 3,
      device: 'Firewall-01',
      event: 'DDoS mitigation activated',
      time: '42 mins ago',
      severity: 'medium',
    },
  ];

  const handleSignOut = async () => {
    try {
      await axios.post('http://localhost:8000/signout');
      dispatch(signoutSuccess());
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Fixed Sidebar - Gradient Purple */}
      <div className="fixed top-0 left-0 w-64 h-screen bg-gradient-to-b from-purple-900 to-purple-800 text-purple-100 flex flex-col p-0 shadow-xl z-50">
        <div className="p-6 pb-4 border-b border-purple-700">
          <div className="flex items-center space-x-3">
            <FaNetworkWired className="text-2xl text-purple-300" />
            <h1 className="text-xl font-bold">Network Command</h1>
          </div>
          <div className="mt-4 text-sm text-purple-300">
            <div className="font-medium text-white">{currentUser?.username || 'Network Technician'}</div>
            <div className="text-xs truncate mt-1">{currentUser?.email}</div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <Link
                to="/technician-dashboard?tab=health"
                className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                  activeTab === 'health'
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'hover:bg-purple-700/50 hover:text-white'
                }`}
              >
                <FaTachometerAlt className="mr-3 text-purple-300" />
                Health Dashboard
                {networkMetrics.criticalNodes > 0 && (
                  <span className="ml-auto bg-red-500/90 text-xs font-semibold px-2 py-1 rounded-full">
                    {networkMetrics.criticalNodes}
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                to="/technician-dashboard?tab=intervention"
                className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                  activeTab === 'intervention'
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'hover:bg-purple-700/50 hover:text-white'
                }`}
              >
                <FaServer className="mr-3 text-purple-300" />
                Interventions
                {(notificationCounts.maintenance + notificationCounts.intervention) > 0 && (
                  <span className="ml-auto bg-purple-600/90 text-xs font-semibold px-2 py-1 rounded-full">
                    {notificationCounts.maintenance + notificationCounts.intervention}
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                to="/technician-dashboard?tab=topologyViewer"
                className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                  activeTab === 'topologyViewer'
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'hover:bg-purple-700/50 hover:text-white'
                }`}
              >
                <FaProjectDiagram className="mr-3 text-purple-300" />
                Maintenance
              </Link>
            </li>
            <li>
              <Link
                to="/technician-dashboard?tab=trafficAnalyzer"
                className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                  activeTab === 'trafficAnalyzer'
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'hover:bg-purple-700/50 hover:text-white'
                }`}
              >
                <FaChartLine className="mr-3 text-purple-300" />
                Map
                <span className="ml-auto bg-purple-600/90 text-xs font-semibold px-2 py-1 rounded-full">
                  {networkMetrics.bandwidthUtilization}
                </span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-purple-700">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-2 text-sm text-purple-200 hover:text-white rounded-lg hover:bg-purple-700/50 transition-all"
          >
            <FaSignOutAlt className="mr-3" />
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-purple-100/50">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="relative w-96">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="text-purple-400" />
              </div>
              <input
                type="text"
                placeholder="Search by IP, MAC, hostname, interface..."
                className="w-full pl-10 pr-32 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white/90"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-xs text-purple-500">Ctrl+K</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium">NOC Connected</span>
              </div>

              <div className="relative notification-bell">
                <Link
                  to="/technician-dashboard?tab=intervention"
                  className="relative p-2 text-purple-500 hover:text-purple-700 rounded-full hover:bg-purple-100 transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowNotifications(!showNotifications);
                  }}
                >
                  <FaBell className="text-lg" />
                  {(notificationCounts.maintenance + notificationCounts.intervention) > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {notificationCounts.maintenance + notificationCounts.intervention}
                    </span>
                  )}
                </Link>
                {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-right hidden md:block">
                  <div className="font-medium text-gray-800">{currentUser?.username || 'Network Technician'}</div>
                  <div className="text-xs text-purple-600 truncate max-w-[180px]">{currentUser?.email}</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center border border-purple-200">
                  <FaUserCircle className="text-xl text-purple-700" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-white/90 to-purple-50/90">
          {activeTab === 'health' && <NetworkHealthDashboard metrics={networkMetrics} incidents={recentIncidents} />}
          {activeTab === 'intervention' && <InterventionsTech />}
          {activeTab === 'topologyViewer' && <LiveTopologyViewer />}
          {activeTab === 'trafficAnalyzer' && <TrafficAnalyzer />}
          {activeTab === 'AlertWarRoom' && <AlertWarRoom />}
          {activeTab === 'ToolBox' && <TechToolbox />}
        </main>
      </div>
    </div>
  );
};

export default NetworkTechnicianDashboard;