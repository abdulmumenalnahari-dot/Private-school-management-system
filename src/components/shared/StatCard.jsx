// src/components/shared/StatCard.jsx
import React from 'react';

const StatCard = ({ icon, value, label, variant = 'primary' }) => {
  const variants = {
    primary: 'stat-primary',
    success: 'stat-success',
    warning: 'stat-warning',
    danger: 'stat-danger'
  };

  return (
    <div className={`stat-card ${variants[variant]}`}>
      <div className={`stat-icon ${variants[variant]}`}>
        <i className={icon}></i>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default StatCard;