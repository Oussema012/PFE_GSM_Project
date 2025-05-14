// src/components/NetworkEngineer/UpdateStatusModal.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const UpdateStatusModal = ({ intervention, onClose, onSubmit }) => {
  const [status, setStatus] = useState(intervention.status);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!['planned', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      setError('Invalid status selected.');
      return;
    }
    onSubmit(status);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-fade-in">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Update Intervention Status</h3>
        {error && (
          <div className="mb-4 p-2 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm rounded">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="planned">Planned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

UpdateStatusModal.propTypes = {
  intervention: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default UpdateStatusModal;