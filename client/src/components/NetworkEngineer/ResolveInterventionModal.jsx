// src/components/NetworkEngineer/ResolveInterventionModal.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ResolveInterventionModal = ({ intervention, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    resolutionNotes: '',
    validatedBy: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = () => {
    if (!formData.resolutionNotes) {
      setError('Resolution notes are required.');
      return;
    }
    if (!formData.validatedBy) {
      setError('Validated by is required.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-xl w-full mx-4 animate-fade-in">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Resolve Intervention</h3>
        {error && (
          <div className="mb-4 p-2 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm rounded">{error}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Resolution Notes</label>
            <textarea
              name="resolutionNotes"
              value={formData.resolutionNotes}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              rows="4"
              placeholder="Describe the resolution"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Validated By</label>
            <input
              name="validatedBy"
              value={formData.validatedBy}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Validator name"
            />
          </div>
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
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500"
          >
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
};

ResolveInterventionModal.propTypes = {
  intervention: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default ResolveInterventionModal;