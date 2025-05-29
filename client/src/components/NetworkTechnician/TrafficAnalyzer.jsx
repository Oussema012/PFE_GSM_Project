import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Mock data for sites with provided coordinates
const mockSites = [
  {
    _id: 'site1',
    site_reference: 'SITE001',
    name: 'Site A',
    status: 'active',
    location: { lat: 36.80220083917556, lng: 10.18318659934678 },
    technology: '4G',
    site_type: 'Base Station',
    power_status: 'on',
    battery_level: 85,
    temperature: 22,
    last_updated: '2025-05-29T12:00:00Z',
    alarms: [],
    controller_id: 'ctrl1',
    vendor: 'Nokia',
    ac_status: 'normal',
  },
  {
    _id: 'site2',
    site_reference: 'SITE002',
    name: 'Site B',
    status: 'maintenance',
    location: { lat: 36.800525810503984, lng: 10.179632539377895 },
    technology: '5G',
    site_type: 'Base Station',
    power_status: 'on',
    battery_level: 90,
    temperature: 24,
    last_updated: '2025-05-29T12:30:00Z',
    alarms: ['Low Signal'],
    controller_id: 'ctrl2',
    vendor: 'Huawei',
    ac_status: 'normal',
  },
];

const TrafficAnalyzer = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch sites from API
  const fetchSites = async () => {
    setLoading(true);
    setError('');
    try {
      // Replace with actual API call
      // const response = await fetch('http://localhost:3000/api/sites');
      // const data = await response.json();
      // setSites(data);

      // Using mock data for now
      setTimeout(() => {
        setSites(mockSites);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError('Failed to fetch site records');
      setLoading(false);
    }
  };

  // Fetch site details by ID
  const fetchSiteDetails = async (siteId) => {
    setLoading(true);
    setError('');
    try {
      // Replace with actual API call
      // const response = await fetch(`http://localhost:3000/api/sites/${siteId}`);
      // const data = await response.json();
      // return data;

      // Using mock data for now
      const site = mockSites.find(s => s._id === siteId);
      setLoading(false);
      return site || null;
    } catch (err) {
      setError('Failed to fetch site details');
      setLoading(false);
      return null;
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchSites();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      {/* Header */}
      <header className="bg-white shadow rounded-lg mb-4">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900">Traffic Analyzer Map - Tunisia</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {/* Map */}
        <div className="bg-white shadow rounded-lg mb-4">
          <MapContainer center={[36.80136332483977, 10.181409569362337]} zoom={15} style={{ height: '500px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {sites.map(site => (
              site.location && (
                <Marker
                  key={site._id}
                  position={[site.location.lat, site.location.lng]}
                >
                  <Popup>
                    <div className="space-y-2 p-2 max-w-xs">
                      <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Site Reference</label>
                        <p className="text-sm text-gray-600">{site.site_reference || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <p className="text-sm text-gray-600 capitalize">{site.status || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <p className="text-sm text-gray-600">
                          Lat: {site.location?.lat || 'N/A'}, Lng: {site.location?.lng || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Technology</label>
                        <p className="text-sm text-gray-600">{site.technology || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Site Type</label>
                        <p className="text-sm text-gray-600">{site.site_type || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Power Status</label>
                        <p className="text-sm text-gray-600">{site.power_status || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Battery Level</label>
                        <p className="text-sm text-gray-600">{site.battery_level ? `${site.battery_level}%` : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Temperature</label>
                        <p className="text-sm text-gray-600">{site.temperature ? `${site.temperature}°C` : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                        <p className="text-sm text-gray-600">
                          {site.last_updated ? new Date(site.last_updated).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Alarms</label>
                        <p className="text-sm text-gray-600">
                          {site.alarms && site.alarms.length > 0 ? site.alarms.join(', ') : 'None'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Controller ID</label>
                        <p className="text-sm text-gray-600">{site.controller_id || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Vendor</label>
                        <p className="text-sm text-gray-600">{site.vendor || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">AC Status</label>
                        <p className="text-sm text-gray-600">{site.ac_status || 'N/A'}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
            <div className="flex">
              <p className="ml-2 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center p-8">
            <span className="text-gray-600">Loading...</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default TrafficAnalyzer;