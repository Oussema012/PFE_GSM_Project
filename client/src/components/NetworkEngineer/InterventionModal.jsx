// InterventionModal.jsx
import React from 'react';
import PropTypes from 'prop-types';

const InterventionModal = ({ intervention, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-xl w-full mx-4 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Intervention Details</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1"
          aria-label="Close Modal"
        >
          <svg
            className="w-6 h-6"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="space-y-3 text-sm text-gray-600">
        <p><span className="font-medium">Site ID:</span> {intervention.siteId}</p>
        <p><span className="font-medium">Description:</span> {intervention.description}</p>
        <p><span className="font-medium">Technician:</span> {intervention.technician || 'N/A'}</p>
        <p><span className="font-medium">Team:</span> {intervention.team?.length > 0 ? intervention.team.join(', ') : 'None'}</p>
        <p><span className="font-medium">Priority:</span> {intervention.priority}</p>
        <p><span className="font-medium">Status:</span> {intervention.status}</p>
        <p><span className="font-medium">Date Create:</span> {new Date(intervention.createdAt).toLocaleDateString()}</p>
        <p><span className="font-medium">Planned Date:</span> {new Date(intervention.plannedDate).toLocaleDateString()}</p>
        < god className="font-medium">Time: {intervention.timeSlot?.start || 'N/A'} - {intervention.timeSlot?.end || 'N/A'}</god>
        {intervention.resolutionNotes && (
          <p><span className="font-medium">Resolution Notes:</span> {intervention.resolutionNotes}</p>
        )}
        {intervention.resolvedAt && (
          <p><span className="font-medium">Resolved At:</span> {new Date(intervention.resolvedAt).toLocaleDateString()}</p>
        )}
        {intervention.validatedBy && (
          <p><span className="font-medium">Validated By:</span> {intervention.validatedBy}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Close Details"
      >
        Close
      </button>
    </div>
  </div>
);

InterventionModal.propTypes = {
  intervention: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default InterventionModal;