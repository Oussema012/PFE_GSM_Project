import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  FaClock
} from "react-icons/fa";

// Import components
import NetworkHealthDashboard from "../components/NetworkTechnician/NetworkHealthDashboard";
import DeviceCommandCenter from "../components/NetworkTechnician/DeviceCommandCenter";
import LiveTopologyViewer from "../components/NetworkTechnician/LiveTopologyViewer";
import TrafficAnalyzer from "../components/NetworkTechnician/TrafficAnalyzer";
import AlertWarRoom from "../components/NetworkTechnician/AlertWarRoom";
import TechToolbox from "../components/NetworkTechnician/TechToolbox";

const NetworkTechnicianDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('health');
  
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [location.search]);

  // Network metrics data
  const networkMetrics = {
    totalNodes: 47,
    criticalNodes: 3,
    activeAlerts: 5,
    bandwidthUtilization: "78%",
    avgLatency: "34ms",
    packetLoss: "0.2%",
    uptime: "99.95%"
  };

  const recentIncidents = [
    { id: 1, device: "Core Switch A", event: "High CPU utilization (92%)", time: "8 mins ago", severity: "high" },
    { id: 2, device: "Router Cluster", event: "BGP neighbor down", time: "15 mins ago", severity: "critical" },
    { id: 3, device: "Firewall-01", event: "DDoS mitigation activated", time: "42 mins ago", severity: "medium" }
  ];

  const username = 'NetworkTechnician';

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Sidebar - Gradient Purple */}
      <div className="w-64 bg-gradient-to-b from-purple-900 to-purple-800 text-purple-100 flex flex-col p-0 shadow-xl">
        {/* Sidebar Header */}
        <div className="p-6 pb-4 border-b border-purple-700">
          <div className="flex items-center space-x-3">
            <FaNetworkWired className="text-2xl text-purple-300" />
            <h1 className="text-xl font-bold">Network Command</h1>
          </div>
          <div className="mt-4 text-sm text-purple-300">
            Technician: <span className="font-medium text-white">{username}</span>
          </div>
        </div>
        
        {/* Navigation */}
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
                to="/technician-dashboard?tab=command" 
                className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                  activeTab === 'command' 
                    ? 'bg-purple-700 text-white shadow-md' 
                    : 'hover:bg-purple-700/50 hover:text-white'
                }`}
              >
                <FaServer className="mr-3 text-purple-300" />
                Device Command
                <span className="ml-auto bg-purple-600/90 text-xs font-semibold px-2 py-1 rounded-full">
                  {networkMetrics.totalNodes}
                </span>
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
                Live Topology
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
                Traffic Analyzer
                <span className="ml-auto bg-purple-600/90 text-xs font-semibold px-2 py-1 rounded-full">
                  {networkMetrics.bandwidthUtilization}
                </span>
              </Link>
            </li>
            <li>
              <Link 
                to="/technician-dashboard?tab=AlertWarRoom" 
                className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                  activeTab === 'AlertWarRoom' 
                    ? 'bg-purple-700 text-white shadow-md' 
                    : 'hover:bg-purple-700/50 hover:text-white'
                }`}
              >
                <FaExclamationTriangle className="mr-3 text-purple-300" />
                Alert War Room
                <span className="ml-auto bg-red-500/90 text-xs font-semibold px-2 py-1 rounded-full">
                  {networkMetrics.activeAlerts}
                </span>
              </Link>
            </li>
            <li>
              <Link 
                to="/technician-dashboard?tab=ToolBox" 
                className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                  activeTab === 'ToolBox' 
                    ? 'bg-purple-700 text-white shadow-md' 
                    : 'hover:bg-purple-700/50 hover:text-white'
                }`}
              >
                <FaTools className="mr-3 text-purple-300" />
                Tech Toolbox
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-purple-700">
          <button 
            className="flex items-center w-full px-4 py-2 text-sm text-purple-200 hover:text-white rounded-lg hover:bg-purple-700/50 transition-all"
          >
            <FaSignOutAlt className="mr-3" />
            Secure Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-purple-100/50">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Network Search */}
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
            
            {/* Status Indicators */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium">NOC Connected</span>
              </div>
              
              <button className="relative p-2 text-purple-500 hover:text-purple-700 rounded-full hover:bg-purple-100 transition-all">
                <FaBell className="text-lg" />
                {networkMetrics.activeAlerts > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="text-right hidden md:block">
                  <div className="font-medium text-gray-800">{username}</div>
                  <div className="text-xs text-purple-600">Senior Network Technician</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center border border-purple-200">
                  <FaUserCircle className="text-xl text-purple-700" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-white/90 to-purple-50/90">
          {activeTab === 'health' && <NetworkHealthDashboard metrics={networkMetrics} incidents={recentIncidents} />}
          {activeTab === 'command' && <DeviceCommandCenter />}
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