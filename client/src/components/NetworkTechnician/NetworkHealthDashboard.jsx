import React from 'react';
import { 
  FaServer, 
  FaNetworkWired, 
  FaChartLine, 
  FaClock,
  FaExclamationTriangle, 
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaHistory
} from 'react-icons/fa';

const NetworkHealthDashboard = ({ metrics, incidents }) => {
  // Sample data structure
  const healthMetrics = metrics || {
    totalNodes: 47,
    criticalNodes: 3,
    activeAlerts: 5,
    bandwidthUtilization: "78%",
    avgLatency: "34ms",
    packetLoss: "0.2%",
    uptime: "99.95%",
    throughput: "1.2 Gbps",
    devicesOnline: 42,
    devicesOffline: 5
  };

  const recentEvents = incidents || [
    { id: 1, device: "Core Switch A", event: "High CPU utilization (92%)", time: "8 mins ago", severity: "high" },
    { id: 2, device: "Router Cluster", event: "BGP neighbor down", time: "15 mins ago", severity: "critical" },
    { id: 3, device: "Firewall-01", event: "DDoS mitigation activated", time: "42 mins ago", severity: "medium" }
  ];

  return (
    <div className="space-y-6">
      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Nodes Card */}
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Critical Nodes</p>
              <p className="text-2xl font-bold text-red-600">{healthMetrics.criticalNodes}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <FaExclamationTriangle className="text-xl" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <FaArrowUp className="text-red-500 mr-1" />
            <span>2 more than yesterday</span>
          </div>
        </div>

        {/* Bandwidth Utilization */}
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Bandwidth Utilization</p>
              <p className="text-2xl font-bold text-purple-600">{healthMetrics.bandwidthUtilization}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FaChartLine className="text-xl" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <FaArrowDown className="text-green-500 mr-1" />
            <span>5% less than peak</span>
          </div>
        </div>

        {/* Network Uptime */}
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Network Uptime</p>
              <p className="text-2xl font-bold text-green-600">{healthMetrics.uptime}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaCheckCircle className="text-xl" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span>Last outage: 14 days ago</span>
          </div>
        </div>

        {/* Device Status */}
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Device Status</p>
              <p className="text-2xl font-bold text-blue-600">
                {healthMetrics.devicesOnline}/{healthMetrics.devicesOnline + healthMetrics.devicesOffline} Online
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaServer className="text-xl" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span>{healthMetrics.devicesOffline} devices offline</span>
          </div>
        </div>
      </div>

      {/* Network Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Latency Graph (Placeholder) */}
        <div className="bg-white p-4 rounded-lg shadow col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-800">Network Latency (ms)</h3>
            <div className="flex items-center text-sm text-purple-600">
              <FaHistory className="mr-1" />
              <span>Last 24 hours</span>
            </div>
          </div>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center text-gray-400">
            [Latency Chart Visualization]
            <div className="absolute text-center">
              <p className="text-2xl font-bold text-gray-700">{healthMetrics.avgLatency}</p>
              <p className="text-sm">Average Latency</p>
            </div>
          </div>
        </div>

        {/* Traffic Distribution (Placeholder) */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-800">Traffic Distribution</h3>
            <span className="text-sm text-purple-600">{healthMetrics.throughput}</span>
          </div>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center text-gray-400">
            [Traffic Pie Chart]
          </div>
        </div>
      </div>

      {/* Recent Network Events */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Network Events</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentEvents.map((event) => (
            <div key={event.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${
                    event.severity === 'critical' ? 'bg-red-100 text-red-600' :
                    event.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    <FaExclamationTriangle />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{event.event}</p>
                    <p className="text-sm text-gray-500">{event.device}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  <FaClock className="mr-1" />
                  {event.time}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button className="text-sm font-medium text-purple-600 hover:text-purple-500">
            View all events →
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetworkHealthDashboard;