import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
} from 'react-icons/fi';
import { FaWrench } from 'react-icons/fa';
import moment from 'moment-timezone';

// Set axios base URL
axios.defaults.baseURL = 'http://localhost:8000';

// Equipment options
const equipmentOptions = [
  { equipment_id: '60c72b2f9b1e8a3b4c5d6e7f', name: 'Rectifier Unit', type: 'Rectifier' },
  { equipment_id: '60c72b2f9b1e8a3b4c5d6e80', name: 'Battery Bank', type: 'Battery' },
  { equipment_id: '60c72b2f9b1e8a3b4c5d6e81', name: 'Microwave Link', type: 'Backhaul' },
  { equipment_id: '60c72b2f9b1e8a3b4c5d6e82', name: 'Air Conditioner', type: 'Cooling' },
  { equipment_id: '60c72b2f9b1e8a3b4c5d6e83', name: 'Fire Suppression', type: 'Safety' },
  { equipment_id: '68339a71036e9411af7b43cf', name: 'Generator B', type: 'Generator' },
  { equipment_id: '68339a80036e9411af7b43e0', name: 'Generator B', type: 'Generator' },
  { equipment_id: '683756132f05021f04c16432', name: 'Router C', type: 'Router' },
  { equipment_id: '68375ca12f05021f04c165d9', name: 'Antenna A', type: 'Antenna' },
  { equipment_id: '683a50cf41a4fcf25931e85d', name: 'Router C', type: 'Router' },
  { equipment_id: '6845c8d80168c4e00a682c00', name: 'Antenna A', type: 'Antenna' },
];

const NetworkSettings = () => {
  const [maintenances, setMaintenances] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [currentView, setCurrentView] = useState('month'); // month, week, day
  const [currentDate, setCurrentDate] = useState(moment().tz('Europe/Paris'));
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [filteredMaintenances, setFilteredMaintenances] = useState([]);

  const [formData, setFormData] = useState({
    equipmentId: '',
    description: '',
    performedBy: '',
    status: 'pending',
    scheduledDate: moment().tz('Europe/Paris').format('YYYY-MM-DD'),
    scheduledTime: '',
  });

  // Fetch maintenances
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

  // Fetch technicians
  const fetchTechnicians = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/technicians');
      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error('Technician data is invalid');
      }
      setTechnicians(response.data.data);
    } catch (err) {
      console.error('Fetch technicians error:', err.response?.data || err.message);
      setError(`Failed to fetch technicians: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add maintenance
  const addMaintenance = async () => {
    setError('');
    setSuccessMessage('');
    try {
      if (!formData.equipmentId || !formData.description || !formData.performedBy) {
        setError('Equipment, description, and technician are required.');
        return;
      }
      if (!/^[0-9a-fA-F]{24}$/.test(formData.equipmentId)) {
        setError('Invalid Equipment ID format.');
        return;
      }
      if (!/^[0-9a-fA-F]{24}$/.test(formData.performedBy)) {
        setError('Invalid technician ID.');
        return;
      }
      const scheduledDate = moment(formData.scheduledDate, 'YYYY-MM-DD');
      if (!scheduledDate.isValid()) {
        setError('Invalid scheduled date.');
        return;
      }
      let scheduledTime = '';
      if (formData.scheduledTime) {
        const time = moment(formData.scheduledTime, 'HH:mm');
        if (!time.isValid()) {
          setError('Invalid time format (HH:mm).');
          return;
        }
        scheduledTime = time.format('HH:mm:ss');
      }
      const payload = {
        equipmentId: formData.equipmentId,
        description: formData.description,
        performedBy: formData.performedBy,
        status: formData.status,
        scheduledDate: scheduledDate.format('YYYY-MM-DD'),
        scheduledTime: scheduledTime || undefined,
      };
      const response = await axios.post('/api/maintenance', payload);
      setMaintenances([...maintenances, response.data.data]);
      setSuccessMessage('Maintenance scheduled successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowAddModal(false);
      resetForm();
      fetchMaintenances();
    } catch (err) {
      console.error('Add maintenance error:', err.response?.data || err.message);
      setError(`Failed to add maintenance: ${err.response?.data?.message || err.message}`);
    }
  };

  // Update maintenance
  const updateMaintenance = async () => {
    setError('');
    setSuccessMessage('');
    if (!formData.description && !formData.performedBy && !formData.status && !formData.scheduledDate) {
      setError('At least one field is required for update.');
      return;
    }
    try {
      const updatedData = {};
      if (formData.description) updatedData.description = formData.description;
      if (formData.performedBy) {
        if (!/^[0-9a-fA-F]{24}$/.test(formData.performedBy)) {
          setError('Invalid technician ID.');
          return;
        }
        updatedData.performedBy = formData.performedBy;
      }
      if (formData.status) updatedData.status = formData.status;
      if (formData.scheduledDate) {
        const scheduledDate = moment(formData.scheduledDate, 'YYYY-MM-DD');
        if (!scheduledDate.isValid()) {
          setError('Invalid scheduled date.');
          return;
        }
        updatedData.scheduledDate = scheduledDate.format('YYYY-MM-DD');
        if (formData.scheduledTime) {
          const time = moment(formData.scheduledTime, 'HH:mm');
          if (!time.isValid()) {
            setError('Invalid time format.');
            return;
          }
          updatedData.scheduledTime = time.format('HH:mm:ss');
        } else {
          updatedData.scheduledTime = '';
        }
      }
      const response = await axios.put(`/api/maintenance/${showEditModal}`, updatedData);
      setMaintenances(maintenances.map((m) => (m._id === showEditModal ? response.data.data : m)));
      setSuccessMessage('Maintenance updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowEditModal(null);
      resetForm();
      fetchMaintenances();
    } catch (err) {
      console.error('Update maintenance error:', err.response?.data || err.message);
      setError(`Failed to update maintenance: ${err.response?.data?.message || err.message}`);
    }
  };

  // Delete maintenance
  const deleteMaintenance = async () => {
    setError('');
    setSuccessMessage('');
    try {
      await axios.delete(`/api/maintenance/${showDeleteModal}`);
      setMaintenances(maintenances.filter((m) => m._id !== showDeleteModal));
      setSuccessMessage('Maintenance deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowDeleteModal(null);
    } catch (err) {
      console.error('Delete maintenance error:', err.response?.data || err.message);
      setError(`Failed to delete maintenance: ${err.response?.data?.message || err.message}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      equipmentId: '',
      description: '',
      performedBy: '',
      status: 'pending',
      scheduledDate: moment().tz('Europe/Paris').format('YYYY-MM-DD'),
      scheduledTime: '',
    });
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Open edit modal
  const openEditModal = (maintenance) => {
    const dateField = maintenance.performedAt || maintenance.scheduledDate;
    const date = moment(dateField).tz('Europe/Paris');
    setFormData({
      equipmentId: maintenance.equipmentId?._id || maintenance.equipmentId || '',
      description: maintenance.description || '',
      performedBy: maintenance.performedBy?._id || maintenance.performedBy || '',
      status: maintenance.status || 'pending',
      scheduledDate: date.isValid() ? date.format('YYYY-MM-DD') : moment().tz('Europe/Paris').format('YYYY-MM-DD'),
      scheduledTime: maintenance.scheduledTime
        ? moment(maintenance.scheduledTime, 'HH:mm:ss').format('HH:mm')
        : '',
    });
    setShowEditModal(maintenance._id);
  };

  // Open details modal
  const openDetailsModal = (maintenance) => {
    setShowDetailsModal(maintenance);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(null);
  };

  // Navigation handlers
  const prevPeriod = () => {
    setCurrentDate(
      currentView === 'month'
        ? currentDate.clone().subtract(1, 'month')
        : currentView === 'week'
        ? currentDate.clone().subtract(1, 'week')
        : currentDate.clone().subtract(1, 'day')
    );
  };

  const nextPeriod = () => {
    setCurrentDate(
      currentView === 'month'
        ? currentDate.clone().add(1, 'month')
        : currentView === 'week'
        ? currentDate.clone().add(1, 'week')
        : currentDate.clone().add(1, 'day')
    );
  };

  const goToToday = () => {
    setCurrentDate(moment().tz('Europe/Paris'));
  };

  // Client-side filtering
  useEffect(() => {
    let filtered = [...maintenances];
    if (filterStatus !== 'all') {
      filtered = filtered.filter((m) => m.status === filterStatus);
    }
    if (filterEquipment) {
      filtered = filtered.filter((m) => (m.equipmentId?._id || m.equipmentId) === filterEquipment);
    }
    setFilteredMaintenances(filtered);
  }, [maintenances, filterStatus, filterEquipment]);

  // Fetch data on mount
  useEffect(() => {
    fetchMaintenances();
    fetchTechnicians();
  }, []);

  // Generate month grid
  const generateMonthGrid = () => {
    const startOfMonth = currentDate.clone().startOf('month');
    const endOfMonth = currentDate.clone().endOf('month');
    const startOfGrid = startOfMonth.clone().startOf('week');
    const endOfGrid = endOfMonth.clone().endOf('week');
    const days = [];
    let current = startOfGrid.clone();

    while (current.isBefore(endOfGrid)) {
      days.push(current.clone());
      current.add(1, 'day');
    }

    return days;
  };

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    return filteredMaintenances.filter((m) =>
      moment(m.scheduledDate).tz('Europe/Paris').isSame(date, 'day')
    );
  };

  // Determine dominant status for a day's tasks
  const getDominantStatus = (tasks) => {
    if (!tasks.length) return null;
    const statusPriority = { completed: 3, 'in progress': 2, pending: 1 };
    let maxPriority = 0;
    let dominantStatus = 'pending';
    tasks.forEach((task) => {
      const priority = statusPriority[task.status] || 1;
      if (priority > maxPriority) {
        maxPriority = priority;
        dominantStatus = task.status;
      }
    });
    return dominantStatus;
  };

  // Month view
  const renderMonthView = () => {
    const days = generateMonthGrid();
    const today = moment().tz('Europe/Paris');

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="bg-gray-50 text-center text-sm font-medium text-gray-700 py-2">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const tasks = getTasksForDate(day);
          const isCurrentMonth = day.month() === currentDate.month();
          const isToday = day.isSame(today, 'day');
          const dominantStatus = getDominantStatus(tasks);
          const statusColor = dominantStatus
            ? dominantStatus === 'completed'
              ? 'bg-green-200'
              : dominantStatus === 'in progress'
              ? 'bg-orange-200'
              : 'bg-red-200'
            : 'bg-white';

          return (
            <div
              key={day.format('YYYY-MM-DD')}
              className={`group relative p-2 min-h-[100px] text-sm cursor-pointer hover:shadow-sm ${statusColor} ${
                isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              } ${isToday ? 'border-2 border-indigo-500' : ''}`}
              onClick={() => {
                setCurrentDate(day);
                setCurrentView('day');
              }}
            >
              <span className={`block text-right ${isToday ? 'font-bold' : ''}`}>{day.date()}</span>
              {tasks.length > 0 && (
                <>
                  <span className="absolute bottom-2 right-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-white">
                    {tasks.length}
                  </span>
                  <div className="absolute z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded-md p-2 top-full left-0 w-64 shadow-lg">
                    {tasks.slice(0, 3).map((task) => (
                      <div key={task._id} className="mb-1">
                        <p className="font-medium truncate">
                          {task.description} ({task.status})
                        </p>
                        <p className="text-gray-300">
                          {task.scheduledTime ? moment(task.scheduledTime, 'HH:mm:ss').format('h:mm A') : 'All Day'}
                        </p>
                      </div>
                    ))}
                    {tasks.length > 3 && <p>+{tasks.length - 3} more</p>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Week view
  const renderWeekView = () => {
    const startOfWeek = currentDate.clone().startOf('week');
    const days = Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'day'));
    const today = moment().tz('Europe/Paris');

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {days.map((day) => (
          <div key={day.format('YYYY-MM-DD')} className="bg-gray-50 text-center text-sm font-medium text-gray-700 py-2">
            {day.format('ddd, D MMM')}
          </div>
        ))}
        {days.map((day) => {
          const tasks = getTasksForDate(day);
          const isToday = day.isSame(today, 'day');
          return (
            <div
              key={day.format('YYYY-MM-DD')}
              className={`bg-white p-2 min-h-[150px] text-sm ${isToday ? 'border-2 border-indigo-500' : ''}`}
            >
              {tasks.length > 0 ? (
                tasks
                  .sort((a, b) =>
                    moment(a.scheduledTime || '00:00:00', 'HH:mm:ss').diff(
                      moment(b.scheduledTime || '00:00:00', 'HH:mm:ss')
                    )
                  )
                  .map((task) => (
                    <div key={task._id} className="mb-2 p-2 bg-gray-50 rounded-md hover:shadow-sm">
                      <p className="text-xs font-medium flex items-center">
                        <FiClock className="h-3 w-3 mr-1 text-gray-500" />
                        {task.scheduledTime ? moment(task.scheduledTime, 'HH:mm:ss').format('h:mm A') : 'All Day'}
                      </p>
                      <p className="text-xs truncate">{task.description}</p>
                      <p className="text-xs text-gray-500">
                        {task.equipmentId?.name || equipmentOptions.find((eq) => eq.equipment_id === task.equipmentId)?.name || 'Unknown'}
                      </p>
                      <div className="flex space-x-1 mt-1">
                        <button
                          onClick={() => openDetailsModal(task)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(task)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(task._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-xs text-gray-400">No tasks</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Day view
  const renderDayView = () => {
    const tasks = getTasksForDate(currentDate);
    const isToday = currentDate.isSame(moment().tz('Europe/Paris'), 'day');

    return (
      <div className={`bg-white p-4 rounded-md ${isToday ? 'border-2 border-indigo-500' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {currentDate.format('dddd, MMMM D, YYYY')}
        </h3>
        {tasks.length > 0 ? (
          tasks
            .sort((a, b) =>
              moment(a.scheduledTime || '00:00:00', 'HH:mm:ss').diff(
                moment(b.scheduledTime || '00:00:00', 'HH:mm:ss')
              )
            )
            .map((task) => (
              <div key={task._id} className="mb-4 p-3 bg-gray-50 rounded-md hover:shadow-sm">
                <p className="text-sm font-medium flex items-center">
                  <FiClock className="h-4 w-4 mr-1 text-gray-500" />
                  {task.scheduledTime ? moment(task.scheduledTime, 'HH:mm:ss').format('h:mm A') : 'All Day'}
                </p>
                <p className="text-sm">{task.description}</p>
                <p className="text-sm text-gray-500">
                  Equipment: {task.equipmentId?.name || equipmentOptions.find((eq) => eq.equipment_id === task.equipmentId)?.name || 'Unknown'}
                </p>
                <p className="text-sm text-gray-500">
                  Technician: {task.performedBy?.name || technicians.find((tech) => tech._id === task.performedBy)?.name || 'N/A'}
                </p>
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                    task.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : task.status === 'in progress'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {task.status}
                </span>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => openDetailsModal(task)}
                    className="text-blue-600 hover:text-blue-900"
                    title="View"
                  >
                    <FiEye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(task)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Edit"
                  >
                    <FiEdit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(task._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
        ) : (
          <p className="text-sm text-gray-500">No maintenance tasks scheduled for this day.</p>
        )}
      </div>
    );
  };

  // Clear filters
  const clearFilters = () => {
    setFilterStatus('all');
    setFilterEquipment('');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      <header className="bg-white shadow-sm rounded-lg mb-6">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <FaWrench className="h-6 w-6 text-indigo-600 mr-2" />
              Maintenance Calendar
            </h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <FiPlus className="h-5 w-5 mr-2" />
              Schedule Maintenance
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-md flex items-center">
            <FiCheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <p className="text-sm text-gray-700">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-center">
            <FiAlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Filters and Navigation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentView('month')}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentView === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setCurrentView('week')}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentView === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setCurrentView('day')}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentView === 'day' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Day
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={prevPeriod}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300"
                title="Previous"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {currentView === 'month'
                  ? currentDate.format('MMMM YYYY')
                  : currentView === 'week'
                  ? `${currentDate.clone().startOf('week').format('MMM D')} - ${currentDate
                      .clone()
                      .endOf('week')
                      .format('MMM D, YYYY')}`
                  : currentDate.format('MMMM D, YYYY')}
              </span>
              <button
                onClick={nextPeriod}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300"
                title="Next"
              >
                <FiChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Today
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="relative">
                <select
                  id="filter-status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FiFilter className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="filter-equipment" className="block text-sm font-medium text-gray-700 mb-1">
                Equipment
              </label>
              <select
                id="filter-equipment"
                value={filterEquipment}
                onChange={(e) => setFilterEquipment(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All</option>
                {equipmentOptions.map((eq) => (
                  <option key={eq.equipment_id} value={eq.equipment_id}>
                    {eq.name} ({eq.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 w-full sm:w-auto"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <FiClock className="animate-spin h-8 w-8 text-indigo-600" />
              <span className="ml-3 text-gray-600 text-sm">Loading calendar...</span>
            </div>
          ) : currentView === 'month' ? (
            renderMonthView()
          ) : currentView === 'week' ? (
            renderWeekView()
          ) : (
            renderDayView()
          )}
        </div>

        {/* Modals */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <div className="flex items-center mb-4">
                <FiPlus className="h-6 w-6 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Schedule Maintenance</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="add-equipment" className="block text-sm font-medium text-gray-700">
                    Equipment
                  </label>
                  <select
                    id="add-equipment"
                    name="equipmentId"
                    value={formData.equipmentId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select equipment</option>
                    {equipmentOptions.map((equipment) => (
                      <option key={equipment.equipment_id} value={equipment.equipment_id}>
                        {equipment.name} ({equipment.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="add-description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="add-description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter maintenance description"
                    rows={3}
                  />
                </div>
                <div>
                  <label htmlFor="add-technician" className="block text-sm font-medium text-gray-700">
                    Technician
                  </label>
                  <select
                    id="add-technician"
                    name="performedBy"
                    value={formData.performedBy}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a technician</option>
                    {technicians.map((tech) => (
                      <option key={tech._id} value={tech._id}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="add-date" className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      id="add-date"
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="add-time" className="block text-sm font-medium text-gray-700">
                      Time
                    </label>
                    <input
                      id="add-time"
                      type="time"
                      name="scheduledTime"
                      value={formData.scheduledTime}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      step={60}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="add-status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="add-status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={addMaintenance}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <div className="flex items-center mb-4">
                <FiEdit className="h-6 w-6 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Edit Maintenance</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-equipment" className="block text-sm font-medium text-gray-700">
                    Equipment
                  </label>
                  <select
                    id="edit-equipment"
                    name="equipmentId"
                    value={formData.equipmentId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-gray-100 cursor-not-allowed"
                    disabled
                  >
                    <option value="">Select equipment</option>
                    {equipmentOptions.map((equipment) => (
                      <option key={equipment.equipment_id} value={equipment.equipment_id}>
                        {equipment.name} ({equipment.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter maintenance description"
                    rows={3}
                  />
                </div>
                <div>
                  <label htmlFor="edit-technician" className="block text-sm font-medium text-gray-700">
                    Technician
                  </label>
                  <select
                    id="edit-technician"
                    name="performedBy"
                    value={formData.performedBy}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a technician</option>
                    {technicians.map((tech) => (
                      <option key={tech._id} value={tech._id}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      id="edit-date"
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-time" className="block text-sm font-medium text-gray-700">
                      Time
                    </label>
                    <input
                      id="edit-time"
                      type="time"
                      name="scheduledTime"
                      value={formData.scheduledTime}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      step={60}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={updateMaintenance}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {showDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <div className="flex items-center mb-4">
                <FiEye className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Maintenance Details</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Equipment</label>
                  <p className="mt-1 text-sm text-gray-600">
                    {showDetailsModal.equipmentId?.name ||
                      equipmentOptions.find((eq) => eq.equipment_id === showDetailsModal.equipmentId)?.name ||
                      'Unknown'}{' '}
                    ({showDetailsModal.equipmentId?.serialNumber || 'N/A'})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-600">{showDetailsModal.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Technician</label>
                  <p className="mt-1 text-sm text-gray-600">
                    {showDetailsModal.performedBy?.name ||
                      technicians.find((tech) => tech._id === showDetailsModal.performedBy)?.name ||
                      'N/A'}{' '}
                    ({showDetailsModal.performedBy?.email || 'N/A'})
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
                  onClick={closeDetailsModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
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
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteMaintenance}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
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