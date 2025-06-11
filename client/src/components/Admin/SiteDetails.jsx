import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiEye, FiRefreshCw, FiAlertCircle, FiX } from 'react-icons/fi';

// Validate MongoDB ObjectId (24-character hex string)
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const SiteDetails = ({ isOpen, onClose, site }) => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch equipment for the site
  const fetchEquipment = async (siteId) => {
    setLoading(true);
    setError('');
    try {
      if (!isValidObjectId(siteId)) {
        setError('Invalid site ID format for fetching equipment.');
        return;
      }
      const response = await axios.get(`http://localhost:8000/api/equipment/${siteId}`);
      const transformedData = response.data.map(item => ({
        ...item,
        equipment_id: item._id,
        name: item.name || 'N/A',
        type: item.type || 'N/A',
        status: item.status || 'N/A',
      }));
      setEquipmentList(transformedData);
    } catch (err) {
      console.error('Fetch Equipment Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      if (err.response?.status === 404) {
        setError('No equipment found for this site.');
      } else if (err.response?.status === 500) {
        setError('Server error while fetching equipment.');
      } else {
        setError('Failed to fetch equipment: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch equipment when site changes
  useEffect(() => {
    if (site?._id) {
      fetchEquipment(site._id);
    }
  }, [site]);

  if (!isOpen || !site) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full transform transition-all animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FiEye className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Site Details</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Site Reference</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{site.reference || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Site Name</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{site.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{site.status || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Site Type</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{site.site_type || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{site.location?.address || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Region</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{site.location?.region || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{site.location?.lat || '0'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{site.location?.lon || '0'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Power Status</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{site.power_status || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Battery Level (%)</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{site.battery_level || '0'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Vendor</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{site.vendor || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Controller ID</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{site.controller_id || 'N/A'}</p>
          </div>
          <div className="col-span-1 sm:col-span-2 lg:col-span-4">
            <label className="block text-sm font-medium text-gray-700">Technology</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">
              {site.technology?.length > 0 ? site.technology.join(', ') : 'N/A'}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Equipment</label>
          {loading ? (
            <div className="flex justify-center items-center p-4">
              <FiRefreshCw className="animate-spin h-6 w-6 text-indigo-600" />
              <span className="ml-2 text-sm text-gray-600">Loading equipment...</span>
            </div>
          ) : equipmentList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {equipmentList.map((eq) => (
                    <tr key={eq._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{eq.name || 'N/A'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{eq.type || 'N/A'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            eq.status === 'operational'
                              ? 'bg-green-100 text-green-800'
                              : eq.status === 'faulty'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {eq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No equipment found for this site.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiteDetails;