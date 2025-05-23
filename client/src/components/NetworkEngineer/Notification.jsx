import React, { useState, useEffect } from "react";
import { FaBell, FaFilter, FaSearch } from "react-icons/fa";
import axios from 'axios';
import { Link } from "react-router-dom";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    read: '',
    type: '',
    email: ''
  });

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/notifications', {
        params: {
          read: filters.read || undefined,
          type: filters.type || undefined,
          email: filters.email || undefined,
          page,
          limit
        }
      });
      setNotifications(response.data.notifications);
      setTotalNotifications(response.data.total);
      setTotalPages(response.data.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger manual notification check
  const checkNotifications = async () => {
    try {
      await axios.post('http://localhost:3000/api/notifications/check');
      fetchNotifications(); // Refresh notifications
    } catch (err) {
      setError('Failed to check notifications');
      console.error('Error checking notifications:', err);
    }
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true, readAt: new Date() } : n));
    } catch (err) {
      setError('Failed to mark notification as read');
      console.error('Error marking notification as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
      setTotalNotifications(totalNotifications - 1);
      if (notifications.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err) {
      setError('Failed to delete notification');
      console.error('Error deleting notification:', err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page on filter change
  };

  // Fetch notifications on mount and when page or filters change
  useEffect(() => {
    fetchNotifications();
  }, [page, filters]);

  return (
    <div className="min-h-screen bg-teal-50 p-6">
      {/* Header */}
      <header className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaBell className="text-2xl text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-800">All Notifications</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/network-dashboard?tab=overview"
              className="text-teal-600 hover:text-teal-800 text-sm font-medium"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={checkNotifications}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
            >
              Check Now
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          <FaFilter className="text-teal-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Read Status</label>
            <select
              name="read"
              value={filters.read}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">All</option>
              <option value="true">Read</option>
              <option value="false">Unread</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={filters.email}
              onChange={handleFilterChange}
              placeholder="Enter email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {loading && (
          <div className="p-4 text-center text-gray-500">Loading notifications...</div>
        )}
        {error && (
          <div className="p-4 text-center text-red-500">{error}</div>
        )}
        {!loading && !error && notifications.length === 0 && (
          <div className="p-4 text-center text-gray-500">No notifications found</div>
        )}
        {!loading && !error && notifications.length > 0 && (
          <div className="divide-y divide-gray-200">
            {notifications.map(notification => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-gray-50 transition ${
                  notification.read ? 'bg-gray-100' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        notification.type === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'
                      }`}>
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString('en-US', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Equipment: {notification.equipmentId?.name || 'Unknown'}
                    </p>
                    {notification.maintenanceId?.performedBy && (
                      <p className="text-xs text-gray-500">
                        Technician: {notification.maintenanceId.performedBy}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Scheduled: {new Date(notification.scheduledDate).toLocaleString('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="text-teal-600 hover:text-teal-800 text-xs"
                        title="Mark as read"
                      >
                        <FaBell />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalNotifications)} of {totalNotifications} notifications
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:bg-gray-300 hover:bg-teal-700 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:bg-gray-300 hover:bg-teal-700 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;