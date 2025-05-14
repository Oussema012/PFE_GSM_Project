import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const DetailAlert = ({ isOpen, onClose, alert }) => {
  if (!isOpen || !alert) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full transform transition-all animate-scale-in">
        <div className="flex items-center mb-4">
          <FiAlertCircle className="h-6 w-6 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Alert Details</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Site ID</label>
            <p className="mt-1 text-sm text-gray-500">{alert.siteId || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <p className="mt-1 text-sm text-gray-500">{alert.type || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <p className="mt-1 text-sm text-gray-500">{alert.message || 'No message'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <p className="mt-1 text-sm text-gray-500">{alert.status || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Created At</label>
            <p className="mt-1 text-sm text-gray-500">
              {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Resolved At</label>
            <p className="mt-1 text-sm text-gray-500">
              {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : '-'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Acknowledged</label>
            <p className="mt-1 text-sm text-gray-500">{alert.acknowledged ? 'Yes' : 'No'}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailAlert;