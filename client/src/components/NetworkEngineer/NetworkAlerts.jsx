import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiAlertCircle,
  FiRefreshCw,
  FiClock,
  FiCheck,
  FiEyeOff,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiTool,
} from 'react-icons/fi';
import AcknowledgeAlert from './AcknowledgeAlert';
import DetailAlert from './DetailAlert';
import CreateInterventionModal from './CreateInterventionModal';

// Validate site_reference format (e.g., "SITE001")
const isValidSiteReference = (siteId) => /^[A-Z0-9]+$/.test(siteId);

const NetworkAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [siteId, setSiteId] = useState('');
  const [filter, setFilter] = useState('history'); // Default to 'history'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [siteReferences, setSiteReferences] = useState([]);
  const [showScheduleInterventionModal, setShowScheduleInterventionModal] = useState(false);
  const [selectedAlertForIntervention, setSelectedAlertForIntervention] = useState(null);

  axios.defaults.baseURL = 'http://localhost:8000';

  // Fetch site references for dropdown
  useEffect(() => {
    const fetchSiteReferences = async () => {
      try {
        const response = await axios.get('/api/sites/references');
        // Normalize to array of strings for consistency
        const references = Array.isArray(response.data)
          ? response.data.map((site) => site.site_reference).filter(Boolean)
          : [];
        setSiteReferences(references);
      } catch (error) {
        console.error('Failed to fetch site references:', error.response?.data || error.message);
        setError('Failed to fetch site references. Using fallback options.');
        setSiteReferences(['SITE001', 'SITE002']);
      }
    };
    fetchSiteReferences();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      let url = '/api/alerts/history'; // Default to history endpoint

      // Validate siteId if provided
      if (siteId && !isValidSiteReference(siteId)) {
        setError('Invalid site reference format (e.g., SITE001)');
        setLoading(false);
        return;
      }

      if (siteId) {
        switch (filter) {
          case 'active':
            url = `/api/alerts/active/${siteId}`;
            break;
          case 'resolved':
            url = `/api/alerts/history/resolved/${siteId}`;
            break;
          case 'history':
            url = `/api/alerts/history/${siteId}`;
            break;
          default:
            setError('Invalid filter configuration');
            setLoading(false);
            return;
        }
      } else {
        switch (filter) {
          case 'active':
            url = `/api/alerts`;
            break;
          case 'resolved':
            url = `/api/alerts/resolved`;
            break;
          case 'history':
            url = `/api/alerts/history`;
            break;
          default:
            setError('Invalid filter configuration');
            setLoading(false);
            return;
        }
      }

      // Apply date range for 'resolved' or 'history' filters
      if ((filter === 'resolved' || filter === 'history') && startDate && endDate) {
        if (new Date(endDate) < new Date(startDate)) {
          setError('End date cannot be before start date');
          setLoading(false);
          return;
        }
        const params = new URLSearchParams();
        params.append('startDate', startDate);
        params.append('endDate', endDate);
        url += `?${params.toString()}`;
      }

      console.log(`Fetching alerts from: ${url}`);
      const response = await axios.get(url);
      const normalizedAlerts = Array.isArray(response.data)
        ? response.data.map((alert) => ({
            ...alert,
            siteId: alert.siteId || 'N/A',
          }))
        : [];
      setAlerts(normalizedAlerts);
      console.log('Fetched alerts:', normalizedAlerts);
    } catch (err) {
      console.error('Fetch alerts error:', err.response?.data || err.message);
      if (err.response?.status === 404) {
        setError('No alerts found for the specified criteria.');
        setAlerts([]);
      } else {
        setError(`Failed to fetch alerts: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const scheduleIntervention = async (payload) => {
    try {
      console.log('Sending intervention payload:', payload);
      const response = await axios.post('/api/interventions', payload);
      setSuccessMessage('Intervention scheduled successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowScheduleInterventionModal(false);
      setSelectedAlertForIntervention(null);
      fetchAlerts(); // Refresh alerts to reflect any status changes
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to schedule intervention');
    }
  };

  useEffect(() => {
    const filtered = alerts.filter((alert) => {
      const query = searchQuery?.toLowerCase() || '';
      const siteIdStr = alert.siteId || '';
      return (
        siteIdStr.toLowerCase().includes(query) ||
        (alert.type || '').toLowerCase().includes(query) ||
        (alert.message || '').toLowerCase().includes(query)
      );
    });
    setFilteredAlerts(filtered);
  }, [alerts, searchQuery]);

  useEffect(() => {
    fetchAlerts();
  }, [siteId, filter, startDate, endDate]);

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    if (newFilter === 'active') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleAcknowledgeSuccess = (alertId, updatedAlert, message) => {
    setAlerts(
      alerts.map((alert) =>
        alert._id === alertId
          ? { ...alert, acknowledged: true, acknowledgedAt: new Date().toISOString() }
          : alert
      )
    );
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleRowClick = (alert) => {
    setSelectedAlert(alert);
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              <FiAlertCircle className="inline-block mr-2 text-indigo-600" />
              Network Alerts
            </h1>
            <div className="flex space-x-2">
              <button
                onClick={fetchAlerts}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiCheck className="h-5 w-5 text-green-400" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Reference</label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All sites</option>
                {siteReferences.map((ref) => (
                  <option key={ref} value={ref}>
                    {ref}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="relative">
                <select
                  value={filter}
                  onChange={handleFilterChange}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md appearance-none"
                >
                  <option value="history">All Alerts</option>
                  <option value="active">Active Alerts</option>
                  <option value="resolved">Resolved Alerts</option>
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
                    disabled={filter === 'active'}
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
                    disabled={filter === 'active'}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FiCalendar className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DetailAlert
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          alert={selectedAlert}
        />

        {showScheduleInterventionModal && (
          <CreateInterventionModal
            isScheduling={true}
            initialData={{
              siteId: selectedAlertForIntervention?.siteId || '',
              alertId: selectedAlertForIntervention?._id || '',
            }}
            onClose={() => {
              setShowScheduleInterventionModal(false);
              setSelectedAlertForIntervention(null);
            }}
            onSubmit={scheduleIntervention}
          />
        )}

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
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Site Reference
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Message
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <FiClock className="inline-block mr-1" /> Created
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <FiCheck className="inline-block mr-1" /> Resolved
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Acknowledged
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert) => (
                      <tr
                        key={alert._id}
                        className={`hover:bg-gray-100 cursor-pointer ${
                          alert.status === 'resolved' ? 'bg-green-50' : 'bg-red-50'
                        }`}
                        onClick={() => handleRowClick(alert)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                          {alert.siteId || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                          <span className="px-1 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {alert.type || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate">
                          {alert.message || 'No message'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                          <span
                            className={`px-1 py-0.5 inline-flex items-center text-xs leading-4 font-semibold rounded-full ${
                              alert.status === 'active'
                                ? 'bg-red-200 text-red-900'
                                : 'bg-green-200 text-green-900'
                            }`}
                          >
                            {alert.status === 'active' ? (
                              <FiAlertCircle className="mr-1 h-3 w-3" />
                            ) : (
                              <FiCheck className="mr-1 h-3 w-3" />
                            )}
                            {alert.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                          {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                          {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                          {alert.acknowledged ? (
                            <span className="inline-flex items-center text-green-600">
                              <FiCheck className="mr-1 h-3 w-3" /> I saw it
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600">
                              <FiEyeOff className="mr-1 h-3 w-3" /> No
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium">
                          <div className="flex justify-end space-x-2">
                            {alert.status === 'active' && (
                              <>
                                {!alert.acknowledged && (
                                  <AcknowledgeAlert
                                    alertId={alert._id}
                                    onSuccess={handleAcknowledgeSuccess}
                                    onError={setError}
                                  />
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAlertForIntervention(alert);
                                    setShowScheduleInterventionModal(true);
                                  }}
                                  className="flex items-center text-blue-600 hover:text-blue-900"
                                  title="Schedule Intervention"
                                >
                                  <FiTool className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-3 text-center text-xs text-gray-500">
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

export default NetworkAlerts;