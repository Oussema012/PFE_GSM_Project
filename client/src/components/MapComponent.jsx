import React, { useEffect } from 'react';
import L from 'leaflet';

const MapComponent = ({ topology, selectedDeviceId, onDeviceSelect }) => {
  useEffect(() => {
    // Initialize the map (assuming the div with id 'map' exists)
    const map = L.map('map').setView([0, 0], 2); // Default center (0, 0) and zoom level 2

    // Add tile layer (for OpenStreetMap or any other map provider)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Add markers for each device in the GNS3 topology
    topology.forEach((device) => {
      const { x, y, name } = device.position || {}; // Assuming position has x and y
      if (x && y) {
        const marker = L.marker([y, x]) // Note: Leaflet uses [lat, lng], so you may need to adjust.
          .addTo(map)
          .bindPopup(`<b>${name}</b><br>${device.details || 'No details available'}`)
          .on('click', () => onDeviceSelect(device.device_id)); // Select the device when marker is clicked
      }
    });

    // If a device is selected, zoom into it
    if (selectedDeviceId) {
      const selectedDevice = topology.find((device) => device.device_id === selectedDeviceId);
      if (selectedDevice && selectedDevice.position) {
        map.setView([selectedDevice.position.y, selectedDevice.position.x], 10); // Zoom into the selected device
      }
    }

    // Cleanup map on unmount
    return () => {
      map.remove();
    };
  }, [topology, selectedDeviceId, onDeviceSelect]);

  return <div id="map" style={{ height: '400px' }}></div>;
};

export default MapComponent;
