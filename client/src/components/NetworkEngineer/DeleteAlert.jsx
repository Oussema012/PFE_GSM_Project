import React from 'react';
import axios from 'axios';
import { FiTrash2 } from 'react-icons/fi';

const DeleteAlert = ({ alertId, onSuccess, onError }) => {
  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  const deleteAlert = async () => {
    if (!isValidObjectId(alertId)) {
      onError('Invalid alert ID format');
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to delete this alert? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/alerts/${alertId}`);
      onSuccess(alertId, 'Alert deleted successfully');
    } catch (err) {
      onError(`Failed to delete alert: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <button
      onClick={deleteAlert}
      className="text-red-600 hover:text-red-900"
      title="Delete"
    >
      <FiTrash2 className="h-5 w-5" />
    </button>
  );
};

export default DeleteAlert;