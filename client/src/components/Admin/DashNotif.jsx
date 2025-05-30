import React, { useState, useEffect } from "react";
import { FaBell, FaFilter } from "react-icons/fa";
import axios from "axios";

const DashNotif = () => {
  const [notifications, setNotifications] = useState([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(5); // Smaller limit for dashboard
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    read: "",
    type: "",
  });

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/api/notifications", {
        params: {
          read: filters.read || undefined,
          type: filters.type || undefined,
          page,
          limit,
        },
      });
      setNotifications(response.data.notifications);
      setTotalNotifications(response.data.total);
      setTotalPages(response.data.totalPages);
      setError(null);
    } catch (err) {
      setError("Failed to fetch notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/notifications/${id}/read`);
      setNotifications(
        notifications.map((n) =>
          n._id === id ? { ...n, read: true, readAt: new Date() } : n
        )
      );
    } catch (err) {
      setError("Failed to mark notification as read");
      console.error("Error marking notification as read:", err);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/notifications/${id}`);
      setNotifications(notifications.filter((n) => n._id !== id));
      setTotalNotifications(totalNotifications - 1);
      if (notifications.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err) {
      setError("Failed to delete notification");
      console.error("Error deleting notification:", err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page on filter change
  };

  // Fetch notifications on mount and when page or filters change
  useEffect(() => {
    fetchNotifications();
  }, [page, filters]);

  return (
    <div className="bg-teal-50 p-4 rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FaBell className="text-xl text-teal-600" />
          <h2 className="text-lg font-bold text-gray-800">Recent Notifications</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2">
          <FaFilter className="text-teal-600" />
          <h3 className="text-sm font-semibold text-gray-800">Filters</h3>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">Read Status</label>
            <select
              name="read"
              value={filters.read}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm"
            >
              <option value="">All</option>
              <option value="true">Read</option>
              <option value="false">Unread</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Type</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm"
            >
              <option value="">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {loading && (
          <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
        )}
        {error && (
          <div className="p-3 text-center text-red-500 text-sm">{error}</div>
        )}
        {!loading && !error && notifications.length === 0 && (
          <div className="p-3 text-center text-gray-500 text-sm">No notifications found</div>
        )}
        {!loading && !error && notifications.length > 0 && (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-3 hover:bg-gray-50 transition ${
                  notification.read ? "bg-gray-100" : "bg-white"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          notification.type === "overdue"
                            ? "bg-red-100 text-red-600"
                            : "bg-teal-100 text-teal-600"
                        }`}
                      >
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString("en-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      Equipment: {notification.equipmentId?.name || "Unknown"}
                    </p>
                    {notification.maintenanceId?.performedBy && (
                      <p className="text-xs text-gray-500">
                        Technician: {notification.maintenanceId.performedBy}
                      </p>
                    )}
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
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
        <div className="mt-3 flex justify-between items-center">
          <div className="text-xs text-gray-600">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalNotifications)} of{" "}
            {totalNotifications}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-teal-600 text-white rounded-md disabled:bg-gray-300 hover:bg-teal-700 transition text-sm"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-teal-600 text-white rounded-md disabled:bg-gray-300 hover:bg-teal-700 transition text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashNotif;