// src/components/navigation/NavLink.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NavLink = ({ to, icon, text, isActive, closeSidebar }) => {
  return (
    <Link 
      to={to} 
      className={`sidebar-item ${isActive ? 'active' : ''}`}
      onClick={closeSidebar}
    >
      <i className={icon}></i>
      <span>{text}</span>
    </Link>
  );
};

export default NavLink;