import React, { useState } from 'react';
import axios from 'axios';
import { FiEye } from 'react-icons/fi';

const AcknowledgeAlert = ({ alertId, onSuccess, onError }) => {
  const [acknowledging, setAcknowledging] = useState(false);

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  const acknowledgeAlert = async () => {
    if (!isValidObjectId(alertId)) {
      onError('Invalid alert ID format');
      return;
    }

    setAcknowledging(true);
    const maxRetries = 3;
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        const response = await axios.put(`/api/alerts/acknowledge/${alertId}`, { acknowledged: true });
        onSuccess(alertId, response.data, 'Alert acknowledged successfully');
        break;
      } catch (err) {
        if (attempt === maxRetries) {
          onError(`Failed to acknowledge alert after ${maxRetries} attempts: ${err.response?.data?.message || err.message}`);
        }
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    setAcknowledging(false);
  };

  return (
    <button
      onClick={acknowledgeAlert}
      className={`text-indigo-600 hover:text-indigo-900 ${acknowledging ? 'opacity-50 cursor-not-allowed' : ''}`}
      title="Acknowledge"
      disabled={acknowledging}
    >
      <FiEye className="h-5 w-5" />
    </button>
  );
};

export default AcknowledgeAlert;