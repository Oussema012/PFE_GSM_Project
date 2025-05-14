
import React from 'react';

const ViewSiteDetails = ({ isOpen, onClose, site }) => {
  if (!site) return null;

  return (
    isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="flex justify-between items-center border-b px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">View Site Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Reference</label>
                <p className="text-sm text-gray-900">{site.site_reference || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                <p className="text-sm text-gray-900">{site.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <p className="text-sm text-gray-900">{site.status || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Type</label>
                <p className="text-sm text-gray-900">{site.site_type || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <p className="text-sm text-gray-900">{site.location?.address || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <p className="text-sm text-gray-900">{site.location?.region || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <p className="text-sm text-gray-900">{site.location?.lat || '0'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <p className="text-sm text-gray-900">{site.location?.lon || '0'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Power Status</label>
                <p className="text-sm text-gray-900">{site.power_status || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Battery Level (%)</label>
                <p className="text-sm text-gray-900">{site.battery_level || '0'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <p className="text-sm text-gray-900">{site.vendor || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Controller ID</label>
                <p className="text-sm text-gray-900">{site.controller_id || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Technology</label>
              <p className="text-sm text-gray-900">
                {site.technology?.length > 0 ? site.technology.join(', ') : 'N/A'}
              </p>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default ViewSiteDetails;
