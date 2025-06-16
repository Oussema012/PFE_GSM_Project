import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBell, FaWrench, FaExclamationTriangle, FaUsers, FaChartBar, FaMapMarkerAlt } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import DashInterventions from './DashInterventions';
import DashMapSites from './DashMapSites';
import DashNotifications from './DashNotifications';
import DashReports from './DashReports';
import DashSiteManagement from './DashSiteManagement';
import DashUserManagement from './DashUserManagement';
import SiteDetails from './SiteDetails';

const DashOverview = () => {
  const [metrics, setMetrics] = useState({
    totalSites: 0,
    activeAlerts: 0,
    pendingInterventions: 0,
    upcomingMaintenances: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // Track current dashboard view

  // Set axios base URL
  axios.defaults.baseURL = 'http://localhost:8000';

  // Fetch overview metrics
// Fetch overview metrics
// Fetch overview metrics
const fetchMetrics = async () => {
  setLoading(true);
  setError('');
  try {
    const [sitesRes, alertsRes, interventionsRes, maintenancesRes, usersRes] = await Promise.all([
      axios.get('/api/sites'),
      axios.get('/api/alerts', { params: { status: 'active' } }),
      axios.get('/api/interventions/all', { params: { status: 'planned' } }),
      axios.get('/api/maintenance', { params: { status: 'planned' } }),
      axios.get('/api/users'),
    ]);

    setMetrics({
      totalSites: Array.isArray(sitesRes.data) ? sitesRes.data.length : 0,
      activeAlerts: Array.isArray(alertsRes.data) ? alertsRes.data.length : 0,
      pendingInterventions: Array.isArray(interventionsRes.data.data) ? interventionsRes.data.data.filter(i => i.status === 'planned').length : 0, // Handle data.data and filter
      upcomingMaintenances: Array.isArray(maintenancesRes.data) ? maintenancesRes.data.filter(m => m.status === 'pending').length : 0, // Filter by pending
      totalUsers: Array.isArray(usersRes.data) ? usersRes.data.length : 0,
    });
  } catch (err) {
    setError(`Failed to fetch metrics: ${err.response?.data?.message || err.message}`);
    console.error('Fetch metrics error:', err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Handle Quick Access link click
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Metric Card Component
  const MetricCard = ({ title, value, icon: Icon, color, tab }) => (
    <div
      onClick={() => handleTabChange(tab)}
      className={`p-6 rounded-lg shadow-md border-l-4 ${color} bg-white hover:bg-gray-50 transition-colors cursor-pointer`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-gray-500" />
      </div>
    </div>
  );

  // Render the active dashboard component
  const renderContent = () => {
    switch (activeTab) {
      case 'interventions':
        return <DashInterventions />;
      case 'mapsites':
        return <DashMapSites />;
      case 'notifications':
        return <DashNotifications />;
      case 'reports':
        return <DashReports />;
      case 'sites':
        return <DashSiteManagement />;
      case 'users':
        return <DashUserManagement />;
      case 'overview':
      default:
        return (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <MetricCard
                title="Total Sites"
                value={metrics.totalSites}
                icon={FaMapMarkerAlt}
                color="border-blue-500"
                tab="sites"
              />
              <MetricCard
                title="Active Alerts"
                value={metrics.activeAlerts}
                icon={FaExclamationTriangle}
                color="border-red-500"
                tab="notifications"
              />
              <MetricCard
                title="Pending Interventions"
                value={metrics.pendingInterventions}
                icon={FaBell}
                color="border-orange-500"
                tab="interventions"
              />
              <MetricCard
                title="Upcoming Maintenances"
                value={metrics.upcomingMaintenances}
                icon={FaWrench}
                color="border-yellow-500"
                tab="mapsites"
              />
              <MetricCard
                title="Total Users"
                value={metrics.totalUsers}
                icon={FaUsers}
                color="border-green-500"
                tab="users"
              />
            </div>

            {/* Quick Access Links */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  onClick={() => handleTabChange('interventions')}
                  className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <h3 className="text-sm font-medium text-indigo-600">Interventions</h3>
                  <p className="text-xs text-gray-600">Manage and track network interventions</p>
                </div>
                <div
                  onClick={() => handleTabChange('mapsites')}
                  className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer"
                >
                  <h3 className="text-sm font-medium text-yellow-600">Map Sites Maintenance</h3>
                  <p className="text-xs text-gray-600">View and schedule maintenance tasks</p>
                </div>
                <div
                  onClick={() => handleTabChange('notifications')}
                  className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <h3 className="text-sm font-medium text-red-600">Notifications</h3>
                  <p className="text-xs text-gray-600">Monitor alerts and notifications</p>
                </div>
                <div
                  onClick={() => handleTabChange('reports')}
                  className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
                >
                  <h3 className="text-sm font-medium text-green-600">Reports</h3>
                  <p className="text-xs text-gray-600">Access analytics and reports</p>
                </div>
                <div
                  onClick={() => handleTabChange('sites')}
                  className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <h3 className="text-sm font-medium text-blue-600">Site Management</h3>
                  <p className="text-xs text-gray-600">Manage network sites and equipment</p>
                </div>
                <div
                  onClick={() => handleTabChange('users')}
                  className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
                >
                  <h3 className="text-sm font-medium text-purple-600">User Management</h3>
                  <p className="text-xs text-gray-600">Manage users and permissions</p>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="bg-white shadow rounded-lg mb-6">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaChartBar className="mr-2 text-indigo-600" />
              Network Dashboard
            </h1>
            {activeTab === 'overview' && (
              <button
                onClick={fetchMetrics}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
                aria-label="Refresh metrics"
              >
                {loading ? (
                  <FiRefreshCw className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <FiRefreshCw className="h-5 w-5 mr-2" />
                )}
                Refresh
              </button>
            )}
            {activeTab !== 'overview' && (
              <button
                onClick={() => handleTabChange('overview')}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
                aria-label="Back to overview"
              >
                <FaChartBar className="h-5 w-5 mr-2" />
                Back to Overview
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {/* Error Message */}
        {error && activeTab === 'overview' && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 text-red-700 rounded-lg shadow-sm">
            <span className="font-medium">{error}</span>
          </div>
        )}

        {renderContent()}
      </main>

      {/* Custom Tailwind Animation */}
      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default DashOverview;