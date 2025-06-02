import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import PropTypes from 'prop-types';
import {
  FiCheckCircle,
  FiClock,
  FiCalendar,
} from 'react-icons/fi';

const InterventionsTech = () => {
  const currentUser = useSelector((state) => state.user?.currentUser);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [validatedBy, setValidatedBy] = useState('');
  const [interventionDetails, setInterventionDetails] = useState(null);

  // Fetch interventions assigned to the current technician
  const fetchInterventions = useCallback(async () => {
    if (!currentUser?._id) {
      setError('User not logged in');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`/api/interventions/tech?technician=${currentUser._id}`);
      setInterventions(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch interventions');
      setInterventions([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchInterventions();
    return () => {
      // No async cancellation needed, but included for clarity
    };
  }, [fetchInterventions]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time slot (e.g., "09:00 - 17:00")
  const formatTimeSlot = (timeSlot) => {
    return timeSlot?.start && timeSlot?.end ? `${timeSlot.start} - ${timeSlot.end}` : 'N/A';
  };

  // Get color classes for status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'planned':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get color classes for priority
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if an intervention is overdue
  const isInterventionOverdue = (intervention) => {
    if (!intervention?.plannedDate || ['completed', 'cancelled'].includes(intervention.status.toLowerCase())) {
      return false;
    }
    const plannedDate = new Date(intervention.plannedDate);
    const today = new Date('2025-05-31T00:00:00+01:00'); // May 31, 2025, 00:00 CET
    return plannedDate < today;
  };

  // Handle clicking the "Resolve" button
  const handleResolveClick = (intervention) => {
    if (!currentUser?.isActive || isInterventionOverdue(intervention)) return;
    setSelectedIntervention(intervention);
    setResolutionNotes('');
    setValidatedBy(currentUser?.name || '');
    setShowResolveModal(true);
  };

  // Handle clicking the "View Details" button
  const handleViewDetailsClick = async (intervention) => {
    if (!currentUser?.isActive) return;
    try {
      setLoading(true);
      const response = await axios.get(`/api/interventions/${intervention._id}`);
      setInterventionDetails(response.data.data);
      setShowDetailsModal(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch intervention details');
    } finally {
      setLoading(false);
    }
  };

  // Handle clicking the "Start" button
  const handleStartClick = async (intervention) => {
    if (!currentUser?.isActive || isInterventionOverdue(intervention)) return;
    try {
      const response = await axios.put(`/api/interventions/${intervention._id}`, {
        status: 'in-progress',
      });
      setInterventions((prev) =>
        prev.map((int) => (int._id === intervention._id ? response.data.data : int))
      );
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start intervention');
    }
  };

  // Handle submission of the resolve form
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.isActive) {
      setError('You are not authorized to perform this action.');
      return;
    }
    if (!resolutionNotes.trim() || !validatedBy.trim()) {
      setError('Resolution notes and validated by fields are required');
      return;
    }

    try {
      const response = await axios.post(`/api/interventions/${selectedIntervention._id}/resolve`, {
        resolutionNotes,
        validatedBy,
      });
      setInterventions((prev) =>
        prev.map((int) => (int._id === selectedIntervention._id ? response.data.data : int))
      );
      setShowResolveModal(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve intervention');
    }
  };

  // Close the resolve modal
  const closeResolveModal = () => {
    setShowResolveModal(false);
    setSelectedIntervention(null);
    setResolutionNotes('');
    setValidatedBy('');
    setError(null);
  };

  // Close the details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setInterventionDetails(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Interventions</h1>

      {!currentUser?.isActive && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <p>Your account is inactive. You can view interventions but cannot perform actions.</p>
        </div>
      )}

      {error && !showResolveModal && !showDetailsModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat bg-white rounded-lg px-6 py-4 border-l-4 border-green-500">
          <div className="stat-figure text-green-500">
            <FiCheckCircle size={28} />
          </div>
          <div className="stat-title text-gray-600">Completed</div>
          <div className="stat-value text-green-500">
            {interventions.filter((i) => i.status.toLowerCase() === 'completed').length}
          </div>
          <div className="stat-desc text-gray-600">
            {interventions.length > 0
              ? `${Math.round(
                  (interventions.filter((i) => i.status.toLowerCase() === 'completed').length /
                    interventions.length) *
                    100
                )}% of total`
              : '0% of total'}
          </div>
        </div>

        <div className="stat bg-white rounded-lg px-6 py-4 border-l-4 border-blue-500">
          <div className="stat-figure text-blue-500">
            <FiClock size={28} />
          </div>
          <div className="stat-title text-gray-600">In Progress</div>
          <div className="stat-value text-blue-500">
            {interventions.filter((i) => i.status.toLowerCase() === 'in-progress').length}
          </div>
          <div className="stat-desc text-gray-600">
            {interventions.filter((i) => i.status.toLowerCase() === 'in-progress' && isInterventionOverdue(i)).length}{' '}
            overdue
          </div>
        </div>

        <div className="stat bg-white rounded-lg px-6 py-4 border-l-4 border-purple-500">
          <div className="stat-figure text-purple-500">
            <FiCalendar size={28} />
          </div>
          <div className="stat-title text-gray-600">Planned</div>
          <div className="stat-value text-purple-500">
            {interventions.filter((i) => i.status.toLowerCase() === 'planned').length}
          </div>
          <div className="stat-desc text-gray-600">
            {interventions.filter((i) => i.status.toLowerCase() === 'planned' && isInterventionOverdue(i)).length} overdue
          </div>
        </div>
      </div>

      {interventions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">No interventions assigned to you yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Planned Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Slot
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interventions.map((intervention) => {
                  const overdue = isInterventionOverdue(intervention);
                  return (
                    <tr
                      key={intervention._id}
                      className={`hover:bg-gray-50 ${overdue ? 'bg-red-100/50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{intervention.siteId || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="text-sm text-gray-500 max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                          title={intervention.description || 'No description provided'}
                        >
                          {intervention.description
                            ? intervention.description.length > 25
                              ? `${intervention.description.substring(0, 25)}...`
                              : intervention.description
                            : 'No description provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(intervention.plannedDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimeSlot(intervention.timeSlot)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(
                            intervention.priority
                          )}`}
                        >
                          {intervention.priority || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            overdue ? 'overdue' : intervention.status
                          )}`}
                        >
                          {overdue ? 'Overdue' : intervention.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{intervention.createdBy?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(intervention.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                        <button
                          onClick={() => handleViewDetailsClick(intervention)}
                          className={`px-3 py-1 rounded text-sm ${
                            currentUser?.isActive
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={!currentUser?.isActive}
                          aria-label={`View details for intervention ${intervention._id}`}
                        >
                          View Details
                        </button>
                        {intervention.status.toLowerCase() === 'planned' && (
                          <button
                            onClick={() => handleStartClick(intervention)}
                            className={`px-3 py-1 rounded text-sm ${
                              currentUser?.isActive && !overdue
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            disabled={!currentUser?.isActive || overdue}
                            aria-label={`Start intervention ${intervention._id}`}
                          >
                            Start
                          </button>
                        )}
                        {intervention.status.toLowerCase() !== 'completed' && (
                          <button
                            onClick={() => handleResolveClick(intervention)}
                            className={`px-3 py-1 rounded text-sm ${
                              currentUser?.isActive && !overdue
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            disabled={!currentUser?.isActive || overdue}
                            aria-label={`Resolve intervention ${intervention._id}`}
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showResolveModal && currentUser?.isActive && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Resolve Intervention</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleResolveSubmit}>
              <div className="mb-4">
                <label htmlFor="resolutionNotes" className="block text-sm font-medium text-gray-700">
                  Resolution Notes
                </label>
                <textarea
                  id="resolutionNotes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  required
                  aria-required="true"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="validatedBy" className="block text-sm font-medium text-gray-700">
                  Validated By
                </label>
                <input
                  id="validatedBy"
                  type="text"
                  value={validatedBy}
                  onChange={(e) => setValidatedBy(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  aria-required="true"
                  readOnly
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeResolveModal}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  aria-label="Cancel resolution"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  aria-label="Submit resolution"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailsModal && currentUser?.isActive && interventionDetails && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Intervention Details</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Site ID</label>
                <p className="text-sm text-gray-500">{interventionDetails.siteId || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-500">{interventionDetails.description || 'No description provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Planned Date</label>
                <p className="text-sm text-gray-500">{formatDate(interventionDetails.plannedDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time Slot</label>
                <p className="text-sm text-gray-500">{formatTimeSlot(interventionDetails.timeSlot)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(
                    interventionDetails.priority
                  )}`}
                >
                  {interventionDetails.priority || 'N/A'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                    isInterventionOverdue(interventionDetails) ? 'overdue' : interventionDetails.status
                  )}`}
                >
                  {isInterventionOverdue(interventionDetails) ? 'Overdue' : interventionDetails.status || 'N/A'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created By</label>
                <p className="text-sm text-gray-500">{interventionDetails.createdBy?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="text-sm text-gray-500">{formatDate(interventionDetails.createdAt)}</p>
              </div>
              {interventionDetails.status.toLowerCase() === 'completed' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resolution Notes</label>
                    <p className="text-sm text-gray-500">{interventionDetails.resolutionNotes || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Validated By</label>
                    <p className="text-sm text-gray-500">{interventionDetails.validatedBy || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resolved At</label>
                    <p className="text-sm text-gray-500">{formatDate(interventionDetails.resolvedAt) || 'N/A'}</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={closeDetailsModal}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                aria-label="Close details modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

InterventionsTech.propTypes = {
  // No props are passed to this component, but included for consistency
};

export default InterventionsTech;