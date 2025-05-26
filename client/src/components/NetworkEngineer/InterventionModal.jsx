import React from 'react';
import PropTypes from 'prop-types';

const InterventionModal = ({ intervention, onClose }) => {
  if (!intervention) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Intervention Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          <p>
            <span className="font-medium">Site ID:</span> {intervention.siteId || 'N/A'}
          </p>
          <p>
            <span className="font-medium">Technician:</span>{' '}
            {intervention.technician?.name || 'N/A'}
          </p>
          <p>
            <span className="font-medium">Technician Email:</span>{' '}
            {intervention.technician?.email || 'N/A'}
          </p>
          <p>
            <span className="font-medium">Planned Date:</span>{' '}
            {new Date(intervention.plannedDate).toLocaleDateString()}
          </p>
          <p>
            <span className="font-medium">Priority:</span> {intervention.priority || 'N/A'}
          </p>
          <p>
            <span className="font-medium">Status:</span> {intervention.status || 'N/A'}
          </p>
          <p>
            <span className="font-medium">Description:</span>{' '}
            {intervention.description || 'No description provided'}
          </p>
          {intervention.resolvedAt && (
            <p>
              <span className="font-medium">Resolved At:</span>{' '}
              {new Date(intervention.resolvedAt).toLocaleDateString()}
            </p>
          )}
          {intervention.resolutionNotes && (
            <p>
              <span className="font-medium">Resolution Notes:</span>{' '}
              {intervention.resolutionNotes}
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

InterventionModal.propTypes = {
  intervention: PropTypes.shape({
    _id: PropTypes.string,
    siteId: PropTypes.string,
    technician: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string,
    }),
    plannedDate: PropTypes.string,
    priority: PropTypes.string,
    status: PropTypes.string,
    description: PropTypes.string,
    resolvedAt: PropTypes.string,
    resolutionNotes: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default InterventionModal;