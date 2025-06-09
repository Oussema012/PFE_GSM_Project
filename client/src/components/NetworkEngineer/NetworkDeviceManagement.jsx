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
  const [equipmentData, setEquipmentData] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSites();
  }, []);

  // Fetch sites and their equipment
  const fetchSites = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/sites?_=' + new Date().getTime());
      console.log('Raw API Response:', response.data);
      const normalizedSites = response.data.map((site, index) => {
        const normalized = {
          ...site,
          location: {
            address: site.address || '',
            region: site.region || '',
            lat: site.location?.lat || 0,
            lon: site.location?.lon || 0,
          },
          technology: Array.isArray(site.technology) ? site.technology : [],
          status: site.status || 'unknown',
          power_status: site.power_status || 'unknown',
          battery_level: Number.isFinite(site.battery_level) ? Math.min(Math.max(site.battery_level, 0), 100) : 0,
          site_id: site.site_id || '',
          site_reference: site.site_reference || `SITE_${index + 1}`,
          site_type: site.site_type || '',
          temperature: site.temperature || 0,
          last_updated: site.last_updated || null,
          alarms: Array.isArray(site.alarms) ? site.alarms : [],
          controller_id: site.controller_id || '',
          vendor: site.vendor || '',
          ac_status: site.ac_status || '',
          reference: site.reference || '',
          created_at: site.created_at || null,
          equipment_status: site.equipment_status || 'unknown',
          humidity: site.humidity || 0,
          last_temperature: site.last_temperature || 0,
          signal_strength: site.signal_strength || 0,
          voltage_level: site.voltage_level || 0,
          ac_on_timestamp: site.ac_on_timestamp || 0,
        };
        console.log(`Normalized Site ${site.name || normalized.site_reference}:`, normalized);
        return normalized;
      });
      setSites(normalizedSites);

      // Fetch equipment for each site
      const equipmentPromises = normalizedSites.map(async (site) => {
        if (!isValidObjectId(site._id)) {
          console.warn(`Invalid site ID format for site ${site.name || site.site_reference}: ${site._id}`);
          return { siteId: site._id, equipment: [] };
        }
        try {
          const equipmentResponse = await axios.get(`http://localhost:8000/api/equipment/${site._id}`);
          // Deduplicate equipment by _id
          const uniqueEquipment = Array.from(
            new Map(equipmentResponse.data.map((eq) => [eq._id, eq])).values()
          );
          return { siteId: site._id, equipment: uniqueEquipment };
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
      console.error('Fetch Sites Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (site) => {
    setCurrentSite(site);
    setIsViewModalOpen(true);
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-red-100 text-red-800',
    unknown: 'bg-gray-100 text-gray-800',
  };

  const powerStatusColors = {
    ok: 'bg-green-100 text-green-800',
    good: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
    unknown: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Network Device Management</h1>
        <button
          onClick={fetchSites}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors duration-200"
        >
          Refresh Data
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-sm">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="ml-3 text-sm text-red-700">{error}</p>
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
                {sites.length > 0 ? (
                  sites.map((site) => (
                    <tr key={site._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {site.name || 'Unnamed Site'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            statusColors[site.status.toLowerCase()] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {site.status ? site.status.charAt(0).toUpperCase() + site.status.slice(1) : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {site.location?.address && site.location?.region
                          ? `${site.location.address}, ${site.location.region}`
                          : 'Unknown Location'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {site.technology.length > 0 ? (
                            site.technology.map((tech, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                              >
                                {tech}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">No Technology</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              powerStatusColors[site.power_status.toLowerCase()] || 'bg-gray-100 text-gray-800'
                            }`}
                            title={`Power Status: ${site.power_status || 'unknown'}`}
                          >
                            {site.power_status ? site.power_status.charAt(0).toUpperCase() + site.power_status.slice(1) : 'Unknown'}
                          </span>
                          {Number.isFinite(site.battery_level) && (
                            <div className="w-16 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-300 ${
                                  site.battery_level > 50 ? 'bg-green-500' :
                                  site.battery_level > 20 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${site.battery_level}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Number.isFinite(site.battery_level) ? `${site.battery_level}%` : 'N/A'}
                        </div>
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
                                  title={`Equipment: ${eq.name || 'Unnamed'} (Status: ${eq.status || 'unknown'})`}
                                ></span>
                                <span>{eq.name || 'Unnamed Equipment'}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-500">No Equipment</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleView(site)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors duration-200"
                            title="View Details"
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
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No sites found
                    </td>
                  </tr>
                )}
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