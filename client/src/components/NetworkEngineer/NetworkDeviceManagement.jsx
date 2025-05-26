import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ViewSite from './ViewSiteDetails';

// Validate MongoDB ObjectId (24-character hex string)
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const NetworkDeviceManagement = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState(null);
  const [equipmentData, setEquipmentData] = useState({}); // Store equipment for each site
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSites();
  }, []);

  // Fetch sites and their equipment
  const fetchSites = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/sites');
      const normalizedSites = response.data.map((site) => ({
        ...site,
        location: site.location || { address: '', region: '', lat: 0, lon: 0 },
        technology: Array.isArray(site.technology) ? site.technology : [],
      }));
      setSites(normalizedSites);

      // Fetch equipment for each site
      const equipmentPromises = normalizedSites.map(async (site) => {
        if (!isValidObjectId(site._id)) {
          console.warn(`Invalid site ID format for site ${site.name}: ${site._id}`);
          return { siteId: site._id, equipment: [] };
        }
        try {
          const equipmentResponse = await axios.get(`http://localhost:3000/api/equipment/${site._id}`);
          return { siteId: site._id, equipment: equipmentResponse.data };
        } catch (err) {
          console.error(`Failed to fetch equipment for site ${site._id}:`, err.message);
          return { siteId: site._id, equipment: [] };
        }
      });

      const equipmentResults = await Promise.all(equipmentPromises);
      const equipmentMap = equipmentResults.reduce((acc, { siteId, equipment }) => {
        acc[siteId] = equipment;
        return acc;
      }, {});
      setEquipmentData(equipmentMap);
    } catch (error) {
      setError(`Failed to fetch sites: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (site) => {
    setCurrentSite(site);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      try {
        await axios.delete(`/api/sites/${id}`);
        alert('Site deleted successfully');
        fetchSites();
      } catch (error) {
        alert(`Failed to delete site: ${error.message}`);
      }
    }
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-red-100 text-red-800',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Network Device Management</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sites Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Technology
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Power
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sites.map((site) => (
                  <tr key={site._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {site.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusColors[site.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {site.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {site.location?.address && site.location?.region
                        ? `${site.location.address}, ${site.location.region}`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {site.technology.length > 0 ? (
                          site.technology.map((tech, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {tech}
                            </span>
                          ))
                        ) : (
                          <span>N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {site.power_status ? `${site.power_status} (${site.battery_level}%)` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-wrap gap-2">
                        {equipmentData[site._id]?.length > 0 ? (
                          equipmentData[site._id].map((eq) => (
                            <div key={eq._id} className="flex items-center">
                              <span
                                className={`inline-block w-3 h-3 rounded-full mr-1 ${
                                  eq.status === 'operational'
                                    ? 'bg-green-500'
                                    : eq.status === 'faulty'
                                    ? 'bg-red-500'
                                    : eq.status === 'maintenance'
                                    ? 'bg-yellow-500'
                                    : 'bg-gray-500'
                                }`}
                                title={`Equipment: ${eq.name} (Status: ${eq.status})`}
                              ></span>
                              <span>{eq.name}</span>
                            </div>
                          ))
                        ) : (
                          <span>N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(site)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(site._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      <ViewSite
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        site={currentSite}
      />
    </div>
  );
};

export default NetworkDeviceManagement;