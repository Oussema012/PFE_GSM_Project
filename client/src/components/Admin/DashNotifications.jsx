import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertCircle, 
  FiTrash2, 
  FiRefreshCw,
  FiClock,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiFilter,
  FiSearch,
  FiCalendar
} from 'react-icons/fi';

const AlertDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [siteId, setSiteId] = useState('');
  const [filter, setFilter] = useState('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [acknowledging, setAcknowledging] = useState(null);
  const [filteredAlerts, setFilteredAlerts] = useState([]);

  const fetchAlerts = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      let url = 'http://localhost:3000/api/alerts';
      
      if (siteId) {
        if (filter === 'active') {
          url = `http://localhost:3000/api/alerts/active/${siteId}`;
        } else if (filter === 'resolved') {
          url = `http://localhost:3000/api/alerts/resolved/${siteId}`;
          if (startDate && endDate) {
            // Validate date range
            if (new Date(endDate) < new Date(startDate)) {
              setError('End date cannot be before start date');
              setLoading(false);
              return;
            }
            url += `?startDate=${startDate}&endDate=${endDate}`;
          }
        } else if (filter === 'history') {
          url = `http://localhost:3000/api/alerts/history/${siteId}`;
        } else {
          throw new Error('Invalid filter configuration');
        }
      } else {
        if (filter === 'resolved') {
          url = 'http://localhost:3000/api/alerts/resolved';
          if (startDate && endDate) {
            if (new Date(endDate) < new Date(startDate)) {
              setError('End date cannot be before start date');
              setLoading(false);
              return;
            }
            url += `?startDate=${startDate}&endDate=${endDate}`;
          }
        } else if (filter === 'history') {
          url = 'http://localhost:3000/api/alerts/history';
        } else if (filter !== 'active') {
          throw new Error('Invalid filter configuration');
        }
      }

      const response = await axios.get(url);
      setAlerts(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Failed to fetch alerts: Endpoint not found. Please check site ID or server configuration.');
      } else {
        setError(`Failed to fetch alerts: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (id) => {
    setAcknowledging(id);
    setError('');
    setSuccessMessage('');

    const maxRetries = 3;
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        const response = await axios.put(
          `http://localhost:3000/api/alerts/acknowledge/${id}`,
          {}
        );
        setAlerts(alerts.map((alert) => (alert._id === id ? { ...alert, acknowledged: true } : alert)));
        setSuccessMessage('Alert acknowledged successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        break;
      } catch (err) {
        if (attempt === maxRetries) {
          setError(`Failed to acknowledge alert after ${maxRetries} attempts: ${err.message}`);
        }
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    setAcknowledging(null);
  };

  const resolveAlert = async (id) => {
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.put(
        `http://localhost:3000/api/alerts/${id}`,
        {}
      );
      setAlerts(alerts.map((alert) => (alert._id === id ? response.data : alert)));
      setSuccessMessage('Alert resolved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to resolve alert: ' + err.message);
    }
  };

  const deleteAlert = async (id) => {
    setError('');
    setSuccessMessage('');

    const confirmDelete = window.confirm('Are you sure you want to delete this alert? This action cannot be undone.');
    if (!confirmDelete) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3000/api/alerts/${id}`);
      setAlerts(alerts.filter((alert) => alert._id !== id));
      setSuccessMessage('Alert deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete alert: ' + err.message);
    }
  };


useEffect(() => {
  const filtered = alerts.filter(alert => {
    const query = searchQuery?.toLowerCase() || "";
    return (
      alert.siteId?.toLowerCase().includes(query) ||
      alert.type?.toLowerCase().includes(query) ||
      alert.message?.toLowerCase().includes(query)
    );
  });

  setFilteredAlerts(filtered); // assuming you're maintaining a filtered state
}, [alerts, searchQuery]);

    

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              <FiAlertCircle className="inline-block mr-2 text-indigo-600" />
              Alert Dashboard
            </h1>
            <button
              onClick={fetchAlerts}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search alerts..."
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site ID</label>
              <input
                type="text"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                placeholder="All sites"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md appearance-none"
                >
                  <option value="active">Active Alerts</option>
                  <option value="resolved">Resolved Alerts</option>
                  <option value="history">All Alerts</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FiFilter className="text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                    disabled={filter !== 'resolved'}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FiCalendar className="text-gray-400" />
                  </div>
                </div>
                <div className="relative flex-1">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
                    disabled={filter !== 'resolved'}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FiCalendar className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center p-8">
            <FiRefreshCw className="animate-spin h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-gray-600">Loading alerts...</span>
          </div>
        )}

        {!loading && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
          </div>
        )}

        {!loading && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Site ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <FiClock className="inline-block mr-1" /> Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <FiCheck className="inline-block mr-1" /> Resolved
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acknowledged
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert) => (
                      <tr key={alert._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {alert.siteId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {alert.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {alert.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                            alert.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {alert.status === 'active' ? (
                              <FiXCircle className="mr-1" />
                            ) : (
                              <FiCheckCircle className="mr-1" />
                            )}
                            {alert.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(alert.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {alert.acknowledged ? (
                            <span className="inline-flex items-center text-green-600">
                              <FiCheck className="mr-1" /> I saw it
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600">
                              <FiEyeOff className="mr-1" /> No
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {alert.status === 'active' && (
                              <>
                                {!alert.acknowledged && (
                                  <button
                                    onClick={() => acknowledgeAlert(alert._id)}
                                    className={`text-indigo-600 hover:text-indigo-900 ${
                                      acknowledging === alert._id ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    title="Acknowledge"
                                    disabled={acknowledging === alert._id}
                                  >
                                    <FiEye className="h-5 w-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => resolveAlert(alert._id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Resolve"
                                >
                                  <FiCheckCircle className="h-5 w-5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => deleteAlert(alert._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                        No alerts found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AlertDashboard;