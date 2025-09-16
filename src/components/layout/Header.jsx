// src/components/layout/Header.jsx
import React from 'react';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="header">
      <div className="logo">
        <i className="fas fa-school"></i>
        <span>نظام إدارة المدرسة الأهلية</span>
      </div>
      
      <div className="toggle-sidebar" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </div>
    </header>
  );
};

export default Header;