//alert
import React, { useState } from 'react';
import axios from 'axios';
import { FiCheckCircle } from 'react-icons/fi';

const ResolveByType = ({ isOpen, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({ siteId: '', type: '' });

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resolveAlertByType = async () => {
    try {
      const { siteId, type } = formData;
      if (!siteId || !type) {
        onError('Site ID and type are required.');
        return;
      }
      if (!isValidObjectId(siteId)) {
        onError('Invalid site ID format.');
        return;
      }

      await axios.put('/api/alerts/resolve-by-type', { siteId, type });
      onSuccess({ siteId, type }, 'Alerts resolved successfully');
      setFormData({ siteId: '', type: '' });
      onClose();
    } catch (err) {
      onError(`Failed to resolve alerts: ${err.response?.data?.message || err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full transform transition-all animate-scale-in">
        <div className="flex items-center mb-4">
          <FiCheckCircle className="h-6 w-6 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Resolve Alerts by Type</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Site ID</label>
            <input
              type="text"
              name="siteId"
              value={formData.siteId}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter site ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <input
              type="text"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter alert type"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={resolveAlertByType}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResolveByType;