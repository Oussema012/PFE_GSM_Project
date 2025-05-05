import React from 'react';
import {
  FaServer,
  FaNetworkWired,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaShieldAlt,
  FaPlug
} from 'react-icons/fa';

const NetworkOverview = ({ stats, recentEvents }) => {
  // Default network stats if not provided
  const networkStats = stats || {
    totalDevices: 42,
    onlineDevices: 38,
    offlineDevices: 4,
    bandwidthUsage: '65%',
    latency: '28ms',
    packetLoss: '0.2%',
    uptime: '99.98%',
    securityEvents: 3,
    throughput: '1.4 Gbps'
  };

  // Default recent events if not provided
  const events = recentEvents || [
    { id: 1, device: 'Core Router 1', event: 'Configuration updated', time: '5 mins ago', status: 'success' },
    { id: 2, device: 'Switch Cluster A', event: 'Port flap detected', time: '22 mins ago', status: 'warning' },
    { id: 3, device: 'Firewall Main', event: 'Security policy applied', time: '1 hour ago', status: 'success' },
    { id: 4, device: 'Server Rack 3', event: 'High CPU usage', time: '1.5 hours ago', status: 'warning' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Status Header */}
      
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Network Health Dashboard</h2>
            <p className="text-teal-100">Real-time monitoring of your network infrastructure</p>
          </div>
          <div className="flex items-center space-x-2 bg-teal-800 px-4 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Operational</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Devices Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Network Devices</p>
              <h3 className="text-3xl font-bold mt-1">{networkStats.onlineDevices}<span className="text-lg text-gray-500">/{networkStats.totalDevices}</span></h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaServer className="text-blue-600 text-xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <FaCheckCircle className="text-green-500 mr-1" />
            <span>{networkStats.onlineDevices} online</span>
            <span className="mx-2">•</span>
            <FaExclamationTriangle className="text-red-500 mr-1" />
            <span>{networkStats.offlineDevices} offline</span>
          </div>
        </div>

        {/* Bandwidth Usage */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Bandwidth Usage</p>
              <h3 className="text-3xl font-bold mt-1">{networkStats.bandwidthUsage}</h3>
              <p className="text-sm text-gray-500 mt-1">1.4 Gbps throughput</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FaChartLine className="text-purple-600 text-xl" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${networkStats.bandwidthUsage > '80%' ? 'bg-red-500' : networkStats.bandwidthUsage > '60%' ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: networkStats.bandwidthUsage }}
              ></div>
            </div>
          </div>
        </div>

        {/* Network Performance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Network Performance</p>
              <h3 className="text-3xl font-bold mt-1">{networkStats.latency}</h3>
              <p className="text-sm text-gray-500 mt-1">{networkStats.packetLoss} packet loss</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaNetworkWired className="text-green-600 text-xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center text-sm text-green-600">
              <FaArrowUp className="mr-1" />
              <span>1.2 Gbps in</span>
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <FaArrowDown className="mr-1" />
              <span>0.9 Gbps out</span>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Security Status</p>
              <h3 className="text-3xl font-bold mt-1">{networkStats.securityEvents}</h3>
              <p className="text-sm text-gray-500 mt-1">active alerts</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FaShieldAlt className="text-red-600 text-xl" />
            </div>
          </div>
          <div className="mt-4">
            <button className="text-sm text-red-600 hover:text-red-700 font-medium">
              View Security Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Recent Events and Network Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Network Events */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Network Events</h2>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="mr-3 mt-1">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`}></div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{event.device}</h4>
                    <span className="text-sm text-gray-500 flex items-center">
                      <FaClock className="mr-1" size={12} />
                      {event.time}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{event.event}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All Events
            </button>
          </div>
        </div>

        {/* Network Map Preview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Network Topology</h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Physical View
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Logical View
              </button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative mx-auto w-48 h-32 mb-4">
                {/* Simple network topology visualization */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaServer className="text-blue-600" />
                </div>
                <div className="absolute bottom-0 left-1/4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FaNetworkWired className="text-green-600" />
                </div>
                <div className="absolute bottom-0 right-1/4 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FaPlug className="text-purple-600" />
                </div>
                {/* Connection lines */}
                <div className="absolute top-8 left-1/2 w-1 h-16 bg-gray-300 transform -translate-x-1/2"></div>
                <div className="absolute top-8 left-1/2 w-16 h-1 bg-gray-300 transform -translate-y-1/2"></div>
              </div>
              <p className="text-gray-500">Network topology visualization</p>
              <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                Open in Topology Viewer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Device Status Overview */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Device Status Overview</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All Devices
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {['Routers', 'Switches', 'Firewalls', 'Servers', 'APs', 'Endpoints'].map((type) => (
            <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 mx-auto bg-teal-100 rounded-full flex items-center justify-center mb-2">
                <FaNetworkWired className="text-teal-600" />
              </div>
              <h4 className="font-medium">{type}</h4>
              <p className="text-sm text-gray-500">{
                type === 'Routers' ? networkStats.totalDevices / 6 :
                type === 'Switches' ? networkStats.totalDevices / 4 :
                type === 'Firewalls' ? 4 :
                type === 'Servers' ? 8 :
                type === 'APs' ? 6 : 12
              } devices</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NetworkOverview;