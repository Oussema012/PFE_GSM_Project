import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiEye,
} from 'react-icons/fi';
import { FaWrench } from 'react-icons/fa';
import moment from 'moment-timezone';

// Set axios base URL
axios.defaults.baseURL = 'http://localhost:8000';

const DashMapSites = () => {
  const [maintenances, setMaintenances] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(null);

  // Fetch all maintenance records
  const fetchMaintenances = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/maintenance');
      if (!Array.isArray(response.data)) {
        throw new Error('Maintenance data is not an array');
      }
      setMaintenances(response.data);
    } catch (err) {
      console.error('Fetch maintenances error:', err.response?.data || err.message);
      setError(`Failed to fetch maintenance records: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all technicians
  const fetchTechnicians = async () => {
    try {
      const response = await axios.get('/api/technicians');
      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error('Technician data is invalid');
      }
      setTechnicians(response.data.data);
    } catch (err) {
      console.error('Fetch technicians error:', err.response?.data || err.message);
      setError(`Failed to fetch technicians: ${err.response?.data?.message || err.message}`);
    }
  };

  // Open details modal
  const openDetailsModal = (maintenance) => {
    setShowDetailsModal(maintenance);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(null);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchMaintenances();
    fetchTechnicians();
  }, []);

  // Render maintenance cards
  const renderCards = () => {
    const sortedMaintenances = [...maintenances].sort((a, b) =>
      moment(a.performedAt || a.scheduledDate).diff(moment(b.performedAt || b.scheduledDate))
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedMaintenances.map((maintenance) => (
          <div
            key={maintenance._id}
            className={`p-4 rounded-lg shadow-md border-l-4 ${
              maintenance.status === 'completed'
                ? 'border-green-500 bg-green-50'
                : maintenance.status === 'in progress'
                ? 'border-orange-500 bg-orange-50'
                : 'border-red-500 bg-red-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900">{maintenance.description}</h4>
                <p className="text-sm text-gray-600">
                  Equipment: {maintenance.equipmentId?.name || 'Unknown'}
                </p>
                <p className="text-sm text-gray-600">
                  Technician: {maintenance.performedBy?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 flex items-center">
                  <FiClock className="mr-1" />
                  {maintenance.performedAt
                    ? moment(maintenance.performedAt).tz('Europe/Paris').format('YYYY-MM-DD h:mm A')
                    : moment(maintenance.scheduledDate).tz('Europe/Paris').format('YYYY-MM-DD')}
                </p>
                <p className="text-sm font-medium mt-1 capitalize">
                  Status: {maintenance.status || 'Unknown'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => openDetailsModal(maintenance)}
                  className="text-blue-600 hover:text-blue-900"
                  title="See Details"
                >
                  <FiEye className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {sortedMaintenances.length === 0 && !loading && (
          <div className="col-span-full text-center text-gray-500 py-8">
            No maintenance tasks available.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <header className="bg-white shadow rounded-lg mb-4">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <FaWrench className="mr-2 text-indigo-600" />
              Map Sites Maintenance
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded animate-fade-in">
            <div className="flex items-center">
              <FiCheckCircle className="h-5 w-5 text-green-400" />
              <p className="ml-2 text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded animate-fade-in">
            <div className="flex items-center">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-2 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        <div className="bg-white shadow rounded-lg p-4">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <FiClock className="animate-spin h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            renderCards()
          )}
        </div>

        {showDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full transform transition-all animate-scale-in">
              <div className="flex items-center mb-4">
                <FiEye className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Site Maintenance Details</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site</label>
                  <p className="mt-1 text-sm text-gray-600">
                    {showDetailsModal.equipmentId?.name || 'Unknown'} (
                    {showDetailsModal.equipmentId?.serialNumber || 'N/A'})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-600">{showDetailsModal.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Technician</label>
                  <p className="mt-1 text-sm text-gray-600">
                    {showDetailsModal.performedBy?.name || 'N/A'} (
                    {showDetailsModal.performedBy?.email || 'N/A'})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-600 capitalize">{showDetailsModal.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                  <p className="mt-1 text-sm text-gray-600">
                    {moment(showDetailsModal.scheduledDate).tz('Europe/Paris').format('YYYY-MM-DD')}
                  </p>
                </div>
                {showDetailsModal.scheduledTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Scheduled Time</label>
                    <p className="mt-1 text-sm text-gray-600">
                      {moment(showDetailsModal.scheduledTime, 'HH:mm:ss').format('h:mm A')}
                    </p>
                  </div>
                )}
                {showDetailsModal.performedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Performed At</label>
                    <p className="mt-1 text-sm text-gray-600">
                      {moment(showDetailsModal.performedAt).tz('Europe/Paris').format('MMM D, YYYY h:mm A')}
                    </p>
                  </div>
                )}
                {showDetailsModal.resolutionNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resolution Notes</label>
                    <p className="mt-1 text-sm text-gray-600">{showDetailsModal.resolutionNotes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={closeDetailsModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashMapSites;