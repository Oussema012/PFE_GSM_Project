import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import ScheduleIntervention from './ScheduleIntervention';
import InterventionModal from './InterventionModal';
import downloadCSV from './exportCSV';
import ResolveInterventionModal from './ResolveInterventionModal';
import UpdateStatusModal from './UpdateStatusModal';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

// Reusable API fetch utility
const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  return response.json();
};

// Validate MongoDB ObjectId
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

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

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="p-4 bg-red-50 border-l-4 border-red-600 text-red-700 rounded-lg"
          role="alert"
        >
          <h2 className="text-lg font-semibold">Something went wrong.</h2>
          <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

/*
// TypeScript Interfaces (uncomment if using TypeScript)
interface Technician {
  _id?: string;
  name?: string;
  email?: string;
}

interface Intervention {
  _id: string;
  siteId?: string;
  technician?: Technician | null;
  plannedDate: string;
  priority?: string;
  status?: string;
  description?: string;
  createdAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}
*/

const NetworkTopology = () => {
  const [interventions, setInterventions] = useState([]);
  const [filteredInterventions, setFilteredInterventions] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    siteId: '',
    status: '',
    technician: '',
    priority: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'plannedDate', direction: 'asc' });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(null);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(null);

  // Get current user from Redux store
  const currentUser = useSelector((state) => state.user?.currentUser);

  // Fetch interventions for the current user
  const fetchInterventions = useCallback(async () => {
    if (!currentUser?._id || !isValidObjectId(currentUser._id)) {
      setError('No valid user logged in');
      setInterventions([]);
      setFilteredInterventions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch(
        `${API_URL}/api/interventions?createdBy=${currentUser._id}`
      );
      const interventions = (response.data || []).map((item) => ({
        ...item,
        technician: item.technician || null, // Ensure technician is null if undefined
      }));
      setInterventions(interventions);
      setFilteredInterventions(interventions);
      setError(null);
    } catch (error) {
      setError(error.message || 'Failed to fetch interventions');
      setInterventions([]);
      setFilteredInterventions([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Fetch data on mount
  useEffect(() => {
    fetchInterventions();
  }, [fetchInterventions]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...interventions];

    // Filter by site name (case-insensitive match or partial match)
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

        if (
          sortConfig.key === 'plannedDate' ||
          sortConfig.key === 'createdAt' ||
          sortConfig.key === 'resolvedAt'
        ) {
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

  // Schedule intervention
  const scheduleIntervention = async (payload) => {
    setIsSubmitting(true);
    try {
      const data = await apiFetch(`${API_URL}/api/interventions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setInterventions((prev) => [...prev, data.data]);
      setShowScheduleModal(false);
      setError(null);
    } catch (error) {
      setError(error.message || 'Failed to schedule intervention');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resolve intervention
  const resolveIntervention = async (interventionId, payload) => {
    setIsSubmitting(true);
    try {
      const data = await apiFetch(`${API_URL}/api/interventions/${interventionId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setInterventions((prev) =>
        prev.map((item) => (item._id === interventionId ? data.data : item))
      );
      setShowResolveModal(null);
      setError(null);
    } catch (error) {
      setError(error.message || 'Failed to resolve intervention');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update intervention status
  const updateInterventionStatus = async (interventionId, status) => {
    setIsSubmitting(true);
    try {
      const data = await apiFetch(`${API_URL}/api/interventions/${interventionId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setInterventions((prev) =>
        prev.map((item) => (item._id === interventionId ? data.data : item))
      );
      setShowUpdateStatusModal(null);
      setShowResolveModal(null);
      setError(null);
    } catch (error) {
      setError(error.message || 'Failed to update intervention status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete intervention
  const deleteIntervention = async (interventionId) => {
    if (!window.confirm('Are you sure you want to delete this intervention?')) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`${API_URL}/api/interventions/${interventionId}`, {
        method: 'DELETE',
      });
      setInterventions((prev) => prev.filter((item) => item._id !== interventionId));
      setSelectedIntervention(null);
      setError(null);
    } catch (error) {
      setError(error.message || 'Failed to delete intervention');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <header className="flex items-center gap-3 mb-6">
          <Logo />
          <h1 className="text-3xl font-bold text-gray-900">
            Network Topology Interventions
          </h1>
        </header>

        {/* Action Buttons */}
        <div className="mb-6 flex justify-end space-x-3">
          <button
            onClick={() => setShowScheduleModal(true)}
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            aria-label="Schedule a new intervention"
          >
            {isSubmitting ? (
              <Spinner />
            ) : (
              'Schedule Intervention'
            )}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={isLoading || isSubmitting || filteredInterventions.length === 0}
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
              <label
                htmlFor="siteId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
                <option value="cancelled">Cancelled</option>
              </select>
              <p id="status-description" className="sr-only">
                Select a status to filter interventions.
              </p>
            </div>
            <div>
              <label
                htmlFor="technician"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
              <label
                htmlFor="dateFrom"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
              <label
                htmlFor="dateTo"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
        {isLoading ? (
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
                      className="hover:bg-gray-50"
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
                            disabled={isSubmitting}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed"
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
                          {intervention.status !== 'completed' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowResolveModal(intervention);
                                }}
                                disabled={isSubmitting}
                                className="text-green-600 hover:text-green-900 p-1 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed"
                                aria-label={`Resolve intervention ${intervention.siteId || 'unknown'}`}
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowUpdateStatusModal(intervention);
                                }}
                                disabled={isSubmitting}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed"
                                aria-label={`Update status for intervention ${intervention.siteId || 'unknown'}`}
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15.414H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteIntervention(intervention._id);
                            }}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-900 p-1 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed"
                            aria-label={`Delete intervention ${intervention.siteId || 'unknown'}`}
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M4 7h16"
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

        {/* Modals */}
        {selectedIntervention && (
          <InterventionModal
            intervention={selectedIntervention}
            onClose={() => setSelectedIntervention(null)}
          />
        )}
        {showScheduleModal && (
          <ScheduleIntervention
            onClose={() => setShowScheduleModal(false)}
            onSubmit={scheduleIntervention}
            isSubmitting={isSubmitting}
          />
        )}
        {showResolveModal && (
          <ResolveInterventionModal
            intervention={showResolveModal}
            onClose={() => setShowResolveModal(null)}
            onSubmit={(payload) => resolveIntervention(showResolveModal._id, payload)}
            isSubmitting={isSubmitting}
          />
        )}
        {showUpdateStatusModal && (
          <UpdateStatusModal
            intervention={showUpdateStatusModal}
            onClose={() => setShowUpdateStatusModal(null)}
            onSubmit={(status) => updateInterventionStatus(showUpdateStatusModal._id, status)}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </ErrorBoundary>
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

export default NetworkTopology;