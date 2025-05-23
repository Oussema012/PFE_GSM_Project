import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiUsers,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiKey,
  FiCheck,
  FiX,
  FiUser,
  FiMail,
  FiLock,
  FiBriefcase,
  FiActivity,
} from 'react-icons/fi';

const NetworkReports = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: '' });
  const [selectedRole, setSelectedRole] = useState('all');
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [openResetModal, setOpenResetModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: '', department: '' });
  const [updateUser, setUpdateUser] = useState({ id: '', name: '', email: '', role: '', department: '' });
  const [resetPassword, setResetPassword] = useState('');
  const [resetUserId, setResetUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const API_URL = 'http://localhost:3000/api/users';

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  useEffect(() => {
    setFilteredUsers(
      users.filter(
        (user) =>
          (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.department || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const endpoint = selectedRole === 'all' ? API_URL : `${API_URL}/role/${selectedRole}`;
      const res = await axios.get(endpoint);
      const usersData = res.data.data || res.data;
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      showSnackbar('Failed to fetch user reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (form) => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Valid email is required';
    if (!form.role) errors.role = 'Role is required';
    if (!form.department.trim()) errors.department = 'Department is required';
    return errors;
  };

  const createUser = async () => {
    const errors = validateForm(newUser);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      showSnackbar('Please fill all required fields', 'error');
      return;
    }
    try {
      await axios.post(`${API_URL}/create`, newUser);
      showSnackbar('User created successfully', 'success');
      setOpenCreateModal(false);
      setNewUser({ name: '', email: '', role: '', department: '' });
      setFormErrors({});
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      showSnackbar(err.response?.data?.message || 'Failed to create user', 'error');
    }
  };

  const updateUserDetails = async () => {
    if (!updateUser.id) {
      showSnackbar('Invalid user ID', 'error');
      return;
    }
    const errors = validateForm(updateUser);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      showSnackbar('Please fill all required fields', 'error');
      return;
    }
    try {
      await axios.put(`${API_URL}/${updateUser.id}`, {
        name: updateUser.name,
        email: updateUser.email,
        role: updateUser.role,
        department: updateUser.department,
      });
      showSnackbar('User updated successfully', 'success');
      setOpenUpdateModal(false);
      setFormErrors({});
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      showSnackbar(err.response?.data?.message || 'Failed to update user', 'error');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      showSnackbar('User deleted successfully', 'success');
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      showSnackbar(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const resetUserPassword = async () => {
    if (!resetPassword || resetPassword.length < 6) {
      showSnackbar('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      await axios.put(`${API_URL}/reset-password/${resetUserId}`, { newPassword: resetPassword });
      showSnackbar('Password reset successfully', 'success');
      setOpenResetModal(false);
      setResetPassword('');
    } catch (err) {
      console.error('Error resetting password:', err);
      showSnackbar(err.response?.data?.message || 'Failed to reset password', 'error');
    }
  };

  const showSnackbar = (message, type = 'error') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar({ ...snackbar, open: false }), 4000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const openUpdateModalForUser = (user) => {
    setUpdateUser({
      id: user._id || '',
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
      department: user.department || '',
    });
    setFormErrors({});
    setOpenUpdateModal(true);
  };

  const openResetModalForUser = (id) => {
    setResetUserId(id);
    setResetPassword('');
    setOpenResetModal(true);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-base-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-base-content flex items-center gap-2">
          <FiUsers className="text-primary" size={24} />
          Network Activity Reports
        </h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <select
            className="select select-bordered select-sm w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            aria-label="Filter by role"
          >
            <option value="all">All Roles</option>
            <option value="technician">Technician</option>
            <option value="admin">Admin</option>
          </select>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search users..."
              className="input input-bordered input-sm w-full pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search users"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" size={16} />
          </div>
          <button
            className="btn btn-primary btn-sm w-full sm:w-auto flex items-center gap-2"
            onClick={() => setOpenCreateModal(true)}
          >
            <FiPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Create User Modal */}
      <div className={`modal ${openCreateModal ? 'modal-open' : ''}`}>
        <div className="modal-box bg-base-100 rounded-lg shadow-lg max-w-md p-6 transition-transform duration-300 ease-out">
          <h3 className="font-bold text-lg text-base-content mb-4">Create New User</h3>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label flex items-center gap-2 text-sm text-base-content/80">
                <FiUser size={16} /> Name
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${formErrors.name ? 'input-error' : ''}`}
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? 'name-error' : undefined}
              />
              {formErrors.name && (
                <p id="name-error" className="text-error text-xs mt-1">
                  {formErrors.name}
                </p>
              )}
            </div>
            <div className="form-control">
              <label className="label flex items-center gap-2 text-sm text-base-content/80">
                <FiMail size={16} /> Email
              </label>
              <input
                type="email"
                className={`input input-bordered w-full ${formErrors.email ? 'input-error' : ''}`}
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                aria-invalid={!!formErrors.email}
                aria-describedby={formErrors.email ? 'email-error' : undefined}
              />
              {formErrors.email && (
                <p id="email-error" className="text-error text-xs mt-1">
                  {formErrors.email}
                </p>
              )}
            </div>
            <div className="form-control">
              <label className="label flex items-center gap-2 text-sm text-base-content/80">
                <FiBriefcase size={16} /> Role
              </label>
              <select
                className={`select select-bordered w-full ${formErrors.role ? 'select-error' : ''}`}
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                aria-invalid={!!formErrors.role}
                aria-describedby={formErrors.role ? 'role-error' : undefined}
              >
                <option value="">Select Role</option>
                <option value="technician">Technician</option>
                <option value="admin">Admin</option>
              </select>
              {formErrors.role && (
                <p id="role-error" className="text-error text-xs mt-1">
                  {formErrors.role}
                </p>
              )}
            </div>
            <div className="form-control">
              <label className="label flex items-center gap-2 text-sm text-base-content/80">
                <FiBriefcase size={16} /> Department
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${formErrors.department ? 'input-error' : ''}`}
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                aria-invalid={!!formErrors.department}
                aria-describedby={formErrors.department ? 'department-error' : undefined}
              />
              {formErrors.department && (
                <p id="department-error" className="text-error text-xs mt-1">
                  {formErrors.department}
                </p>
              )}
            </div>
          </div>
          <div className="modal-action mt-6 flex justify-end gap-2">
            <button
              className="btn btn-ghost btn-sm text-base-content/70 hover:bg-base-200"
              onClick={() => {
                setOpenCreateModal(false);
                setFormErrors({});
              }}
            >
              <FiX size={16} /> Cancel
            </button>
            <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={createUser}>
              <FiCheck size={16} /> Create
            </button>
          </div>
        </div>
      </div>

      {/* Update User Modal */}
      <div className={`modal ${openUpdateModal ? 'modal-open' : ''}`}>
        <div className="modal-box bg-base-100 rounded-lg shadow-lg max-w-md p-6 transition-transform duration-300 ease-out">
          <h3 className="font-bold text-lg text-base-content mb-4">Update User</h3>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label flex items-center gap-2 text-sm text-base-content/80">
                <FiUser size={16} /> Name
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${formErrors.name ? 'input-error' : ''}`}
                value={updateUser.name}
                onChange={(e) => setUpdateUser({ ...updateUser, name: e.target.value })}
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? 'name-error' : undefined}
              />
              {formErrors.name && (
                <p id="name-error" className="text-error text-xs mt-1">
                  {formErrors.name}
                </p>
              )}
            </div>
            <div className="form-control">
              <label className="label flex items-center gap-2 text-sm text-base-content/80">
                <FiMail size={16} /> Email
              </label>
              <input
                type="email"
                className={`input input-bordered w-full ${formErrors.email ? 'input-error' : ''}`}
                value={updateUser.email}
                onChange={(e) => setUpdateUser({ ...updateUser, email: e.target.value })}
                aria-invalid={!!formErrors.email}
                aria-describedby={formErrors.email ? 'email-error' : undefined}
              />
              {formErrors.email && (
                <p id="email-error" className="text-error text-xs mt-1">
                  {formErrors.email}
                </p>
              )}
            </div>
            <div className="form-control">
              <label className="label flex items-center gap-2 text-sm text-base-content/80">
                <FiBriefcase size={16} /> Role
              </label>
              <select
                className={`select select-bordered w-full ${formErrors.role ? 'select-error' : ''}`}
                value={updateUser.role}
                onChange={(e) => setUpdateUser({ ...updateUser, role: e.target.value })}
                aria-invalid={!!formErrors.role}
                aria-describedby={formErrors.role ? 'role-error' : undefined}
              >
                <option value="">Select Role</option>
                <option value="technician">Technician</option>
                <option value="admin">Admin</option>
              </select>
              {formErrors.role && (
                <p id="role-error" className="text-error text-xs mt-1">
                  {formErrors.role}
                </p>
              )}
            </div>
            <div className="form-control">
              <label className="label flex items-center gap-2 text-sm text-base-content/80">
                <FiBriefcase size={16} /> Department
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${formErrors.department ? 'input-error' : ''}`}
                value={updateUser.department}
                onChange={(e) => setUpdateUser({ ...updateUser, department: e.target.value })}
                aria-invalid={!!formErrors.department}
                aria-describedby={formErrors.department ? 'department-error' : undefined}
              />
              {formErrors.department && (
                <p id="department-error" className="text-error text-xs mt-1">
                  {formErrors.department}
                </p>
              )}
            </div>
          </div>
          <div className="modal-action mt-6 flex justify-end gap-2">
            <button
              className="btn btn-ghost btn-sm text-base-content/70 hover:bg-base-200"
              onClick={() => {
                setOpenUpdateModal(false);
                setFormErrors({});
              }}
            >
              <FiX size={16} /> Cancel
            </button>
            <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={updateUserDetails}>
              <FiCheck size={16} /> Update
            </button>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <div className={`modal ${openResetModal ? 'modal-open' : ''}`}>
        <div className="modal-box bg-base-100 rounded-lg shadow-lg max-w-sm p-6 transition-transform duration-300 ease-out">
          <h3 className="font-bold text-lg text-base-content mb-4">Reset Password</h3>
          <div className="form-control">
            <label className="label flex items-center gap-2 text-sm text-base-content/80">
              <FiLock size={16} /> New Password
            </label>
            <input
              type="password"
              className="input input-bordered w-full"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              aria-invalid={resetPassword.length > 0 && resetPassword.length < 6}
              aria-describedby={resetPassword.length > 0 && resetPassword.length < 6 ? 'password-error' : undefined}
            />
            {resetPassword.length > 0 && resetPassword.length < 6 && (
              <p id="password-error" className="text-error text-xs mt-1">
                Password must be at least 6 characters
              </p>
            )}
          </div>
          <div className="modal-action mt-6 flex justify-end gap-2">
            <button
              className="btn btn-ghost btn-sm text-base-content/70 hover:bg-base-200"
              onClick={() => setOpenResetModal(false)}
            >
              <FiX size={16} /> Cancel
            </button>
            <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={resetUserPassword}>
              <FiCheck size={16} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card bg-base-100 shadow-md rounded-lg overflow-hidden">
        <div className="card-body p-0">
          {loading ? (
            <div className="animate-pulse space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="h-4 bg-base-200 rounded w-1/4"></div>
                  <div className="h-4 bg-base-200 rounded w-1/4"></div>
                  <div className="h-4 bg-base-200 rounded w-1/6"></div>
                  <div className="h-4 bg-base-200 rounded w-1/6"></div>
                  <div className="h-4 bg-base-200 rounded w-1/12"></div>
                  <div className="h-4 bg-base-200 rounded w-1/6"></div>
                  <div className="h-4 bg-base-200 rounded w-1/6"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="bg-base-200 text-base-content/80 text-xs uppercase tracking-wide">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <FiActivity size={16} /> Activity
                      </div>
                    </th>
                    <th className="py-3 px-4">Last Active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-white/50 transition-colors duration-200"
                      >
                        <td className="py-3 px-4 text-sm">{user.name || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">{user.email || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`badge badge-sm ${
                              user.role === 'technician' ? 'badge-info' : 'badge-success'
                            } capitalize`}
                          >
                            {user.role || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">{user.department || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">{user.loginCount || 0}</td>
                        <td className="py-3 px-4 text-sm">{formatDate(user.lastActive)}</td>
                        <td className="py-3 px-4 flex justify-end gap-2">
                          <button
                            className="btn btn-warning btn-xs btn-circle tooltip"
                            onClick={() => openUpdateModalForUser(user)}
                            data-tip="Edit User"
                            aria-label="Edit user"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            className="btn btn-error btn-xs btn-circle tooltip"
                            onClick={() => deleteUser(user._id)}
                            data-tip="Delete User"
                            aria-label="Delete user"
                          >
                            <FiTrash2 size={14} />
                          </button>
                          <button
                            className="btn btn-info btn-xs btn-circle tooltip"
                            onClick={() => openResetModalForUser(user._id)}
                            data-tip="Reset Password"
                            aria-label="Reset password"
                          >
                            <FiKey size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-base-content/60 text-sm">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Snackbar */}
      {snackbar.open && (
        <div className="toast toast-top toast-end transition-opacity duration-300 ease-out">
          <div
            className={`alert ${
              snackbar.type === 'error' ? 'alert-error' : 'alert-success'
            } rounded-md shadow-md flex items-center gap-2 px-4 py-2`}
          >
            <span className="text-sm">{snackbar.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkReports;