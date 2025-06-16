import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DetailAlert from '../NetworkEngineer/DetailAlert';
import debounce from 'lodash/debounce';

// Spinner Component
const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const DashNotifications = () => {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('history'); // Default to 'history'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);

  axios.defaults.baseURL = 'http://localhost:8000';

 const fetchAlerts = async () => {
  setLoading(true);
  setError('');

  try {
    let url = '/api/alerts/history';
    const params = new URLSearchParams();

    if (filter === 'active') {
      url = '/api/alerts';
      params.append('status', 'active');
    } else if (filter === 'resolved') {
      url = '/api/alerts/resolved';
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log(`Fetching alerts from: ${url}`);
    const response = await axios.get(url);
    const normalizedAlerts = Array.isArray(response.data)
      ? response.data.map((alert) => ({
          ...alert,
          siteId: alert.siteId || 'No',
          status: alert.status || 'unknown',
          type: alert.type || 'No',
          message: alert.message || 'No message', // Preserve message with fallback
          age: '',
          createdAt: alert.createdAt || null,
          resolvedAt: alert.resolvedAt || null,
          acknowledged: !!alert.acknowledged,
        }))
      : [];
    setAlerts(normalizedAlerts);
    console.log('Fetched alerts:', normalizedAlerts);

    // Fallback for active alerts if endpoint fails
    if (filter === 'active' && normalizedAlerts.length === 0) {
      console.warn('No active alerts returned, fetching all and filtering client-side');
      console.log('Fallback: Fetching all alerts and filtering client-side'); // Replace alert() for better UX
      const fallbackResponse = await axios.get('/api/alerts/history');
      console.log('Fallback: Fetched history alerts');
      const fallbackAlerts = Array.isArray(fallbackResponse.data)
        ? fallbackResponse.data
            .filter((alert) => alert.status === 'active')
            .map((alert) => ({
              ...alert,
              siteId: alert.siteId || 'No',
              status: alert.status || 'unknown',
              type: alert.type || 'No',
              message: alert.message || 'No message', // Preserve message with fallback
              age: '',
              createdAt: alert.createdAt || null,
              resolvedAt: alert.resolvedAt || null,
              acknowledged: !!alert.acknowledged,
            }))
        : [];
      setAlerts(fallbackAlerts);
      console.log('Fallback active alerts:', fallbackAlerts);
    }
  } catch (err) {
    console.error('Fetch alerts error:', err.response?.data || err.message);
    if (err.response?.status === 404) {
      setError('No alerts found for the specified criteria.');
      setAlerts([]);
    } else if (err.response?.status === 400) {
      setError('Invalid request format. Please check filter settings.');
    } else {
      setError(`Failed to fetch alerts: ${err.response?.data?.message || err.message}`);
    }
  } finally {
    setLoading(false);
  }
};

  // Debounced search filter
  const filterAlerts = useCallback(
    debounce((alerts, query) => {
      const filtered = alerts.filter((alert) => {
        const q = query?.toLowerCase() || '';
        const siteIdStr = alert.siteId || '';
        return (
          siteIdStr.toLowerCase().includes(q) ||
          (alert.type || '').toLowerCase().includes(q) ||
          (alert.message || '').toLowerCase().includes(q)
        );
      });
      setFilteredAlerts(filtered);
    }, 300),
    []
  );

  useEffect(() => {
    filterAlerts(alerts, searchQuery);
  }, [alerts, searchQuery, filterAlerts]);

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <header className="flex items-center gap-3 mb-6">
        <svg
          className="w-10 h-10 text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <h1 className="text-3xl font-bold text-gray-900">Alert Dashboard</h1>
      </header>

      {/* Action Buttons */}
      <div className="mb-6 flex justify-end space-x-3">
        <button
          onClick={fetchAlerts}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          aria-label="Refresh alerts"
        >
          {loading ? (
            <Spinner />
          ) : (
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 text-red-700 rounded-lg shadow-sm"
          role="alert"
        >
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                id="searchQuery"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-10"
                aria-describedby="searchQuery-description"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p id="searchQuery-description" className="sr-only">
              Enter a search term to filter alerts.
            </p>
          </div>
          <div className="flex-1">
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="relative">
              <select
                id="filter"
                value={filter}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-describedby="filter-description"
              >
                <option value="history">All Alerts</option>
                <option value="active">Active Alerts</option>
                <option value="resolved">Resolved Alerts</option>
              </select>
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v3.586a1 1 0 01-.293.707l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 01-.293-.707v-3.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </div>
            <p id="filter-description" className="sr-only">
              Select a status to filter alerts.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedAlert && (
        <DetailAlert
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          alert={selectedAlert}
        />
      )}

      {/* Alerts Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
          <span className="ml-3 text-gray-600">Loading alerts...</span>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" role="grid">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Site Reference
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                    Type
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m0 0"
                      />
                    </svg>
                    Message
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2"
                      />
                    </svg>
                    Status
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m0 0"
                      />
                    </svg>
                    Created
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2"
                      />
                    </svg>
                    Resolved
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Acknowledged
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    View Details
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert._id}
                    className={`${
                      alert.status === 'active'
                        ? 'bg-red-50 hover:bg-red-100'
                        : alert.status === 'resolved'
                        ? 'bg-green-50 hover:bg-green-100'
                        : 'hover:bg-gray-50'
                    }`}
                    role="row"
                  >
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600"
                      style={{
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {alert.siteId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {alert.type}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-500"
                      style={{
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {alert.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                          alert.status === 'active'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alert.acknowledged ? (
                        <span className="inline-flex items-center text-green-600">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Acknowledged
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m4.934.979A6 6 0 0112 10c1.657 0 3 .672 4.06 1.828"
                            />
                          </svg>
                          Not Acknowledged
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAlert(alert);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md"
                        aria-label={`View details for alert ${alert.siteId || 'unknown'}`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                    role="alert"
                  >
                    No alerts found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Custom Tailwind animation for fade-in */}
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

export default DashNotifications;