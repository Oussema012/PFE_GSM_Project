import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InterventionModal from '../NetworkEngineer/InterventionModal';

// Placeholder SVG logo
const Logo = () => (
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
);

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

// CSV Export Function
const downloadCSV = (data) => {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }

  const headers = [
    'Site ID',
    'Description',
    'Planned Date',
    'Time Slot',
    'Technician',
    'Priority',
    'Status',
    'Created By',
    'Created At',
  ];

  const rows = data.map((item) => [
    item.siteId || 'N/A',
    item.description || 'N/A',
    item.plannedDate ? new Date(item.plannedDate).toLocaleDateString() : 'N/A',
    item.timeSlot ? `${item.timeSlot.start || 'N/A'} - ${item.timeSlot.end || 'N/A'}` : 'N/A',
    item.technician?.name || 'N/A',
    item.priority || 'N/A',
    item.status || 'N/A',
    item.createdBy?.name || item.createdBy || 'N/A',
    item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `interventions_export_${new Date().toISOString()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const DashInterventions = () => {
  const [interventions, setInterventions] = useState([]);
  const [filteredInterventions, setFilteredInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    siteId: '',
    status: '',
    technician: '',
    priority: '',
    dateFrom: '',
    dateTo: '',
  });
  const [sortConfig, setSortConfig] = useState({ key: 'plannedDate', direction: 'asc' });
  const [selectedIntervention, setSelectedIntervention] = useState(null);

  // Fetch all interventions
  useEffect(() => {
    const fetchInterventions = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/interventions/all');
        setInterventions(response.data.data);
        setFilteredInterventions(response.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch interventions');
        setLoading(false);
      }
    };
    fetchInterventions();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...interventions];

    if (filters.siteId) {
      result = result.filter((item) =>
        item.siteId?.toLowerCase().includes(filters.siteId.toLowerCase())
      );
    }

    if (filters.status) {
      result = result.filter((item) => item.status === filters.status);
    }

    if (filters.technician) {
      result = result.filter((item) =>
        item.technician?.name?.toLowerCase().includes(filters.technician.toLowerCase())
      );
    }

    if (filters.priority) {
      result = result.filter((item) => item.priority === filters.priority);
    }

    if (filters.dateFrom) {
      result = result.filter(
        (item) => new Date(item.plannedDate) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      result = result.filter(
        (item) => new Date(item.plannedDate) <= new Date(filters.dateTo)
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'plannedDate' || sortConfig.key === 'createdAt') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (sortConfig.key === 'siteId') {
          aValue = aValue?.toLowerCase() || '';
          bValue = bValue?.toLowerCase() || '';
        } else if (sortConfig.key === 'technician') {
          aValue = aValue?.name?.toLowerCase() || '';
          bValue = bValue?.name?.toLowerCase() || '';
        } else if (sortConfig.key === 'status' || sortConfig.key === 'priority') {
          aValue = aValue?.toLowerCase() || '';
          bValue = bValue?.toLowerCase() || '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredInterventions(result);
  }, [interventions, filters, sortConfig]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      siteId: '',
      status: '',
      technician: '',
      priority: '',
      dateFrom: '',
      dateTo: '',
    });
    setError(null);
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    downloadCSV(filteredInterventions);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <header className="flex items-center gap-3 mb-6">
        <Logo />
        <h1 className="text-3xl font-bold text-gray-900">Intervention Dashboard</h1>
      </header>

      {/* Action Buttons */}
      <div className="mb-6 flex justify-end space-x-3">
        <button
          onClick={handleExportCSV}
          disabled={loading || filteredInterventions.length === 0}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 disabled:bg-emerald-300 disabled:cursor-not-allowed"
          aria-label="Export interventions to CSV"
        >
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
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
          <button
            onClick={resetFilters}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            aria-label="Reset all filters"
          >
            Reset Filters
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="siteId" className="block text-sm font-medium text-gray-700 mb-1">
              Site ID
            </label>
            <input
              id="siteId"
              type="text"
              name="siteId"
              value={filters.siteId}
              onChange={handleFilterChange}
              placeholder="SITE-ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-describedby="siteId-description"
            />
            <p id="siteId-description" className="sr-only">
              Enter the site ID to filter interventions.
            </p>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-describedby="status-description"
            >
              <option value="">All</option>
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <p id="status-description" className="sr-only">
              Select a status to filter interventions.
            </p>
          </div>
          <div>
            <label htmlFor="technician" className="block text-sm font-medium text-gray-700 mb-1">
              Technician
            </label>
            <input
              id="technician"
              type="text"
              name="technician"
              value={filters.technician}
              onChange={handleFilterChange}
              placeholder="Technician Name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-describedby="technician-description"
            />
            <p id="technician-description" className="sr-only">
              Enter the technician name to filter interventions.
            </p>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-describedby="priority-description"
            >
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <p id="priority-description" className="sr-only">
              Select a priority to filter interventions.
            </p>
          </div>
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              id="dateFrom"
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-describedby="dateFrom-description"
            />
            <p id="dateFrom-description" className="sr-only">
              Select a start date to filter interventions.
            </p>
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              id="dateTo"
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-describedby="dateTo-description"
            />
            <p id="dateTo-description" className="sr-only">
              Select an end date to filter interventions.
            </p>
          </div>
        </div>
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

      {/* Interventions Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
          <span className="ml-3 text-gray-600">Loading interventions...</span>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" role="grid">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('siteId')}
                  role="columnheader"
                  aria-sort={sortConfig.key === 'siteId' ? sortConfig.direction : 'none'}
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
                    Site ID
                    {sortConfig.key === 'siteId' && (
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
                          d={
                            sortConfig.direction === 'asc'
                              ? 'M19 9l-7 7-7-7'
                              : 'M5 15l7-7 7 7'
                          }
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('technician')}
                  role="columnheader"
                  aria-sort={sortConfig.key === 'technician' ? sortConfig.direction : 'none'}
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Technician
                    {sortConfig.key === 'technician' && (
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
                          d={
                            sortConfig.direction === 'asc'
                              ? 'M19 9l-7 7-7-7'
                              : 'M5 15l7-7 7 7'
                          }
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('plannedDate')}
                  role="columnheader"
                  aria-sort={sortConfig.key === 'plannedDate' ? sortConfig.direction : 'none'}
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Planned Date
                    {sortConfig.key === 'plannedDate' && (
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
                          d={
                            sortConfig.direction === 'asc'
                              ? 'M19 9l-7 7-7-7'
                              : 'M5 15l7-7 7 7'
                          }
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('priority')}
                  role="columnheader"
                  aria-sort={sortConfig.key === 'priority' ? sortConfig.direction : 'none'}
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
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    Priority
                    {sortConfig.key === 'priority' && (
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
                          d={
                            sortConfig.direction === 'asc'
                              ? 'M19 9l-7 7-7-7'
                              : 'M5 15l-7 7 7'
                          }
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                  role="columnheader"
                  aria-sort={sortConfig.key === 'status' ? sortConfig.direction : 'none'}
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Status
                    {sortConfig.key === 'status' && (
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
                          d={
                            sortConfig.direction === 'asc'
                              ? 'M19 9l-7 7-7-7'
                              : 'M5 15l7-7 7 7'
                          }
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  role="columnheader"
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
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInterventions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                    role="alert"
                  >
                    No interventions found.
                  </td>
                </tr>
              ) : (
                filteredInterventions.map((intervention) => (
                  <tr
                    key={intervention._id}
                    className={`${
                      intervention.status === 'completed'
                        ? 'bg-green-50 hover:bg-green-100'
                        : intervention.status === 'planned'
                        ? 'bg-red-50 hover:bg-red-100'
                        : intervention.status === 'in-progress'
                        ? 'bg-orange-50 hover:bg-orange-100'
                        : 'hover:bg-gray-50'
                    }`}
                    role="row"
                  >
                    <td
                      className="px-6 py-4 text-sm text-gray-900"
                      style={{
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {intervention.siteId || 'N/A'}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-900"
                      style={{
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {intervention.technician?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {intervention.plannedDate
                        ? new Date(intervention.plannedDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {intervention.priority || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {intervention.status || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIntervention(intervention);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md"
                          aria-label={`View details for intervention ${intervention.siteId || 'unknown'}`}
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {selectedIntervention && (
        <InterventionModal
          intervention={selectedIntervention}
          onClose={() => setSelectedIntervention(null)}
        />
      )}
    </div>
  );
};

// Custom Tailwind animation for fade-in
const styles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
`;
document.head.insertAdjacentHTML('beforeend', `<style>${styles}</style>`);

export default DashInterventions;