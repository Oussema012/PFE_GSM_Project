import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiEye
} from 'react-icons/fi';

// Validate MongoDB ObjectId (24-character hex string)
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const DashSiteManagement = () => {
  const [sites, setSites] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(null);
  const [showEditEquipmentModal, setShowEditEquipmentModal] = useState(null);
  const [showDeleteEquipmentModal, setShowDeleteEquipmentModal] = useState(null);
  const [formData, setFormData] = useState({ site_id: '', name: '', status: '' });
  const [equipmentFormData, setEquipmentFormData] = useState({ equipment_id: '', name: '', type: '', status: '', siteId: '' });

  // Fetch all sites
  const fetchSites = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await axios.get('http://localhost:3000/api/sites');
      setSites(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Sites endpoint not found. Please check the server configuration.');
      } else if (err.response?.status === 500) {
        setError('Server error while fetching sites. Please try again later.');
      } else {
        setError('Failed to fetch sites: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch equipment for a site
  const fetchEquipment = async (siteId) => {
    setLoading(true);
    setError('');
    try {
      if (!isValidObjectId(siteId)) {
        setError('Invalid site ID format for fetching equipment.');
        return;
      }
      const response = await axios.get(`http://localhost:3000/api/equipment/${siteId}`);
      setEquipment(response.data);
    } catch (err) {
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

  // Create a new site
  const createSite = async () => {
    setError('');
    setSuccessMessage('');
    try {
      if (!formData.site_id || !formData.name || !formData.status) {
        setError('Site ID, name, and status are required.');
        return;
      }
      const response = await axios.post('http://localhost:3000/api/sites', formData);
      setSites([...sites, response.data]);
      setSuccessMessage('Site created successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowCreateModal(false);
      setFormData({ site_id: '', name: '', status: '' });
    } catch (err) {
      if (err.response?.status === 400) {
        setError('Invalid input: ' + err.response.data.message);
      } else {
        setError('Failed to create site: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Update a site
  const updateSite = async () => {
    setError('');
    setSuccessMessage('');
    try {
      if (!formData.name && !formData.status) {
        setError('Name or status is required for update.');
        return;
      }
      const response = await axios.put(`http://localhost:3000/api/sites/${showEditModal}`, formData);
      setSites(sites.map(site => site._id === showEditModal ? response.data : site));
      setSuccessMessage('Site updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowEditModal(null);
      setFormData({ site_id: '', name: '', status: '' });
    } catch (err) {
      if (err.response?.status === 400) {
        setError('Invalid input: ' + err.response.data.message);
      } else if (err.response?.status === 404) {
        setError('Site not found.');
      } else {
        setError('Failed to update site: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Delete a site
  const confirmDelete = async () => {
    setError('');
    setSuccessMessage('');
    try {
      await axios.delete(`http://localhost:3000/api/sites/${showDeleteModal}`);
      setSites(sites.filter(site => site._id !== showDeleteModal));
      setSuccessMessage('Site deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowDeleteModal(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Site not found.');
      } else {
        setError('Failed to delete site: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Add equipment to a site
  const addEquipment = async () => {
    setError('');
    setSuccessMessage('');
    try {
      // Client-side validation
      if (!equipmentFormData.equipment_id || !equipmentFormData.name || !equipmentFormData.type || !equipmentFormData.status || !equipmentFormData.siteId) {
        setError('Equipment ID, name, type, status, and site ID are required.');
        return;
      }
      if (!isValidObjectId(equipmentFormData.siteId)) {
        setError('Invalid site ID format. Please select a valid site.');
        return;
      }
      if (!['operational', 'faulty', 'maintenance'].includes(equipmentFormData.status)) {
        setError('Status must be one of: operational, faulty, maintenance.');
        return;
      }
      console.log('Sending equipment payload:', JSON.stringify(equipmentFormData, null, 2));
      const response = await axios.post('http://localhost:3000/api/equipment', equipmentFormData);
      setEquipment([...equipment, response.data]);
      setSuccessMessage('Equipment added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowAddEquipmentModal(null);
      setEquipmentFormData({ equipment_id: '', name: '', type: '', status: '', siteId: '' });
    } catch (err) {
      console.error('Add equipment error:', JSON.stringify(err.response?.data || err.message, null, 2));
      if (err.response?.status === 400) {
        const message = err.response?.data?.message || 'Invalid input';
        if (message.includes('E11000 duplicate key error') && message.includes('equipment_id')) {
          setError('Equipment ID already exists. Please use a unique ID.');
        } else if (message.includes('Invalid site ID') || message.includes('Cast to ObjectId failed')) {
          setError('Invalid site ID. Please select a valid site.');
        } else if (message.includes('Site not found')) {
          setError('Site not found for the provided site ID.');
        } else {
          setError(`Failed to add equipment: ${message}`);
        }
      } else if (err.response?.status === 404) {
        setError('Site not found for the provided site ID.');
      } else {
        setError('Failed to add equipment: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Update equipment
  const updateEquipment = async () => {
    setError('');
    setSuccessMessage('');
    try {
      if (!equipmentFormData.name && !equipmentFormData.type && !equipmentFormData.status) {
        setError('Name, type, or status is required for update.');
        return;
      }
      if (equipmentFormData.status && !['operational', 'faulty', 'maintenance'].includes(equipmentFormData.status)) {
        setError('Status must be one of: operational, faulty, maintenance.');
        return;
      }
      console.log('Updating equipment payload:', JSON.stringify(equipmentFormData, null, 2));
      const response = await axios.put(`http://localhost:3000/api/equipment/${showEditEquipmentModal}`, equipmentFormData);
      setEquipment(equipment.map(eq => eq._id === showEditEquipmentModal ? response.data : eq));
      setSuccessMessage('Equipment updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowEditEquipmentModal(null);
      setEquipmentFormData({ equipment_id: '', name: '', type: '', status: '', siteId: '' });
    } catch (err) {
      console.error('Update equipment error:', JSON.stringify(err.response?.data || err.message, null, 2));
      if (err.response?.status === 400) {
        setError('Invalid input: ' + err.response.data.message);
      } else if (err.response?.status === 404) {
        setError('Equipment not found.');
      } else {
        setError('Failed to update equipment: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Delete equipment
  const confirmDeleteEquipment = async () => {
    setError('');
    setSuccessMessage('');
    try {
      await axios.delete(`http://localhost:3000/api/equipment/${showDeleteEquipmentModal}`);
      setEquipment(equipment.filter(eq => eq._id !== showDeleteEquipmentModal));
      setSuccessMessage('Equipment deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowDeleteEquipmentModal(null);
    } catch (err) {
      console.error('Delete equipment error:', JSON.stringify(err.response?.data || err.message, null, 2));
      if (err.response?.status === 404) {
        setError('Equipment not found.');
      } else {
        setError('Failed to delete equipment: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Handle site form input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle equipment form input changes
  const handleEquipmentInputChange = (e) => {
    setEquipmentFormData({ ...equipmentFormData, [e.target.name]: e.target.value });
  };

  // Open edit modal with site data
  const openEditModal = (site) => {
    setFormData({ site_id: site.site_id, name: site.name, status: site.status });
    setShowEditModal(site._id);
  };

  // Open details modal and fetch equipment
  const openDetailsModal = async (site) => {
    if (!isValidObjectId(site._id)) {
      setError('Invalid site ID format for viewing details.');
      return;
    }
    setFormData({ site_id: site.site_id, name: site.name, status: site.status });
    setShowDetailsModal(site._id);
    await fetchEquipment(site._id);
  };

  // Open add equipment modal
  const openAddEquipmentModal = (siteId) => {
    if (!isValidObjectId(siteId)) {
      setError('Invalid site ID format for adding equipment.');
      return;
    }
    setEquipmentFormData({ equipment_id: '', name: '', type: '', status: '', siteId });
    setShowAddEquipmentModal(siteId);
  };

  // Open edit equipment modal
  const openEditEquipmentModal = (eq) => {
    if (!isValidObjectId(eq.siteId)) {
      setError('Invalid site ID format for editing equipment.');
      return;
    }
    setEquipmentFormData({ 
      equipment_id: eq.equipment_id, 
      name: eq.name, 
      type: eq.type || '', 
      status: eq.status, 
      siteId: eq.siteId 
    });
    setShowEditEquipmentModal(eq._id);
  };

  useEffect(() => {
    fetchSites();
  }, []);

  // Filter sites by search query and status (client-side)
  const filteredSites = sites.filter(site =>
    (site.site_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
     site.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (statusFilter ? site.status === statusFilter : true)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              <FiFilter className="inline-block mr-2 text-indigo-600" />
              Site Management
            </h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <FiPlus className="mr-2" />
                Add Site
              </button>
              <button
                onClick={fetchSites}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
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

        {/* Filters Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by site ID or name..."
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md appearance-none"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FiFilter className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Site Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full transform transition-all animate-scale-in">
              <div className="flex items-center mb-4">
                <FiPlus className="h-6 w-6 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Create Site</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site ID</label>
                  <input
                    type="text"
                    name="site_id"
                    value={formData.site_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter site ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter site name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={createSite}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Site Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full transform transition-all animate-scale-in">
              <div className="flex items-center mb-4">
                <FiEdit className="h-6 w-6 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Edit Site</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site ID</label>
                  <input
                    type="text"
                    name="site_id"
                    value={formData.site_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter site ID"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter site name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={updateSite}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Site Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full transform transition-all animate-scale-in">
              <div className="flex items-center mb-4">
                <FiTrash2 className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Site</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this site? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

       {/* Site Details Modal */}
{showDetailsModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full transform transition-all animate-scale-in">
      <div className="flex items-center mb-4">
        <FiEye className="h-6 w-6 text-indigo-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Site Details</h3>
      </div>
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiCheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      {/* Error Message */}
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
          <label className="block text-sm font-medium text-gray-700">Site ID</label>
          <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{formData.site_id || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{formData.name || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{formData.status || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Site Type</label>
          <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{formData.site_type || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{formData.location?.address || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Region</label>
          <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{formData.location?.region || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Latitude</label>
          <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{formData.location?.lat || '0'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Longitude</label>
          <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{formData.location?.lon || '0'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Power Status</label>
          <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{formData.power_status || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Battery Level (%)</label>
          <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{formData.battery_level || '0'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Vendor</label>
          <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{formData.vendor || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Controller ID</label>
          <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">{formData.controller_id || 'N/A'}</p>
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-4">
          <label className="block text-sm font-medium text-gray-700">Technology</label>
          <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-2">
            {formData.technology?.length > 0 ? formData.technology.join(', ') : 'N/A'}
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">Equipment</label>
          <button
            onClick={() => openAddEquipmentModal(showDetailsModal)}
            className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
          >
            <FiPlus className="mr-1 h-4 w-4" />
            Add Equipment
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center p-4">
            <FiRefreshCw className="animate-spin h-6 w-6 text-indigo-600" />
            <span className="ml-2 text-sm text-gray-600">Loading equipment...</span>
          </div>
        ) : equipment.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipment.map((eq) => (
                  <tr key={eq._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{eq.equipment_id}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{eq.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{eq.type || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        eq.status === 'operational' ? 'bg-green-100 text-green-800' :
                        eq.status === 'faulty' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {eq.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openEditEquipmentModal(eq)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteEquipmentModal(eq._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
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
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setShowDetailsModal(null)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

        {/* Add Equipment Modal */}
        {showAddEquipmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full transform transition-all animate-scale-in">
              <div className="flex items-center mb-4">
                <FiPlus className="h-6 w-6 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Add Equipment</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Equipment ID</label>
                  <input
                    type="text"
                    name="equipment_id"
                    value={equipmentFormData.equipment_id}
                    onChange={handleEquipmentInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter equipment ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={equipmentFormData.name}
                    onChange={handleEquipmentInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter equipment name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <input
                    type="text"
                    name="type"
                    value={equipmentFormData.type}
                    onChange={handleEquipmentInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter equipment type (e.g., Antenna, Generator)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={equipmentFormData.status}
                    onChange={handleEquipmentInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select status</option>
                    <option value="operational">Operational</option>
                    <option value="faulty">Faulty</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddEquipmentModal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={addEquipment}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Equipment Modal */}
        {showEditEquipmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full transform transition-all animate-scale-in">
              <div className="flex items-center mb-4">
                <FiEdit className="h-6 w-6 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Edit Equipment</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Equipment ID</label>
                  <input
                    type="text"
                    name="equipment_id"
                    value={equipmentFormData.equipment_id}
                    onChange={handleEquipmentInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter equipment ID"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={equipmentFormData.name}
                    onChange={handleEquipmentInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter equipment name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <input
                    type="text"
                    name="type"
                    value={equipmentFormData.type}
                    onChange={handleEquipmentInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter equipment type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={equipmentFormData.status}
                    onChange={handleEquipmentInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select status</option>
                    <option value="operational">Operational</option>
                    <option value="faulty">Faulty</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditEquipmentModal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={updateEquipment}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Equipment Confirmation Modal */}
        {showDeleteEquipmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full transform transition-all animate-scale-in">
              <div className="flex items-center mb-4">
                <FiTrash2 className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Equipment</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this equipment? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteEquipmentModal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteEquipment}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sites Table */}
        {!loading && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Site ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSites.length > 0 ? (
                    filteredSites.map((site) => (
                      <tr key={site._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {site.site_id}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{site.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            site.status === 'active' ? 'bg-green-100 text-green-800' :
                            site.status === 'inactive' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {site.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => openDetailsModal(site)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <FiEye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => openEditModal(site)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit"
                            >
                              <FiEdit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(site._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                        No sites found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center items-center p-8">
            <FiRefreshCw className="animate-spin h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashSiteManagement;