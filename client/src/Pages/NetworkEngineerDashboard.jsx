import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  FaHome,
  FaServer,
  FaChartBar,
  FaBell,
  FaSignOutAlt,
  FaUserCircle,
  FaSearch,
  FaNetworkWired,
  FaProjectDiagram,
  FaTools,
  FaChartPie
} from "react-icons/fa";
import { signoutSuccess } from '../redux/user/userSlice';
import axios from 'axios';
import NetworkOverview from "../components/NetworkEngineer/NetworkOverview";
import NetworkDeviceManagement from "../components/NetworkEngineer/NetworkDeviceManagement";
import NetworkTopology from "../components/NetworkEngineer/NetworkTopology";
import NetworkReports from "../components/NetworkEngineer/NetworkReports";
import NetworkAlerts from "../components/NetworkEngineer/NetworkAlerts";
import NetworkSettings from "../components/NetworkEngineer/NetworkSettings";
import Notifications from "../components/NetworkEngineer/Notification";
import StatisticsDashboard from "../components/NetworkEngineer/StatisticsDashboard";

const NotificationDropdown = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/notifications', {
        params: { limit: 10, read: 'false' }
      });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.total);
      setError(null);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkNotifications = async () => {
    try {
      await axios.post('http://localhost:3000/api/notifications/check');
      fetchNotifications();
    } catch (err) {
      setError('Failed to check notifications');
      console.error('Error checking notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true, readAt: new Date() } : n));
      setUnreadCount(unreadCount - 1);
    } catch (err) {
      setError('Failed to mark notification as read');
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
      if (!notifications.find(n => n._id === id).read) {
        setUnreadCount(unreadCount - 1);
      }
    } catch (err) {
      setError('Failed to delete notification');
      console.error('Error deleting notification:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
      <div className="p-4 bg-teal-700 text-white flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notifications ({unreadCount} unread)</h3>
        <button
          onClick={checkNotifications}
          className="text-sm bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded-full transition"
        >
          Check Now
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {loading && <div className="p-4 text-center text-gray-500">Loading notifications...</div>}
        {error && <div className="p-4 text-center text-red-500">{error}</div>}
        {!loading && !error && notifications.length === 0 && (
          <div className="p-4 text-center text-gray-500">No new notifications</div>
        )}
        {!loading && !error && notifications.map(notification => (
          <div
            key={notification._id}
            className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition ${
              notification.read ? 'bg-gray-100' : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    notification.type === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'
                  }`}>
                    {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleString('en-US', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-800 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Equipment: {notification.equipmentId?.name || 'Unknown'}
                </p>
                {notification.maintenanceId?.performedBy && (
                  <p className="text-xs text-gray-500">
                    Technician: {notification.maintenanceId.performedBy}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification._id)}
                    className="text-teal-600 hover:text-teal-800 text-xs"
                    title="Mark as read"
                  >
                    <FaBell />
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
          to="/network-dashboard?tab=notifications"
          onClick={onClose}
          className="text-teal-600 hover:text-teal-800 text-sm font-medium"
        >
          View All Notifications
        </Link>
      </div>
    </div>
  );
};

const NetworkEngineerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    setActiveTab(tabFromUrl || 'overview');
  }, [location.search]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/notifications', {
          params: { read: 'false', limit: 10 }
        });
        setUnreadCount(response.data.total);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notification-dropdown') && !event.target.closest('.notification-bell')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await axios.post('http://localhost:3000/signout');
      dispatch(signoutSuccess());
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const networkStats = {
    totalDevices: 89,
    activeDevices: 82,
    networkAlerts: 7,
    bandwidthUsage: "65%",
    latency: "28ms",
    uptime: "99.98%"
  };

  const recentNetworkEvents = [
    { id: 1, device: "Core Router 1", event: "Configuration updated", time: "5 mins ago", status: "success" },
    { id: 2, device: "Switch Cluster A", event: "Port flap detected", time: "22 mins ago", status: "warning" },
    { id: 3, device: "Firewall Main", event: "Security policy applied", time: "1 hour ago", status: "success" }
  ];

  const username = 'NetworkEngineer';

  return (
    <div className="flex min-h-screen bg-teal-50">
      {/* Fixed Sidebar */}
      <div className="fixed top-0 left-0 w-64 h-screen bg-teal-800 text-white flex flex-col p-0 shadow-xl z-50">
        <div className="p-6 pb-4 border-b border-teal-700">
          <div className="flex items-center space-x-3">
            <FaNetworkWired className="text-2xl text-teal-300" />
            <h1 className="text-xl font-bold">Network Operations</h1>
          </div>
          <div className="mt-4 text-sm text-teal-200">
            Welcome back, <span className="font-medium text-white">{username}</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {[
              { tab: 'overview', icon: FaHome, text: 'Network Overview', badge: null },
              { tab: 'devices', icon: FaServer, text: 'Device Management', badge: networkStats.totalDevices },
              { tab: 'topology', icon: FaProjectDiagram, text: 'Network Topology', badge: null },
              { tab: 'reports', icon: FaChartBar, text: 'Performance Reports', badge: null },
              { tab: 'alerts', icon: FaBell, text: 'Network Alerts', badge: networkStats.networkAlerts },
              { tab: 'notifications', icon: FaBell, text: 'Notifications', badge: unreadCount },
              { tab: 'tools', icon: FaTools, text: 'Network Tools', badge: null },
              { tab: 'statistics', icon: FaChartPie, text: 'Statistics Dashboard', badge: null }
            ].map(({ tab, icon: Icon, text, badge }) => (
              <li key={tab}>
                <Link 
                  to={`/network-dashboard?tab=${tab}`} 
                  className={`flex items-center px-4 py-3 rounded-lg ${
                    activeTab === tab ? 'bg-teal-700 text-white font-medium' : 'hover:bg-teal-700 hover:text-white'
                  } transition`}
                >
                  <Icon className="mr-3 text-teal-300" />
                  {text}
                  {badge !== null && (
                    <span className="ml-auto bg-teal-600 text-xs font-semibold px-2 py-1 rounded-full">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-teal-700">
          <button 
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-2 text-sm text-teal-200 hover:text-white rounded-lg hover:bg-teal-700 transition"
          >
            <FaSignOutAlt className="mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area with Margin to Account for Fixed Sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="relative w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search devices, IPs, interfaces..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative notification-bell">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-500 hover:text-teal-600 rounded-full hover:bg-teal-50"
                >
                  <FaBell className="text-xl" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <NotificationDropdown onClose={() => setShowNotifications(false)} />
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="text-right hidden md:block">
                  <div className="font-medium text-gray-800">{username}</div>
                  <div className="text-xs text-gray-500">Network Engineer</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <FaUserCircle className="text-2xl text-teal-700" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-teal-50">
          {activeTab === 'overview' && <NetworkOverview stats={networkStats} recentEvents={recentNetworkEvents} />}
          {activeTab === 'devices' && <NetworkDeviceManagement />}
          {activeTab === 'topology' && <NetworkTopology />}
          {activeTab === 'reports' && <NetworkReports />}
          {activeTab === 'alerts' && <NetworkAlerts />}
          {activeTab === 'notifications' && <Notifications />}
          {activeTab === 'tools' && <NetworkSettings />}
          {activeTab === 'statistics' && <StatisticsDashboard />}
        </main>
      </div>
    </div>
  );
};

export default NetworkEngineerDashboard;