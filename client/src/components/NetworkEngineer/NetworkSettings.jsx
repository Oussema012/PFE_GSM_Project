import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiClock
} from 'react-icons/fi';
import { FaWrench } from 'react-icons/fa';
import moment from 'moment';

// Set axios base URL
axios.defaults.baseURL = 'http://localhost:3000';

const NetworkSettings = () => {
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  const [formData, setFormData] = useState({
    equipmentId: '',
    description: '',
    performedBy: '',
    status: 'pending',
    scheduledDate: moment().format('YYYY-MM-DD'),
    scheduledTime: '09:00'
  });

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
      setError('Failed to fetch maintenance records: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Add new maintenance
  const addMaintenance = async () => {
    setError('');
    setSuccessMessage('');
    try {
      if (!formData.equipmentId || !formData.description || !formData.performedBy) {
        setError('Equipment ID, description, and performed by are required.');
        return;
      }

      const scheduledDateTime = moment(`${formData.scheduledDate} ${formData.scheduledTime}`, 'YYYY-MM-DD HH:mm').format();

      const payload = {
        ...formData,
        scheduledDate: scheduledDateTime,
      };

      const response = await axios.post('/api/maintenance', payload);
      setMaintenances([...maintenances, response.data]);
      setSuccessMessage('Maintenance added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowAddModal(false);
      resetForm();
      fetchMaintenances();
    } catch (err) {
      console.error('Add maintenance error:', err.response?.data || err.message);
      setError('Failed to add maintenance: ' + (err.response?.data?.message || err.message));
    }
  };

  // Update maintenance
  const updateMaintenance = async () => {
    setError('');
    setSuccessMessage('');
    try {
      if (!formData.description && !formData.performedBy && !formData.status) {
        setError('At least one field (description, performed by, or status) is required for update.');
        return;
      }

      let updatedData = { ...formData };
      if (formData.scheduledDate && formData.scheduledTime) {
         updatedData.scheduledDate = moment(`${formData.scheduledDate} ${formData.scheduledTime}`, 'YYYY-MM-DD HH:mm').format();
      }

      const response = await axios.put(`/api/maintenance/${showEditModal}`, updatedData);
      setMaintenances(maintenances.map(m => (m._id === showEditModal ? response.data : m)));
      setSuccessMessage('Maintenance updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowEditModal(null);
      resetForm();
      fetchMaintenances();
    } catch (err) {
      console.error('Update maintenance error:', err.response?.data || err.message);
      setError('Failed to update maintenance: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete maintenance
  const deleteMaintenance = async () => {
    setError('');
    setSuccessMessage('');
    try {
      await axios.delete(`/api/maintenance/${showDeleteModal}`);
      setMaintenances(maintenances.filter(m => m._id !== showDeleteModal));
      setSuccessMessage('Maintenance deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowDeleteModal(null);
    } catch (err) {
      console.error('Delete maintenance error:', err.response?.data || err.message);
      setError('Failed to delete maintenance: ' + (err.response?.data?.message || err.message));
    }
  };

  // Reset form fields
  const resetForm = () => {
    setFormData({
      equipmentId: '',
      description: '',
      performedBy: '',
      status: 'pending',
      scheduledDate: moment().format('YYYY-MM-DD'),
      scheduledTime: '09:00',
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Open edit modal with maintenance data
  const openEditModal = (maintenance) => {
    const scheduledMoment = moment(maintenance.scheduledDate);
    setFormData({
      equipmentId: maintenance.equipmentId,
      description: maintenance.description,
      performedBy: maintenance.performedBy,
      status: maintenance.status,
      scheduledDate: scheduledMoment.format('YYYY-MM-DD'),
      scheduledTime: scheduledMoment.format('HH:mm')
    });
    setShowEditModal(maintenance._id);
  };

  // Fetch maintenances on component mount
  useEffect(() => {
    fetchMaintenances();
  }, []);

  // Render maintenance cards
  const renderCards = () => {
    const sortedMaintenances = [...maintenances].sort((a, b) => {
      return moment(a.scheduledDate).diff(moment(b.scheduledDate));
    });

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedMaintenances.map(maintenance => (
          <div
            key={maintenance._id}
            className={`p-4 rounded-lg shadow-md border-l-4 ${
              maintenance.status === 'completed' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900">{maintenance.description}</h4>
                <p className="text-sm text-gray-600">Equipment: {maintenance.equipmentId}</p>
                <p className="text-sm text-gray-600">Technician: {maintenance.performedBy}</p>
                <p className="text-sm text-gray-600 flex items-center">
                  <FiClock className="mr-1" />
                  {moment(maintenance.scheduledDate).format('MMM D, YYYY h:mm A')}
                </p>
                <p className="text-sm font-medium mt-1">
                  Status: {maintenance.status.charAt(0).toUpperCase() + maintenance.status.slice(1)}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(maintenance)}
                  className="text-indigo-600 hover:text-indigo-900"
                  title="Edit"
                >
                  <FiEdit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowDeleteModal(maintenance._id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {sortedMaintenances.length === 0 && !loading && (
          <div className="col-span-full text-center text-gray-500 py-8">
            No maintenance tasks scheduled. Click "Add Maintenance" to create one.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      {/* Header */}
      <header className="bg-white shadow rounded-lg mb-4">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <FaWrench className="mr-2 text-indigo-600" />
              Maintenance Schedule
            </h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <FiPlus className="mr-1" />
                Add Maintenance
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded">
            <div className="flex">
              <FiCheckCircle className="h-5 w-5 text-green-400" />
              <p className="ml-2 text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
            <div className="flex">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-2 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Maintenance Cards */}
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

        {/* Add Maintenance Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full transform transition-all animate-scale-in">
              <div className="flex items-center mb-4">
                <FiPlus className="h-6 w-6 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Schedule Maintenance</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Equipment ID</label>
                  <input
                    type="text"
                    name="equipmentId"
                    value={formData.equipmentId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Enter equipment ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Enter maintenance description"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Performed By</label>
                  <input
                    type="text"
                    name="performedBy"
                    value={formData.performedBy}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Enter technician name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <input
                      type="time"
                      name="scheduledTime"
                      value={formData.scheduledTime}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={addMaintenance}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Maintenance Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full transform transition-all animate-scale-in">
              <div className="flex items-center mb-4">
                <FiEdit className="h-6 w-6 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Edit Maintenance</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Equipment ID</label>
                  <input
                    type="text"
                    name="equipmentId"
                    value={formData.equipmentId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Enter equipment ID"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Enter maintenance description"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Performed By</label>
                  <input
                    type="text"
                    name="performedBy"
                    value={formData.performedBy}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Enter technician name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <input
                      type="time"
                      name="scheduledTime"
                      value={formData.scheduledTime}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={updateMaintenance}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full transform transition-all animate-scale-in">
              <div className="flex items-center mb-4">
                <FiTrash2 className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Maintenance</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this maintenance record? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteMaintenance}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NetworkSettings;