import React, { useState, useEffect, useRef } from 'react';
import {
  FaServer,
  FaNetworkWired,
  FaDesktop,
  FaLaptop,
  FaSearch,
  FaEdit,
  FaTrash,
  FaPowerOff,
  FaSync,
  FaFilter,
  FaChevronDown,
  FaEye,
  FaTimes,
  FaCog,
  FaScroll,
  FaTerminal,
  FaPlug,
  FaWifi,
  FaSitemap,
  FaShieldAlt,
  FaMemory,
  FaMicrochip
} from 'react-icons/fa';
import { FaCloud } from 'react-icons/fa';

const NetworkDeviceManagement = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedDevice, setExpandedDevice] = useState(null);
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deviceDetails, setDeviceDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConsoleModal, setShowConsoleModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [config, setConfig] = useState('');
  const [topologyData, setTopologyData] = useState(null);
  const [showTopologyModal, setShowTopologyModal] = useState(false);
  
  // Console state
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [commandInput, setCommandInput] = useState('');
  const [isConsoleConnected, setIsConsoleConnected] = useState(false);
  const consoleEndRef = useRef(null);

  const projectId = "8a320aab-0962-4e2f-8ddf-6ac58e279877";

  // Animation styles
  const modalStyles = `
    @keyframes popIn {
      0% { transform: scale(0.95); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .animate-popIn {
      animation: popIn 0.2s ease-out forwards;
    }
  `;

  // Network device type mapping
  const deviceTypeMap = {
    router: { icon: <FaNetworkWired className="text-blue-500" />, color: 'bg-blue-100 text-blue-800' },
    switch: { icon: <FaNetworkWired className="text-green-500" />, color: 'bg-green-100 text-green-800' },
    firewall: { icon: <FaShieldAlt className="text-red-500" />, color: 'bg-red-100 text-red-800' },
    server: { icon: <FaServer className="text-purple-500" />, color: 'bg-purple-100 text-purple-800' },
    ap: { icon: <FaWifi className="text-yellow-500" />, color: 'bg-yellow-100 text-yellow-800' },
    cloud: { icon: <FaCloud className="text-cyan-500" />, color: 'bg-cyan-100 text-cyan-800' },
    default: { icon: <FaDesktop className="text-gray-400" />, color: 'bg-gray-100 text-gray-800' }
  };

  // Helper functions
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || 'unknown';
    switch (statusLower) {
      case 'up': 
      case 'started': 
      case 'active': 
        return 'bg-green-500';
      case 'down': 
      case 'stopped': 
        return 'bg-red-500';
      case 'suspended': 
      case 'warning': 
        return 'bg-yellow-500';
      default: 
        return 'bg-gray-500';
    }
  };

  const getDeviceType = (name) => {
    if (!name) return 'Unknown';
    
    const lowerName = name.toLowerCase();
    if (/router|^r\d|rt|rtr|isr|asr/.test(lowerName)) return 'Router';
    if (/switch|^s\d|sw|nexus|cat/.test(lowerName)) return 'Switch';
    if (/firewall|fw|palo|forti|asa|checkpoint/.test(lowerName)) return 'Firewall';
    if (/server|srv|vm|esxi|hyperv/.test(lowerName)) return 'Server';
    if (/ap|wlc|wireless|wifi/.test(lowerName)) return 'AP';
    if (/cloud|aws|azure|gcp/.test(lowerName)) return 'Cloud';
    return 'Unknown';
  };

  const getDeviceIcon = (name) => {
    const type = getDeviceType(name).toLowerCase();
    return deviceTypeMap[type]?.icon || deviceTypeMap.default.icon;
  };

  // API functions
  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:5000/api/gns3/sync-devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setDevices(data.devices || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching devices:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceDetails = async (projectId, nodeId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/gns3/device-details/${projectId}/${nodeId}`);
      const data = await response.json();
      return {
        ...data.details,
        type: getDeviceType(data.details?.name),
        interfaces: data.details?.interfaces?.map(intf => ({
          ...intf,
          status: intf.status || 'DOWN',
          bandwidth: intf.bandwidth || 'N/A',
          protocol: intf.protocol || 'N/A'
        })) || []
      };
    } catch (error) {
      console.error("Error fetching device details:", error);
      return null;
    }
  };

  const fetchDeviceConfig = async (device) => {
    try {
      const response = await fetch(`http://localhost:5000/api/gns3/device-config/${device.projectId}/${device.nodeId}`);
      const data = await response.json();
      setConfig(data.config || 'No configuration available');
      setShowConfigModal(true);
      setCurrentDevice(device);
    } catch (error) {
      console.error("Error fetching config:", error);
      setError("Failed to fetch configuration");
    }
  };

  const fetchTopologyData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/gns3/topology/${projectId}`);
      const data = await response.json();
      setTopologyData(data);
      setShowTopologyModal(true);
    } catch (error) {
      console.error("Error fetching topology:", error);
      setError("Failed to load network topology");
    }
  };

  // Console functions
  const connectToConsole = async (device) => {
    try {
      // Simulate connecting to console
      setIsConsoleConnected(false);
      setConsoleOutput([`Connecting to ${device.name} (${device.ip || 'no IP'})...`]);
      
      // In a real implementation, you would establish a WebSocket connection here
      setTimeout(() => {
        setIsConsoleConnected(true);
        addConsoleOutput(`Connected to ${device.name}`);
        addConsoleOutput('Escape character is \'^]\'.');
        addConsoleOutput(`${device.name}> `);
      }, 1000);
      
    } catch (error) {
      console.error("Error connecting to console:", error);
      addConsoleOutput(`Error: ${error.message}`);
    }
  };

  const addConsoleOutput = (text) => {
    setConsoleOutput(prev => [...prev, text]);
    setTimeout(() => {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const sendCommand = async () => {
    if (!commandInput.trim()) return;
    
    // Add the command to the output
    addConsoleOutput(commandInput);
    
    // Clear the input
    const cmd = commandInput;
    setCommandInput('');
    
    try {
      // In a real implementation, you would send this command via WebSocket
      // For now, we'll simulate a response
      setTimeout(() => {
        // Simulate command response based on device type
        const deviceType = getDeviceType(currentDevice.name).toLowerCase();
        let response = '';
        
        if (deviceType === 'router' || deviceType === 'switch') {
          if (cmd.toLowerCase() === 'show version') {
            response = 
`Cisco IOS Software, 7200 Software (C7200-ADVENTERPRISEK9-M), Version 15.2(4)M1, RELEASE SOFTWARE (fc1)
Technical Support: http://www.cisco.com/techsupport
Copyright (c) 1986-2012 by Cisco Systems, Inc.
Compiled Thu 26-Jul-12 03:21 by prod_rel_team`;
          } else if (cmd.toLowerCase() === 'show ip interface brief') {
            response = 
`Interface                  IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0         192.168.1.1     YES manual up                    up      
GigabitEthernet0/1         unassigned      YES unset  administratively down down    
Loopback0                  1.1.1.1         YES manual up                    up`;
          } else if (cmd.toLowerCase().startsWith('ping')) {
            response = 
`Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 8.8.8.8, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`;
          } else {
            response = `% Unrecognized command: ${cmd}`;
          }
        } else if (deviceType === 'firewall') {
          response = `> ${cmd}\nCommand executed successfully`;
        } else {
          response = `${currentDevice.name}# ${cmd}\nCommand output would appear here`;
        }
        
        // Add the response to the console output
        addConsoleOutput(response);
        addConsoleOutput(`${currentDevice.name}> `);
      }, 500);
      
    } catch (error) {
      addConsoleOutput(`Error executing command: ${error.message}`);
      addConsoleOutput(`${currentDevice.name}> `);
    }
  };

  // Event handlers
  const handleViewDetails = async (device) => {
    try {
      const details = await getDeviceDetails(device.projectId, device.nodeId);
      setDeviceDetails(details);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching device details:", error);
      setError("Failed to load device details");
    }
  };

  const toggleExpand = (device) => {
    setExpandedDevice(expandedDevice === device.id ? null : device.id);
  };

  const refreshDevices = () => fetchDevices();

  const powerCycleDevice = async (device, action) => {
    try {
      const response = await fetch(`http://localhost:5000/api/gns3/power/${device.projectId}/${device.nodeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      
      if (!response.ok) throw new Error(`Failed to ${action} device`);
      
      // Refresh devices after power operation
      setTimeout(refreshDevices, 2000);
    } catch (error) {
      console.error(`Error ${action} device:`, error);
      setError(`Failed to ${action} device`);
    }
  };

  const handleConsoleOpen = (device) => {
    setCurrentDevice(device);
    setConsoleOutput([]);
    setCommandInput('');
    setShowConsoleModal(true);
    connectToConsole(device);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendCommand();
    }
  };

  // Effects
  useEffect(() => {
    fetchDevices();
  }, [projectId]);

  useEffect(() => {
    if (showConsoleModal && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleOutput, showConsoleModal]);

  // Filtered devices
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (device.ip && device.ip.includes(searchTerm));
    
    const matchesStatusFilter = 
      activeFilter === 'all' || 
      (activeFilter === 'active' && device.DeviceStatus?.toLowerCase() === 'started') ||
      (activeFilter === 'inactive' && device.DeviceStatus?.toLowerCase() === 'stopped') ||
      (activeFilter === 'warning' && device.DeviceStatus?.toLowerCase() === 'suspended');
    
    return matchesSearch && matchesStatusFilter;
  });

  // Loading and error states
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Discovering network devices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Network Error: {error}</div>
        <button 
          onClick={refreshDevices}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Retry Discovery
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{modalStyles}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Network Device Management</h1>
          <p className="text-gray-600">Monitor and manage your network infrastructure</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={fetchTopologyData}
            className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 px-4 py-2"
          >
            <FaSitemap className="text-gray-600" />
            <span>View Topology</span>
          </button>
          <button 
            onClick={refreshDevices}
            className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 px-4 py-2"
          >
            <FaSync className={`text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by hostname, IP, or MAC..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2">
          <FaFilter className="text-gray-500 mr-2" />
          <select
            className="appearance-none focus:outline-none bg-transparent"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active/Up</option>
            <option value="warning">Warning/Suspended</option>
            <option value="inactive">Inactive/Down</option>
          </select>
          <FaChevronDown className="text-gray-500 ml-2" />
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Management IP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDevices.map((device) => (
                <React.Fragment key={device.id || device.nodeId}>
                  <tr className="hover:bg-gray-50 cursor-pointer">
                    <td 
                      className="px-6 py-4 whitespace-nowrap"
                      onClick={() => toggleExpand(device)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          {getDeviceIcon(device.name)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{device.name}</div>
                          <div className="text-sm text-gray-500">{device.nodeId}</div>
                        </div>
                      </div>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      onClick={() => toggleExpand(device)}
                    >
                      {device.ip || 'Not configured'}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap"
                      onClick={() => toggleExpand(device)}
                    >
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(device.DeviceStatus)}`}></span>
                        <span className="text-sm">
                          {device.DeviceStatus?.charAt(0)?.toUpperCase() + device.DeviceStatus?.slice(1) || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap"
                      onClick={() => toggleExpand(device)}
                    >
                      <span className={`px-2 py-1 text-xs rounded-full ${deviceTypeMap[getDeviceType(device.name).toLowerCase()]?.color || deviceTypeMap.default.color}`}>
                        {getDeviceType(device.name)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(device);
                          }}
                          title="View details"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConsoleOpen(device);
                          }}
                          title="Console access"
                        >
                          <FaTerminal />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            powerCycleDevice(device, 'stop');
                          }}
                          title="Power off"
                        >
                          <FaPowerOff />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedDevice === device.id && (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">MAC Address</h4>
                            <p className="text-sm text-gray-900 mt-1 font-mono">{device.macAddress || 'N/A'}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Last Seen</h4>
                            <p className="text-sm text-gray-900 mt-1">{device.lastSeen || 'N/A'}</p>
                          </div>
                          <div className="flex items-end space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchDeviceConfig(device);
                              }}
                              className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                            >
                              <FaCog className="mr-1" /> Show Config
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                powerCycleDevice(device, 'restart');
                              }}
                              className="flex items-center px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                            >
                              <FaSync className="mr-1" /> Reboot
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredDevices.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FaSearch className="mx-auto text-gray-400 text-4xl mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No network devices found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search criteria' : 'No devices detected in this project'}
          </p>
          <button 
            onClick={refreshDevices}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Rescan Network
          </button>
        </div>
      )}

      {/* Console Access Modal */}
      {showConsoleModal && currentDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="animate-popIn bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" style={{ height: '80vh' }}>
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <FaTerminal className={`mr-2 ${isConsoleConnected ? 'text-green-500' : 'text-yellow-500'}`} />
                  <h3 className="text-xl font-bold text-gray-900">
                    Console - {currentDevice.name}
                    <span className={`ml-2 text-sm font-normal ${isConsoleConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                      {isConsoleConnected ? 'Connected' : 'Connecting...'}
                    </span>
                  </h3>
                </div>
                <button
                  onClick={() => setShowConsoleModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-black p-4 overflow-auto">
              <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                {consoleOutput.map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
                <div ref={consoleEndRef} />
              </pre>
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isConsoleConnected ? "Enter command..." : "Connecting..."}
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!isConsoleConnected}
                />
                <button
                  onClick={sendCommand}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={!isConsoleConnected || !commandInput.trim()}
                >
                  Send
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {isConsoleConnected ? (
                  <span>Press Enter or click Send to execute command</span>
                ) : (
                  <span>Establishing connection to {currentDevice.name}...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && currentDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="animate-popIn bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <div className="flex items-center">
                  <FaCog className="text-blue-500 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Configuration - {currentDevice.name}
                  </h3>
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="bg-gray-900 p-4 rounded-lg overflow-auto">
                <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
                  {config.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="text-gray-500 w-8 flex-shrink-0">{i + 1}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </pre>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleString()}
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Save Running Config
                  </button>
                  <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                    Compare Configs
                  </button>
                  <button
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Network Topology Modal */}
      {showTopologyModal && topologyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="animate-popIn bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <div className="flex items-center">
                  <FaSitemap className="text-purple-500 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Network Topology View
                  </h3>
                </div>
                <button
                  onClick={() => setShowTopologyModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-center items-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">Network topology visualization would appear here</p>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-2">Network Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Devices:</span>
                        <span className="font-medium">{devices.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Active:</span>
                        <span className="font-medium text-green-600">
                          {devices.filter(d => d.DeviceStatus?.toLowerCase() === 'started').length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Down:</span>
                        <span className="font-medium text-red-600">
                          {devices.filter(d => d.DeviceStatus?.toLowerCase() === 'stopped').length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-2">Device Types</h4>
                    <div className="space-y-2">
                      {Object.entries(
                        devices.reduce((acc, device) => {
                          const type = getDeviceType(device.name);
                          acc[type] = (acc[type] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span className="text-gray-500">{type}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-2">Topology Actions</h4>
                    <div className="space-y-2">
                      <button className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded">
                        Export as PNG
                      </button>
                      <button className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded">
                        Generate Report
                      </button>
                      <button className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded">
                        View Connection Matrix
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowTopologyModal(false)}
                className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Close Topology View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkDeviceManagement;