import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import moment from 'moment';
import 'moment-timezone';
import 'leaflet/dist/leaflet.css';
import {
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiAlertCircle,
  FiServer,
  FiWifi,
  FiDatabase,
  FiCpu,
  FiHardDrive,
  FiX,
  FiTool,
} from 'react-icons/fi';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Mock data for sites
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

// Shared utility functions
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const formatTimeSlot = (timeSlot) => {
  return timeSlot ? `${timeSlot.start} - ${timeSlot.end}` : 'N/A';
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in-progress':
    case 'in progress':
      return 'bg-blue-100 text-blue-800';
    case 'planned':
    case 'pending':
      return 'bg-purple-100 text-purple-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getDeviceIcon = (type) => {
  const iconProps = { size: 20, className: 'mr-2 text-primary' };
  switch (type?.toLowerCase()) {
    case 'router':
      return <FiServer {...iconProps} />;
    case 'switch':
      return <FiWifi {...iconProps} />;
    case 'server':
      return <FiDatabase {...iconProps} />;
    case 'storage':
      return <FiHardDrive {...iconProps} />;
    default:
      return <FiCpu {...iconProps} />;
  }
};

const isOverdue = (item, dateField, status) => {
  if (['completed', 'cancelled'].includes(status?.toLowerCase())) return false;
  const itemDate = moment(item[dateField]).tz('Europe/Paris');
  const today = moment().tz('Europe/Paris').startOf('day');
  return itemDate.isBefore(today);
};

const NetworkHealthDashboard = () => {
  const currentUser = useSelector((state) => state.user?.currentUser);
  const [interventions, setInterventions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState({ interventions: true, tasks: true, sites: true });
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch data
  useEffect(() => {
    const fetchInterventions = async () => {
      if (!currentUser?._id) {
        setError('User not logged in');
        setLoading((prev) => ({ ...prev, interventions: false }));
        return;
      }
      try {
        const response = await axios.get(`/api/interventions/tech?technician=${currentUser._id}`);
        setInterventions(response.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch interventions');
      } finally {
        setLoading((prev) => ({ ...prev, interventions: false }));
      }
    };

    const fetchTasks = async () => {
      if (!currentUser?._id) {
        setError('User authentication required');
        setLoading((prev) => ({ ...prev, tasks: false }));
        return;
      }
      try {
        const response = await axios.get(`/api/maintenance/technician/${currentUser._id}`, {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        setTasks(response.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tasks');
      } finally {
        setLoading((prev) => ({ ...prev, tasks: false }));
      }
    };

    const fetchSites = async () => {
      try {
        // Using mock data for sites
        setTimeout(() => {
          setSites(mockSites);
          setLoading((prev) => ({ ...prev, sites: false }));
        }, 500);
      } catch (err) {
        setError('Failed to fetch site records');
        setLoading((prev) => ({ ...prev, sites: false }));
      }
    };

    fetchInterventions();
    fetchTasks();
    fetchSites();
  }, [currentUser]);

  // Handle details click
  const handleDetailsClick = async (item, type) => {
    try {
      setLoading((prev) => ({ ...prev, [type]: true }));
      const endpoint = type === 'intervention' ? `/api/interventions/${item._id}` : `/api/maintenance/${item._id}`;
      const headers = type === 'task' ? { Authorization: `Bearer ${currentUser.token}` } : {};
      const response = await axios.get(endpoint, { headers });
      setSelectedItem({ ...response.data.data, type });
      setShowDetailsModal(type);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to fetch ${type} details`);
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const closeModal = () => {
    setShowDetailsModal(null);
    setSelectedItem(null);
    setError(null);
  };

  // Render loading state
  if (loading.interventions || loading.tasks || loading.sites) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="bg-white shadow rounded-lg mb-6">
        <div className="max-w-7xl mx-auto py-4 px-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FiTool className="text-primary" size={28} />
            Network Health Dashboard
          </h1>
          <p className="text-gray-600 mt-1">View-only mode: Monitor network interventions, maintenance tasks, and site statuses.</p>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error shadow-lg max-w-2xl mx-auto mb-6">
          <FiAlertCircle size={24} />
          <div>
            <h3 className="font-bold text-white">Error</h3>
            <p className="text-sm text-white">{error}</p>
          </div>
        </div>
      )}

      {/* Network Map */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Network Map - Tunisia</h2>
          <MapContainer center={[36.80136332483977, 10.181409569362337]} zoom={15} style={{ height: '400px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {sites.map((site) => (
              site.location && (
                <Marker key={site._id} position={[site.location.lat, site.location.lng]}>
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
                        <label className="block text-sm font-medium text-gray-700">Technology</label>
                        <p className="text-sm text-gray-600">{site.technology || 'N/A'}</p>
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
                        <label className="block text-sm font-medium text-gray-700">Alarms</label>
                        <p className="text-sm text-gray-600">{site.alarms?.length > 0 ? site.alarms.join(', ') : 'None'}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <FiCheckCircle size={28} className="text-green-500" />
            <div>
              <h3 className="text-gray-600">Completed</h3>
              <p className="text-2xl font-bold text-green-500">
                {interventions.filter((i) => i.status.toLowerCase() === 'completed').length +
                  tasks.filter((t) => t.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">
                {interventions.length + tasks.length > 0
                  ? `${Math.round(
                      ((interventions.filter((i) => i.status.toLowerCase() === 'completed').length +
                        tasks.filter((t) => t.status === 'completed').length) /
                        (interventions.length + tasks.length)) *
                        100
                    )}% of total`
                  : '0% of total'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <FiClock size={28} className="text-blue-500" />
            <div>
              <h3 className="text-gray-600">In Progress</h3>
              <p className="text-2xl font-bold text-blue-500">
                {interventions.filter((i) => i.status.toLowerCase() === 'in-progress').length +
                  tasks.filter((t) => t.status === 'in progress').length}
              </p>
              <p className="text-sm text-gray-600">
                {interventions.filter((i) => i.status.toLowerCase() === 'in-progress' && isOverdue(i, 'plannedDate', i.status)).length +
                  tasks.filter((t) => t.status === 'in progress' && isOverdue(t, 'scheduledDate', t.status)).length}{' '}
                overdue
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <FiCalendar size={28} className="text-purple-500" />
            <div>
              <h3 className="text-gray-600">Pending/Planned</h3>
              <p className="text-2xl font-bold text-purple-500">
                {interventions.filter((i) => i.status.toLowerCase() === 'planned').length +
                  tasks.filter((t) => t.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">
                {interventions.filter((i) => i.status.toLowerCase() === 'planned' && isOverdue(i, 'plannedDate', i.status)).length +
                  tasks.filter((t) => t.status === 'pending' && isOverdue(t, 'scheduledDate', t.status)).length}{' '}
                overdue
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interventions and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interventions */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Interventions</h2>
            {interventions.length === 0 ? (
              <p className="text-gray-600">No interventions assigned.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {interventions.map((intervention) => (
                      <tr
                        key={intervention._id}
                        className={`hover:bg-gray-50 ${isOverdue(intervention, 'plannedDate', intervention.status) ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{intervention.siteId}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{intervention.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              isOverdue(intervention, 'plannedDate', intervention.status) ? 'overdue' : intervention.status
                            )}`}
                          >
                            {isOverdue(intervention, 'plannedDate', intervention.status) ? 'Overdue' : intervention.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDetailsClick(intervention, 'intervention')}
                            className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance Tasks */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Maintenance Tasks</h2>
            {tasks.length === 0 ? (
              <p className="text-gray-600">No maintenance tasks assigned.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr
                        key={task._id}
                        className={`hover:bg-gray-50 ${isOverdue(task, 'scheduledDate', task.status) ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getDeviceIcon(task.equipmentId?.type)}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{task.equipmentId?.name || 'Unspecified'}</div>
                              {task.equipmentId?.serialNumber && (
                                <div className="text-xs text-gray-600">{task.equipmentId.serialNumber}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{task.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              isOverdue(task, 'scheduledDate', task.status) ? 'overdue' : task.status
                            )}`}
                          >
                            {isOverdue(task, 'scheduledDate', task.status) ? 'Overdue' : task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDetailsClick(task, 'task')}
                            className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" aria-modal="true" role="dialog">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">{showDetailsModal.charAt(0).toUpperCase() + showDetailsModal.slice(1)} Details</h2>
              <button onClick={closeModal} className="btn btn-sm btn-circle btn-ghost">
                <FiX size={20} />
              </button>
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>
            )}
            <div className="space-y-4">
              {selectedItem.type === 'intervention' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Site ID</label>
                    <p className="text-sm text-gray-600">{selectedItem.siteId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-600">{selectedItem.description || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Planned Date</label>
                    <p className="text-sm text-gray-600">{formatDate(selectedItem.plannedDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time Slot</label>
                    <p className="text-sm text-gray-600">{formatTimeSlot(selectedItem.timeSlot)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(selectedItem.priority)}`}>
                      {selectedItem.priority || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        isOverdue(selectedItem, 'plannedDate', selectedItem.status) ? 'overdue' : selectedItem.status
                      )}`}
                    >
                      {isOverdue(selectedItem, 'plannedDate', selectedItem.status) ? 'Overdue' : selectedItem.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created By</label>
                    <p className="text-sm text-gray-600">{selectedItem.createdBy?.name || 'N/A'}</p>
                  </div>
                  {selectedItem.status.toLowerCase() === 'completed' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Resolution Notes</label>
                        <p className="text-sm text-gray-600">{selectedItem.resolutionNotes || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Validated By</label>
                        <p className="text-sm text-gray-600">{selectedItem.validatedBy || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-gray-700">Equipment</label>
                    {getDeviceIcon(selectedItem.equipmentId?.type)}
                    <p className="text-sm text-gray-600">{selectedItem.equipmentId?.name || 'Unspecified'}</p>
                  </div>
                  {selectedItem.equipmentId?.serialNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                      <p className="text-sm text-gray-600">{selectedItem.equipmentId.serialNumber}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-600">{selectedItem.description || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        isOverdue(selectedItem, 'scheduledDate', selectedItem.status) ? 'overdue' : selectedItem.status
                      )}`}
                    >
                      {isOverdue(selectedItem, 'scheduledDate', selectedItem.status) ? 'Overdue' : selectedItem.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                    <p className="text-sm text-gray-600">
                      {moment(selectedItem.scheduledDate).tz('Europe/Paris').format('MMM D, YYYY')}
                    </p>
                  </div>
                  {selectedItem.performedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Performed At</label>
                      <p className="text-sm text-gray-600">
                        {moment(selectedItem.performedAt).tz('Europe/Paris').format('MMM D, YYYY h:mm A')}
                      </p>
                    </div>
                  )}
                  {selectedItem.resolutionNotes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Resolution Notes</label>
                      <p className="text-sm text-gray-600">{selectedItem.resolutionNotes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={closeModal} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkHealthDashboard;