import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiPlus, FiX, FiEdit, FiTrash2, FiCheckCircle, FiAlertCircle, FiEye, FiRefreshCw } from 'react-icons/fi';

// Validate MongoDB ObjectId (24-character hex string)
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Fallback static equipment options for testing
const fallbackEquipmentOptions = [
  { equipment_id: 'eq001', name: 'Antenna A', type: 'Antenna' },
  { equipment_id: 'eq002', name: 'Generator B', type: 'Generator' },
  { equipment_id: 'eq003', name: 'Router C', type: 'Router' },
];

const ViewSiteDetails = ({ isOpen, onClose, site }) => {
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showEditEquipmentModal, setShowEditEquipmentModal] = useState(null);
  const [showDeleteEquipmentModal, setShowDeleteEquipmentModal] = useState(null);
  const [equipmentFormData, setEquipmentFormData] = useState({
    equipment_id: '',
    name: '',
    type: '',
    status: '',
    siteId: site?._id || '',
  });
  const [equipmentList, setEquipmentList] = useState([]);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      console.log('Equipment List Response:', response.data);
      const transformedData = response.data.map(item => ({
        ...item,
        equipment_id: item.equipment_id || item._id,
        name: item.name || 'N/A',
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

  // Fetch equipment options for the dropdown
  const fetchEquipmentOptions = async () => {
    setLoadingOptions(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:8000/api/equipment/options');
      console.log('Equipment Options Response:', response.data);
      if (response.data.length === 0) {
        console.log('API returned empty array, using fallback');
        setError('No equipment options available. Contact the administrator.');
        setEquipmentOptions(fallbackEquipmentOptions);
      } else {
        setEquipmentOptions(response.data);
      }
    } catch (err) {
      console.error('Fetch Equipment Options Error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError('Failed to fetch equipment options. Using fallback options.');
      setEquipmentOptions(fallbackEquipmentOptions);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Update siteId and fetch equipment/options when site changes
  useEffect(() => {
    if (site?._id) {
      setEquipmentFormData((prev) => ({
        ...prev,
        siteId: site._id,
      }));
      fetchEquipment(site._id);
      fetchEquipmentOptions();
    }
  }, [site]);

  // Handle equipment form input changes
  const handleEquipmentInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'equipment_id') {
      const selected = equipmentOptions.find((opt) => opt.equipment_id === value);
      setEquipmentFormData({
        ...equipmentFormData,
        equipment_id: value,
        name: selected ? selected.name : '',
        type: selected ? selected.type : '',
      });
    } else {
      setEquipmentFormData({ ...equipmentFormData, [name]: value });
    }
  };

  // Add equipment to a site
  const addEquipment = async () => {
    setError('');
    setSuccessMessage('');
    try {
      if (!equipmentFormData.equipment_id || !equipmentFormData.name || !equipmentFormData.type || !equipmentFormData.status || !equipmentFormData.siteId) {
        setError('Equipment selection, status, and site ID are required.');
        return;
      }
      if (!isValidObjectId(equipmentFormData.siteId)) {
        setError('Invalid site ID format.');
        return;
      }
      if (!['operational', 'faulty', 'maintenance'].includes(equipmentFormData.status)) {
        setError('Status must be one of: operational, faulty, maintenance.');
        return;
      }
      const response = await axios.post('http://localhost:8000/api/equipment', equipmentFormData);
      setEquipmentList([...equipmentList, response.data]);
      setSuccessMessage('Equipment added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowAddEquipmentModal(false);
      setEquipmentFormData({ equipment_id: '', name: '', type: '', status: '', siteId: site._id });
      fetchEquipment(site._id);
    } catch (err) {
      if (err.response?.status === 400) {
        const message = err.response?.data?.message || 'Invalid input';
        if (message.includes('E11000 duplicate key error') && message.includes('equipment_id')) {
          setError('Equipment ID already exists. Please select a unique equipment.');
        } else if (message.includes('Invalid site ID') || message.includes('Cast to ObjectId failed')) {
          setError('Invalid site ID.');
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
      const response = await axios.put(`http://localhost:8000/api/equipment/${showEditEquipmentModal}`, equipmentFormData);
      setEquipmentList(equipmentList.map((eq) => (eq._id === showEditEquipmentModal ? response.data : eq)));
      setSuccessMessage('Equipment updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowEditEquipmentModal(null);
      setEquipmentFormData({ equipment_id: '', name: '', type: '', status: '', siteId: site._id });
      fetchEquipment(site._id);
    } catch (err) {
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
  const deleteEquipment = async () => {
    setError('');
    setSuccessMessage('');
    try {
      await axios.delete(`http://localhost:8000/api/equipment/${showDeleteEquipmentModal}`);
      setEquipmentList(equipmentList.filter((eq) => eq._id !== showDeleteEquipmentModal));
      setSuccessMessage('Equipment deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowDeleteEquipmentModal(null);
      fetchEquipment(site._id);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Equipment not found.');
      } else {
        setError('Failed to delete equipment: ' + (err.response?.data?.message || err.message));
      }
    }
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
      siteId: eq.siteId,
    });
    setShowEditEquipmentModal(eq._id);
  };

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
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Equipment</label>
            <button
              onClick={() => setShowAddEquipmentModal(true)}
              className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              disabled={equipmentOptions.length === 0}
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
          ) : equipmentList.length > 0 ? (
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
                  {equipmentList.map((eq) => (
                    <tr key={eq._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{eq.equipment_id}</td>
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
        {showAddEquipmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full transform transition-all animate-scale-in">
              <div className="flex items-center mb-4">
                <FiPlus className="h-6 w-6 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Add Equipment</h3>
              </div>
              {loadingOptions ? (
                <div className="flex justify-center items-center p-4">
                  <FiRefreshCw className="animate-spin h-6 w-6 text-indigo-600" />
                  <span className="ml-2 text-sm text-gray-600">Loading equipment options...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
                      <div className="flex">
                        <FiAlertCircle className="h-5 w-5 text-red-400" />
                        <p className="ml-3 text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Equipment</label>
                    <select
                      name="equipment_id"
                      value={equipmentFormData.equipment_id}
                      onChange={handleEquipmentInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select equipment</option>
                      {equipmentOptions.length > 0 ? (
                        equipmentOptions.map((equipment) => (
                          <option key={equipment.equipment_id} value={equipment.equipment_id}>
                            {equipment.name} ({equipment.type})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No equipment options available
                        </option>
                      )}
                    </select>
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
              )}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddEquipmentModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={addEquipment}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loadingOptions}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
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
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100 cursor-not-allowed"
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
                  onClick={deleteEquipment}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSiteDetails;