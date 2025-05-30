import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaMapMarkedAlt,
  FaChartBar,
  FaBell,
  FaTools,
  FaSignOutAlt,
  FaUserCircle,
  FaSearch,
  FaUserShield,
  FaGlobe,
} from "react-icons/fa";
import axios from "axios";
import { signoutSuccess } from "../redux/user/userSlice";
import { useSelector, useDispatch } from "react-redux";
import DashOverview from "../components/Admin/DashOverview";
import DashUserManagement from "../components/Admin/DashUserManagement";
import DashReports from "../components/Admin/DashReports";
import DashNotifications from "../components/Admin/DashNotifications";
import DashNotif from "../components/Admin/DashNotif";
import DashSiteManagement from "../components/Admin/DashSiteManagement";
import DashInterventions from "../components/Admin/DashInterventions";
import DashMapSites from "../components/Admin/DashMapSites";

// Notification Dropdown Component
// Notification Dropdown Component
const AdminNotificationDropdown = ({ onClose }) => {
  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 overflow-hidden notification-dropdown">
      <div className="p-4 bg-teal-700 text-white flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <button
          onClick={() => {
            // Trigger a refresh by calling the API directly
            axios
              .post("http://localhost:3000/api/notifications/check")
              .then(() => {
                // Assuming DashNotif will handle its own refresh
              })
              .catch((err) => console.error("Error checking notifications:", err));
          }}
          className="text-sm bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded-full transition"
        >
          Check Now
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        <DashNotif />
      </div>
      <div className="p-4 bg-gray-50 text-center">
        <Link
          to="/admin-dashboard?tab=alert_Management"
          onClick={onClose}
          className="text-teal-600 hover:text-teal-800 text-sm font-medium"
        >
          View All Alerts
        </Link>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const currentUser = useSelector((state) => state.user.currentUser);
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);

  // Fetch unread notifications count
  const fetchUnreadNotifications = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/notifications", {
        params: { read: false, limit: 10 },
      });
      setUnreadCount(response.data.total || 0);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
    }
  };

  // Set active tab and fetch unread notifications
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get("tab");
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab("system_Overview");
    }
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [location.search]);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.closest(".notification-bell")
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Handle sign out
  const signOut = async () => {
    try {
      await axios.post("http://localhost:3000/signout");
      dispatch(signoutSuccess());
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Handle bell click to toggle dropdown
  const handleBellClick = () => {
    setShowNotifications((prev) => !prev);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "system_Overview":
        return <DashOverview />;
      case "user_Management":
        return <DashUserManagement />;
      case "sites_Management":
        return <DashSiteManagement />;
      case "analytics_reports":
        return <DashReports />;
      case "alert_Management":
        return <DashNotifications />;
      case "recent_Alerts":
        return <DashNotif />;
      case "interventions":
        return <DashInterventions />;
      case "map_of_sites":
        return <DashMapSites />;
      default:
        return <DashOverview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-blue-50">
      {/* Fixed Sidebar */}
      <div className="fixed top-0 left-0 w-64 h-screen bg-blue-800 text-white flex flex-col p-0 shadow-xl z-50">
        <div className="p-6 pb-4 border-b border-blue-700">
          <div className="flex items-center space-x-3">
            <FaUserShield className="text-2xl text-blue-300" />
            <h1 className="text-xl font-bold">Admin Console</h1>
          </div>
          <div className="mt-4 text-sm text-blue-200">
            Welcome back, <span className="font-medium text-white">{currentUser?.username || "Admin"}</span>
            <div className="text-xs text-blue-300 mt-1 truncate">{currentUser?.email}</div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <Link
                to="/admin-dashboard?tab=system_Overview"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "system_Overview" ? "bg-blue-700 text-white font-medium" : "hover:bg-blue-700 hover:text-white"
                } transition`}
              >
                <FaTachometerAlt className="mr-3 text-blue-300" />
                System Overview
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard?tab=user_Management"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "user_Management" ? "bg-blue-700 text-white font-medium" : "hover:bg-blue-700 hover:text-white"
                } transition`}
              >
                <FaUsers className="mr-3 text-blue-300" />
                User Management
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard?tab=sites_Management"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "sites_Management" ? "bg-blue-700 text-white font-medium" : "hover:bg-blue-700 hover:text-white"
                } transition`}
              >
                <FaMapMarkedAlt className="mr-3 text-blue-300" />
                Sites Management
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard?tab=analytics_reports"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "analytics_reports" ? "bg-blue-700 text-white font-medium" : "hover:bg-blue-700 hover:text-white"
                } transition`}
              >
                <FaChartBar className="mr-3 text-blue-300" />
                Analytics & Reports
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard?tab=alert_Management"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "alert_Management" ? "bg-blue-700 text-white font-medium" : "hover:bg-blue-700 hover:text-white"
                } transition`}
              >
                <FaBell className="mr-3 text-blue-300" />
                Alert Management
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard?tab=recent_Alerts"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "recent_Alerts" ? "bg-blue-700 text-white font-medium" : "hover:bg-blue-700 hover:text-white"
                } transition`}
              >
                <FaBell className="mr-3 text-blue-300" />
                Recent Alerts
                {unreadCount > 0 && (
                  <span className="ml-2 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard?tab=interventions"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "interventions" ? "bg-blue-700 text-white font-medium" : "hover:bg-blue-700 hover:text-white"
                } transition`}
              >
                <FaTools className="mr-3 text-blue-300" />
                Interventions
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard?tab=map_of_sites"
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === "map_of_sites" ? "bg-blue-700 text-white font-medium" : "hover:bg-blue-700 hover:text-white"
                } transition`}
              >
                <FaGlobe className="mr-3 text-blue-300" />
                Map of Sites
              </Link>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-blue-700">
          <button
            onClick={signOut}
            className="flex items-center w-full px-4 py-2 text-sm text-blue-200 hover:text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FaSignOutAlt className="mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content with Margin to Account for Fixed Sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <header className="bg-white shadow-sm relative">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Search Bar */}
            <div className="relative w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users, sites..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* User Info and Notifications */}
            <div className="flex items-center space-x-4">
              <div className="relative notification-bell" ref={dropdownRef}>
                <button
                  onClick={handleBellClick}
                  className="relative p-2 text-gray-500 hover:text-teal-600 rounded-full hover:bg-teal-50"
                >
                  <FaBell className="text-xl" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                {showNotifications && (
                  <AdminNotificationDropdown
                    onClose={() => setShowNotifications(false)}
                    setUnreadCount={unreadCount}
                  />
                )}
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-right hidden md:block">
                  <div className="font-medium text-gray-800">{currentUser?.username || "Admin"}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[180px]">{currentUser?.email}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FaUserCircle className="text-2xl text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-blue-50">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;