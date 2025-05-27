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
  FiUser,
  FiTool,
  FiHardDrive,
  FiChevronRight,
  FiAlertTriangle
} from 'react-icons/fi';

const LiveTopologyViewer = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = useSelector((state) => state.user?.currentUser);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentUser?._id) {
        setError('User authentication required');
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get(`/api/maintenance/technician/${currentUser._id}`);
        
        if (response.data?.success) {
          setTasks(response.data.data || []);
        } else {
          setError(response.data?.message || 'No tasks available');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [currentUser]);

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
    const scheduledDate = new Date(task.scheduledDate);
    const today = new Date();
    return scheduledDate < today;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-white animate-pulse">Loading your tasks...</p>
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
            <span className="text-black">My Maintenance Tasks</span>
          </h2>
          <p className="text-white mt-1">Overview of your assigned maintenance activities</p>
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
              {/* Table header */}
              <thead className="bg-white">
                <tr>
                  <th className="text-base font-semibold text-black pl-6">Equipment</th>
                  <th className="text-base font-semibold text-black">Description</th>
                  <th className="text-base font-semibold text-black">Status</th>
                  <th className="text-base font-semibold text-black">Scheduled</th>
                  <th className="text-base font-semibold text-black pr-6">Actions</th>
                </tr>
              </thead>
              
              {/* Table body */}
              <tbody>
                {tasks.map((task) => (
                  <tr 
                    key={task._id} 
                    className={`hover:bg-gray-50 transition-colors ${isTaskOverdue(task) ? 'bg-error/5' : ''}`}
                  >
                    <td className="pl-6 py-4">
                      <div className="flex items-center">
                        <div className="text-primary">
                          {getDeviceIcon(task.equipmentId?.type)}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2 text-black">
                            {task.equipmentId?.name || 'Unspecified'}
                            {isTaskOverdue(task) && (
                              <span className="tooltip" data-tip="Overdue">
                                <FiAlertTriangle className="text-error" size={16} />
                              </span>
                            )}
                          </div>
                          {task.equipmentId?.serialNumber && (
                            <div className="text-xs text-white mt-1">{task.equipmentId.serialNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs py-4">
                      <div className="line-clamp-2 text-black">{task.description}</div>
                    </td>
                    <td className="py-4">
                      <div className={getStatusBadge(isTaskOverdue(task) ? 'overdue' : task.status)}>
                        {isTaskOverdue(task) ? 'Overdue' : task.status}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <FiCalendar size={16} className="text-white" />
                        <span className="font-medium text-black">
                          {new Date(task.scheduledDate).toLocaleDateString()}
                        </span>
                        {isTaskOverdue(task) && (
                          <span className="text-error text-xs ml-2">(Overdue)</span>
                        )}
                      </div>
                    </td>
                    <td className="pr-6 py-4">
                      <button className="btn btn-sm btn-ghost text-primary hover:text-primary/80 transition-all group">
                        Details
                        <FiChevronRight 
                          size={18} 
                          className="ml-1 group-hover:translate-x-1 transition-transform" 
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Summary footer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="stat bg-white rounded-lg px-6 py-4 border-l-4 border-success">
              <div className="stat-figure text-success">
                <FiCheckCircle size={28} />
              </div>
              <div className="stat-title text-white">Completed</div>
              <div className="stat-value text-success">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="stat-desc text-white">
                {Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)}% of total
              </div>
            </div>
            
            <div className="stat bg-white rounded-lg px-6 py-4 border-l-4 border-warning">
              <div className="stat-figure text-warning">
                <FiClock size={28} />
              </div>
              <div className="stat-title text-white">In Progress</div>
              <div className="stat-value text-warning">
                {tasks.filter(t => t.status === 'in progress').length}
              </div>
              <div className="stat-desc text-white">
                {tasks.filter(t => t.status === 'in progress' && isTaskOverdue(t)).length} overdue
              </div>
            </div>
            
            <div className="stat bg-white rounded-lg px-6 py-4 border-l-4 border-error">
              <div className="stat-figure text-error">
                <FiAlertCircle size={28} />
              </div>
              <div className="stat-title text-white">Pending</div>
              <div className="stat-value text-error">
                {tasks.filter(t => t.status === 'pending').length}
              </div>
              <div className="stat-desc text-white">
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