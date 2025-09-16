// src/components/layout/Sidebar.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import NavLink from '../navigation/NavLink';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const closeSidebar = () => {
    if (window.innerWidth <= 992) {
      toggleSidebar();
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'show' : ''}`}>
      <NavLink 
        to="/" 
        icon="fas fa-tachometer-alt" 
        text="لوحة التحكم" 
        isActive={location.pathname === '/'}
        closeSidebar={closeSidebar} 
      />
      <NavLink 
        to="/students" 
        icon="fas fa-users" 
        text="الطلاب" 
        isActive={location.pathname === '/students'}
        closeSidebar={closeSidebar} 
      />
      <NavLink 
        to="/fees" 
        icon="fas fa-money-bill-wave" 
        text="الرسوم والدفعات" 
        isActive={location.pathname === '/fees'}
        closeSidebar={closeSidebar} 
      />
      <NavLink 
        to="/attendance" 
        icon="fas fa-calendar-check" 
        text="الحضور والغياب" 
        isActive={location.pathname === '/attendance'}
        closeSidebar={closeSidebar} 
      />
      <NavLink 
        to="/reports" 
        icon="fas fa-file-alt" 
        text="التقارير" 
        isActive={location.pathname === '/reports'}
        closeSidebar={closeSidebar} 
      />
    </aside>
  );
};

export default Sidebar;