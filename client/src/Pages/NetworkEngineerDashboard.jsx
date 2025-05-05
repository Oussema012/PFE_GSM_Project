import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  FaHome, 
  FaUsers,
  FaServer, 
  FaChartBar,
  FaBell,
  FaCog, 
  FaSignOutAlt,
  FaUserCircle,
  FaSearch,
  FaUserShield,
  FaDesktop,
  FaNetworkWired,
  FaProjectDiagram,
  FaTools
} from "react-icons/fa";

import axios from 'axios';
import NetworkOverview from "../components/NetworkEngineer/NetworkOverview";
import NetworkDeviceManagement from "../components/NetworkEngineer/NetworkDeviceManagement";
import NetworkTopology from "../components/NetworkEngineer/NetworkTopology";
import NetworkReports from "../components/NetworkEngineer/NetworkReports";
import NetworkAlerts from "../components/NetworkEngineer/NetworkAlerts";
import NetworkSettings from "../components/NetworkEngineer/NetworkSettings";


const NetworkEngineerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab('overview');
    }
  }, [location.search]);

  // Network-specific mock data
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
      {/* Sidebar - Teal */}
      <div className="w-64 bg-teal-800 text-white flex flex-col p-0 shadow-xl">
        {/* Sidebar Header */}
        <div className="p-6 pb-4 border-b border-teal-700">
          <div className="flex items-center space-x-3">
            <FaNetworkWired className="text-2xl text-teal-300" />
            <h1 className="text-xl font-bold">Network Operations</h1>
          </div>
          <div className="mt-4 text-sm text-teal-200">
            Welcome back, <span className="font-medium text-white">{username}</span>
          </div>
        </div>
        
        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <Link 
                to="/network-dashboard?tab=overview" 
                className={`flex items-center px-4 py-3 rounded-lg ${activeTab === 'overview' ? 'bg-teal-700 text-white font-medium' : 'hover:bg-teal-700 hover:text-white'} transition`}
              >
                <FaHome className="mr-3 text-teal-300" />
                Network Overview
              </Link>
            </li>
            <li>
              <Link 
                to="/network-dashboard?tab=devices" 
                className={`flex items-center px-4 py-3 rounded-lg ${activeTab === 'devices' ? 'bg-teal-700 text-white font-medium' : 'hover:bg-teal-700 hover:text-white'} transition`}
              >
                <FaServer className="mr-3 text-teal-300" />
                Device Management
                <span className="ml-auto bg-teal-600 text-xs font-semibold px-2 py-1 rounded-full">
                  {networkStats.totalDevices}
                </span>
              </Link>
            </li>
            <li>
              <Link 
                to="/network-dashboard?tab=topology" 
                className={`flex items-center px-4 py-3 rounded-lg ${activeTab === 'topology' ? 'bg-teal-700 text-white font-medium' : 'hover:bg-teal-700 hover:text-white'} transition`}
              >
                <FaProjectDiagram className="mr-3 text-teal-300" />
                Network Topology
              </Link>
            </li>
            <li>
              <Link 
                to="/network-dashboard?tab=reports" 
                className={`flex items-center px-4 py-3 rounded-lg ${activeTab === 'reports' ? 'bg-teal-700 text-white font-medium' : 'hover:bg-teal-700 hover:text-white'} transition`}
              >
                <FaChartBar className="mr-3 text-teal-300" />
                Performance Reports
              </Link>
            </li>
            <li>
              <Link 
                to="/network-dashboard?tab=alerts" 
                className={`flex items-center px-4 py-3 rounded-lg ${activeTab === 'alerts' ? 'bg-teal-700 text-white font-medium' : 'hover:bg-teal-700 hover:text-white'} transition`}
              >
                <FaBell className="mr-3 text-teal-300" />
                Network Alerts
                <span className="ml-auto bg-teal-600 text-xs font-semibold px-2 py-1 rounded-full">
                  {networkStats.networkAlerts}
                </span>
              </Link>
            </li>
            <li>
              <Link 
                to="/network-dashboard?tab=tools" 
                className={`flex items-center px-4 py-3 rounded-lg ${activeTab === 'tools' ? 'bg-teal-700 text-white font-medium' : 'hover:bg-teal-700 hover:text-white'} transition`}
              >
                <FaTools className="mr-3 text-teal-300" />
                Network Tools
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-teal-700">
          <button 
            className="flex items-center w-full px-4 py-2 text-sm text-teal-200 hover:text-white rounded-lg hover:bg-teal-700 transition"
          >
            <FaSignOutAlt className="mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Network Search Bar */}
            <div className="relative w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search devices, IPs, interfaces..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            
            {/* User Info and Notifications */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-teal-600 rounded-full hover:bg-teal-50">
                <FaBell className="text-xl" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
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

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-teal-50">
          {activeTab === 'overview' && <NetworkOverview stats={networkStats} recentEvents={recentNetworkEvents} />}
          {activeTab === 'devices' && <NetworkDeviceManagement />}
          {activeTab === 'topology' && <NetworkTopology />}
          {activeTab === 'reports' && <NetworkReports />}
          {activeTab === 'alerts' && <NetworkAlerts />}
          {activeTab === 'tools' && <NetworkSettings/>}
        </main>
      </div>
    </div>
  );
};

export default NetworkEngineerDashboard;