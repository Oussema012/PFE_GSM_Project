import React, { useState } from 'react';
import { FaFilter, FaSearch, FaBell, FaExclamationTriangle, FaCheckCircle, FaClock, FaTimes } from 'react-icons/fa';

const AlertWarRoom = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample alert data
  const alerts = [
    {
      id: 1,
      title: "High CPU Utilization",
      device: "Core Switch 1",
      severity: "critical",
      status: "unacknowledged",
      timestamp: "2023-05-15 14:32:45",
      description: "CPU usage exceeded 95% for more than 5 minutes"
    },
    {
      id: 2,
      title: "BGP Neighbor Down",
      device: "Edge Router 2",
      severity: "high",
      status: "acknowledged",
      timestamp: "2023-05-15 13:45:22",
      description: "BGP session with 192.168.1.1 has been down for 10 minutes"
    },
    {
      id: 3,
      title: "Interface Flapping",
      device: "Access Switch 5",
      severity: "medium",
      status: "resolved",
      timestamp: "2023-05-15 12:18:37",
      description: "GigabitEthernet1/0/5 has changed state 15 times in 10 minutes"
    },
    {
      id: 4,
      title: "Memory Threshold Exceeded",
      device: "Firewall-01",
      severity: "high",
      status: "unacknowledged",
      timestamp: "2023-05-15 11:05:12",
      description: "Memory usage at 92% capacity"
    },
    {
      id: 5,
      title: "High Bandwidth Utilization",
      device: "WAN Link 3",
      severity: "medium",
      status: "acknowledged",
      timestamp: "2023-05-15 10:32:18",
      description: "Bandwidth utilization at 85% for more than 30 minutes"
    }
  ];

  // Filter alerts based on active filter and search query
  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = activeFilter === 'all' || alert.severity === activeFilter || alert.status === activeFilter;
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         alert.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Acknowledge alert function
  const acknowledgeAlert = (id) => {
    // In a real app, this would update the alert status in your backend
    console.log(`Acknowledged alert ${id}`);
  };

  // Resolve alert function
  const resolveAlert = (id) => {
    // In a real app, this would update the alert status in your backend
    console.log(`Resolved alert ${id}`);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Alert War Room</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search alerts..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="all">All Alerts</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="unacknowledged">Unacknowledged</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2" />
            <span className="font-semibold text-red-700">Critical Alerts</span>
          </div>
          <div className="text-2xl font-bold text-red-800 mt-2">
            {alerts.filter(a => a.severity === 'critical').length}
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaBell className="text-yellow-500 mr-2" />
            <span className="font-semibold text-yellow-700">Unacknowledged</span>
          </div>
          <div className="text-2xl font-bold text-yellow-800 mt-2">
            {alerts.filter(a => a.status === 'unacknowledged').length}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 mr-2" />
            <span className="font-semibold text-green-700">Resolved Today</span>
          </div>
          <div className="text-2xl font-bold text-green-800 mt-2">
            {alerts.filter(a => a.status === 'resolved').length}
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alert
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severity
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAlerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{alert.title}</div>
                  <div className="text-sm text-gray-500">{alert.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {alert.device}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    alert.status === 'unacknowledged' ? 'bg-red-100 text-red-800' :
                    alert.status === 'acknowledged' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <FaClock className="mr-1 text-gray-400" />
                    {alert.timestamp}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {alert.status !== 'acknowledged' && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Acknowledge
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search or filter criteria' : 'All clear! No active alerts'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AlertWarRoom;