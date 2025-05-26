
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

// Validate Site ID format (e.g., "SITE001")
const isValidSiteId = (id) => /^SITE\d+$/.test(id);

const CreateInterventionModal = ({ onClose, onSubmit, isScheduling = false, initialData = {} }) => {
  const currentUser = useSelector((state) => state.user?.currentUser);
  const [formData, setFormData] = useState({
    siteId: initialData.siteId || '',
    description: initialData.description || '',
    plannedDate: initialData.plannedDate ? new Date(initialData.plannedDate).toISOString().split('T')[0] : '',
    timeSlotStart: initialData.timeSlot?.start || '',
    timeSlotEnd: initialData.timeSlot?.end || '',
    technician: initialData.technician || '',
    priority: initialData.priority || 'medium',
  });
  const [error, setError] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch technicians from the backend
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error before new request
        const response = await fetch('http://localhost:3000/api/technicians');
        const data = await response.json();

        if (response.ok && data.success) {
          setTechnicians(Array.isArray(data.data) ? data.data : []);
        } else {
          setError(data.message || 'Failed to fetch technicians');
        }
      } catch (err) {
        console.error('Fetch Technicians Error:', err);
        setError('Error fetching technicians');
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = () => {
    if (!formData.siteId || !isValidSiteId(formData.siteId)) {
      setError('Valid Site ID (e.g., SITE001) is required.');
      return;
    }
    if (!formData.description) {
      setError('Description is required.');
      return;
    }
    if (!formData.plannedDate) {
      setError('Planned date is required.');
      return;
    }
    if (!formData.technician) {
      setError('Technician is required.');
      return;
    }
    if (isScheduling && (!formData.timeSlotStart || !formData.timeSlotEnd)) {
      setError('Start and end times are required for scheduling.');
      return;
    }
    if (!currentUser?._id) {
      setError('User not authenticated.');
      return;
    }

    const payload = {
      siteId: formData.siteId,
      description: formData.description,
      plannedDate: new Date(formData.plannedDate).toISOString(),
      timeSlot: isScheduling ? { start: formData.timeSlotStart, end: formData.timeSlotEnd } : undefined,
      technician: formData.technician,
      createdBy: currentUser._id, // Use current user's ID
      priority: formData.priority,
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-xl w-full mx-4 animate-fade-in">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{isScheduling ? 'Schedule Intervention' : 'Create Intervention'}</h3>
        {error && (
          <div className="mb-4 p-2 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm rounded">{error}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm

 font-medium text-gray-700">Site ID</label>
            <input
              name="siteId"
              value={formData.siteId}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., SITE001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              rows="4"
              placeholder="Describe the intervention"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Planned Date</label>
            <input
              name="plannedDate"
              type="date"
              value={formData.plannedDate}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {isScheduling && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  name="timeSlotStart"
                  type="time"
                  value={formData.timeSlotStart}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  name="timeSlotEnd"
                  type="time"
                  value={formData.timeSlotEnd}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Technician</label>
            <select
              name="technician"
              value={formData.technician}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            >
              <option value="">Select a technician</option>
              {technicians.map((tech) => (
                <option key={tech._id} value={tech._id}>
                  {tech.name}
                </option>
              ))}
            </select>
            {loading && <p className="text-sm text-gray-500 mt-1">Loading technicians...</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
          >
            {isScheduling ? 'Schedule' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

CreateInterventionModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isScheduling: PropTypes.bool,
  initialData: PropTypes.object,
};

export default CreateInterventionModal;
