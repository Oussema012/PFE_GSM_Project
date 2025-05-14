// ScheduleIntervention.jsx
import React from 'react';
import PropTypes from 'prop-types';
import CreateInterventionModal from './CreateInterventionModal';

const ScheduleIntervention = ({ onClose, onSubmit }) => (
  <CreateInterventionModal
    onClose={onClose}
    onSubmit={onSubmit}
    isScheduling
  />
);

ScheduleIntervention.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default ScheduleIntervention;