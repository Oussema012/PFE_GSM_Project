import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DashMapSites = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default center for the map (e.g., central US coordinates)
  const defaultCenter = [39.8283, -98.5795];
  const defaultZoom = 4;

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch('/api/map/sites');
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.get('content-type'));
        const text = await response.text();
        console.log('Raw response:', text);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = JSON.parse(text);
        setSites(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  if (loading) {
    return <div>Loading map...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="w-full h-[500px]">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {sites.map((site) => (
          site.location &&
          site.location.coordinates && (
            <Marker
              key={site.site_id}
              position={[site.location.coordinates[1], site.location.coordinates[0]]}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">{site.name}</h3>
                  <p>Status: {site.status}</p>
                  <p>ID: {site.site_id}</p>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
};

export default DashMapSites;