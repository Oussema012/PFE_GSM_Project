import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import {
  FiServer,
  FiWifi,
  FiDatabase,
  FiCpu,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiTool,
  FiHardDrive,
  FiChevronRight,
  FiAlertTriangle,
  FiX,
  FiCheck
} from 'react-icons/fi';
import moment from 'moment';
import 'moment-timezone';

const LiveTopologyViewer = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setModalTask] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const currentUser = useSelector((state) => state.user?.currentUser);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentUser?._id) {
        setError('User authentication required');
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get(`/api/maintenance/technician/${currentUser._id}`, {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        
        if (response.data?.success) {
          setTasks(response.data.data || []);
        } else {
          setError(response.data?.message || 'No tasks available');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tasks');
        console.error('Fetch tasks error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [currentUser]);

  const fetchTaskDetails = async (taskId) => {
    setModalLoading(true);
    setModalError(null);
    try {
      const response = await axios.get(`/api/maintenance/${taskId}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      if (response.data?.success) {
        setModalTask(response.data.data);
      } else {
        setModalError(response.data?.message || 'Failed to load task details');
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to load task details');
      console.error('Fetch task details error:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const openResolveModal = (task) => {
    setResolveModal(task);
    setResolutionNotes('');
  };

  const closeResolveModal = () => {
    setResolveModal(null);
    setResolutionNotes('');
  };

  const resolveTask = async (taskId) => {
    try {
      const response = await axios.put(
        `/api/maintenance/resolve/${taskId}`, 
        { resolutionNotes }, 
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      if (response.data?.success) {
        setTasks(tasks.map(task => 
          task._id === taskId 
            ? { ...task, status: 'completed', performedAt: new Date(), resolutionNotes } 
            : task
        ));
        closeResolveModal();
      } else {
        setError(response.data?.message || 'Failed to resolve task');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve task');
      console.error('Resolve task error:', err);
    }
  };

  const closeModal = () => {
    setModalTask(null);
    setModalError(null);
  };

  const getDeviceIcon = (type) => {
    const iconProps = { size: 20, className: 'mr-3' };
    switch (type?.toLowerCase()) {
      case 'router': return <FiServer {...iconProps} />;
      case 'switch': return <FiWifi {...iconProps} />;
      case 'server': return <FiDatabase {...iconProps} />;
      case 'storage': return <FiHardDrive {...iconProps} />;
      default: return <FiCpu {...iconProps} />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClass = 'badge gap-2 font-medium capitalize';
    switch (status?.toLowerCase()) {
      case 'completed': 
        return `${baseClass} badge-success text-success-content`;
      case 'in progress': 
        return `${baseClass} badge-warning text-warning-content`;
      case 'pending': 
        return `${baseClass} badge-error text-error-content`;
      case 'overdue':
        return `${baseClass} bg-error/20 text-error border-error/30`;
      default: 
        return `${baseClass} badge-info text-info-content`;
    }
  };

  const isTaskOverdue = (task) => {
    if (task.status.toLowerCase() === 'completed') return false;
    const scheduledDate = moment(task.scheduledDate).tz('Europe/Paris');
    const today = moment().tz('Europe/Paris');
    return scheduledDate.isBefore(today, 'day');
  };

  const canResolveTask = (task) => {
    return ['pending', 'in progress'].includes(task.status.toLowerCase()) && !isTaskOverdue(task);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-gray-600 animate-pulse">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg max-w-2xl mx-auto animate-fade-in">
        <FiAlertCircle size={24} />
        <div>
          <h3 className="font-bold text-white">Error loading tasks</h3>
          <div className="text-xs text-white">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-box shadow-sm max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <FiTool size={28} />
            </div>
            <span className="text-gray-800">My Maintenance Tasks</span>
          </h2>
          <p className="text-gray-600 mt-1">Overview of your assigned maintenance activities</p>
        </div>
        <div className="badge badge-primary badge-lg px-4 py-3 text-lg">
          {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'} Assigned
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="alert alert-info shadow-lg max-w-2xl mx-auto">
          <FiAlertCircle size={24} />
          <div>
            <h3 className="font-bold text-white">No tasks assigned</h3>
            <div className="text-xs text-white">You currently have no maintenance tasks assigned</div>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-base font-semibold text-gray-800 pl-6">Equipment</th>
                  <th className="text-base font-semibold text-gray-800">Description</th>
                  <th className="text-base font-semibold text-gray-800">Status</th>
                  <th className="text-base font-semibold text-gray-800">Scheduled</th>
                  <th className="text-base font-semibold text-gray-800 pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr 
                    key={task._id} 
                    className={`hover:bg-gray-50 transition-colors ${isTaskOverdue(task) ? 'bg-red-50' : ''}`}
                  >
                    <td className="pl-6 py-4">
                      <div className="flex items-center">
                        <div className="text-primary">
                          {getDeviceIcon(task.equipmentId?.type)}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2 text-gray-800">
                            {task.equipmentId?.name || 'Unspecified'}
                            {isTaskOverdue(task) && (
                              <span className="tooltip" data-tip="Overdue">
                                <FiAlertTriangle className="text-red-500" size={16} />
                              </span>
                            )}
                          </div>
                          {task.equipmentId?.serialNumber && (
                            <div className="text-xs text-gray-600 mt-1">{task.equipmentId.serialNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs py-4">
                      <div className="line-clamp-2 text-gray-800">{task.description}</div>
                    </td>
                    <td className="py-4">
                      <div className={getStatusBadge(isTaskOverdue(task) ? 'overdue' : task.status)}>
                        {isTaskOverdue(task) ? 'Overdue' : task.status}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <FiCalendar size={16} className="text-gray-600" />
                        <span className="font-medium text-gray-800">
                          {moment(task.scheduledDate).tz('Europe/Paris').format('MMM D, YYYY')}
                        </span>
                        {isTaskOverdue(task) && (
                          <span className="text-red-500 text-xs ml-2">(Overdue)</span>
                        )}
                      </div>
                    </td>
                    <td className="pr-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-sm btn-ghost text-primary hover:text-primary/80 transition-all group"
                          onClick={() => fetchTaskDetails(task._id)}
                        >
                          Details
                          <FiChevronRight 
                            size={18} 
                            className="ml-1 group-hover:translate-x-1 transition-transform" 
                          />
                        </button>
                        {canResolveTask(task) && (
                          <button 
                            className="btn btn-sm btn-success text-white hover:bg-success/80 transition-all"
                            onClick={() => openResolveModal(task)}
                          >
                            <FiCheck size={18} className="mr-1" />
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal for task details */}
          {selectedTask && (
            <div className="modal modal-open">
              <div className="modal-box bg-white max-w-lg">
                {modalLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </div>
                ) : modalError ? (
                  <div className="alert alert-error shadow-lg">
                    <FiAlertCircle size={24} />
                    <span className="text-white">{modalError}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold text-gray-800">Maintenance Task Details</h3>
                      <button className="btn btn-sm btn-circle btn-ghost" onClick={closeModal}>
                        <FiX size={20} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">Equipment:</span>
                        <div className="text-primary">{getDeviceIcon(selectedTask.equipmentId?.type)}</div>
                        <span className="text-gray-800">{selectedTask.equipmentId?.name || 'Unspecified'}</span>
                      </div>
                      {selectedTask.equipmentId?.serialNumber && (
                        <div>
                          <span className="font-semibold text-gray-800">Serial Number:</span>
                          <span className="text-gray-600 ml-2">{selectedTask.equipmentId.serialNumber}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-gray-800">Description:</span>
                        <p className="text-gray-800 mt-1">{selectedTask.description}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">Status:</span>
                        <span className={getStatusBadge(isTaskOverdue(selectedTask) ? 'overdue' : selectedTask.status)}>
                          {isTaskOverdue(selectedTask) ? 'Overdue' : selectedTask.status}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">Scheduled Date:</span>
                        <span className="text-gray-800 ml-2">
                          {moment(selectedTask.scheduledDate).tz('Europe/Paris').format('MMM D, YYYY')}
                        </span>
                      </div>
                      {selectedTask.scheduledTime && (
                        <div>
                          <span className="font-semibold text-gray-800">Scheduled Time:</span>
                          <span className="text-gray-800 ml-2">
                            {moment(selectedTask.scheduledTime, 'HH:mm:ss').format('h:mm A')}
                          </span>
                        </div>
                      )}
                      {selectedTask.performedAt && (
                        <div>
                          <span className="font-semibold text-gray-800">Performed At:</span>
                          <span className="text-gray-800 ml-2">
                            {moment(selectedTask.performedAt).tz('Europe/Paris').format('MMM D, YYYY h:mm A')}
                          </span>
                        </div>
                      )}
                      {selectedTask.resolutionNotes && (
                        <div>
                          <span className="font-semibold text-gray-800">Resolution Notes:</span>
                          <span className="text-gray-800 ml-2">{selectedTask.resolutionNotes}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-gray-800">Technician:</span>
                        <span className="text-gray-800 ml-2">{selectedTask.performedBy?.name || 'Unknown'}</span>
                      </div>
                      {selectedTask.performedBy?.email && (
                        <div>
                          <span className="font-semibold text-gray-800">Technician Email:</span>
                          <span className="text-gray-800 ml-2">{selectedTask.performedBy.email}</span>
                        </div>
                      )}
                    </div>
                    <div className="modal-action mt-6">
                      <button className="btn btn-primary" onClick={closeModal}>
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Modal for resolving task */}
          {resolveModal && (
            <div className="modal modal-open">
              <div className="modal-box bg-white max-w-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-800">Resolve Maintenance Task</h3>
                  <button className="btn btn-sm btn-circle btn-ghost" onClick={closeResolveModal}>
                    <FiX size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-gray-800">Technician:</label>
                    <input 
                      type="text" 
                      value={currentUser?.name || 'Unknown'} 
                      className="input input-bordered w-full mt-1 bg-gray-100" 
                      readOnly 
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-800">Resolution Notes:</label>
                    <textarea
                      className="textarea textarea-bordered w-full mt-1"
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Enter resolution details (optional)"
                    ></textarea>
                  </div>
                </div>
                <div className="modal-action mt-6">
                  <button className="btn btn-ghost" onClick={closeResolveModal}>
                    Cancel
                  </button>
                  <button 
                    className="btn btn-success text-white" 
                    onClick={() => resolveTask(resolveModal._id)}
                  >
                    <FiCheck size={18} className="mr-1" />
                    Resolve Task
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Summary footer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="stat bg-white rounded-lg px-6 py-4 border-l-4 border-success">
              <div className="stat-figure text-success">
                <FiCheckCircle size={28} />
              </div>
              <div className="stat-title text-gray-600">Completed</div>
              <div className="stat-value text-success">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="stat-desc text-gray-600">
                {Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)}% of total
              </div>
            </div>
            
            <div className="stat bg-white rounded-lg px-6 py-4 border-l-4 border-warning">
              <div className="stat-figure text-warning">
                <FiClock size={28} />
              </div>
              <div className="stat-title text-gray-600">In Progress</div>
              <div className="stat-value text-warning">
                {tasks.filter(t => t.status === 'in progress').length}
              </div>
              <div className="stat-desc text-gray-600">
                {tasks.filter(t => t.status === 'in progress' && isTaskOverdue(t)).length} overdue
              </div>
            </div>
            
            <div className="stat bg-white rounded-lg px-6 py-4 border-l-4 border-error">
              <div className="stat-figure text-error">
                <FiAlertCircle size={28} />
              </div>
              <div className="stat-title text-gray-600">Pending</div>
              <div className="stat-value text-error">
                {tasks.filter(t => t.status === 'pending').length}
              </div>
              <div className="stat-desc text-gray-600">
                {tasks.filter(t => t.status === 'pending' && isTaskOverdue(t)).length} overdue
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LiveTopologyViewer;