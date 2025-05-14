import React, { useState } from 'react';
import axios from 'axios';
import { FiPlus } from 'react-icons/fi';

const CreateAlert = ({ isOpen, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({ siteId: '', type: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: '' })); // clear error on change
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.siteId) newErrors.siteId = 'Site ID is required.';
    else if (!isValidObjectId(formData.siteId)) newErrors.siteId = 'Invalid Site ID format.';

    if (!formData.type) newErrors.type = 'Type is required.';
    if (!formData.message) newErrors.message = 'Message is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createAlert = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/alerts', formData);
      onSuccess(response.data, 'Alert created successfully');
      setFormData({ siteId: '', type: '', message: '' });
      onClose();
    } catch (err) {
      onError(`Failed to create alert: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full transform transition-all animate-scale-in">
        <div className="flex items-center mb-4">
          <FiPlus className="h-6 w-6 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Create Alert</h3>
        </div>

        <div className="space-y-4">
          {/* Site ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Site ID</label>
            <input
              type="text"
              name="siteId"
              value={formData.siteId}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.siteId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter site ID"
            />
            {errors.siteId && <p className="text-sm text-red-500 mt-1">{errors.siteId}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select type</option>
              <option value="network">Network</option>
              <option value="server">Server</option>
              <option value="hardware">Hardware</option>
              <option value="security">Security</option>
              <option value="other">Other</option>
            </select>
            {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows="4"
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.message ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter alert message"
            />
            {errors.message && <p className="text-sm text-red-500 mt-1">{errors.message}</p>}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={createAlert}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAlert;
