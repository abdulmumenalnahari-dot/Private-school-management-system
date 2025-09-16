// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/shared/StatCard';
import Table from '../components/ui/Table';
import { fetchDashboardStats, fetchLatestStudents } from '../services/dashboardService';
import '../styles/pages/dashboard.css';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceToday: 0,
    feesDue: 0,
    absentToday: 0
  });
  const [latestStudents, setLatestStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, studentsData] = await Promise.all([
        fetchDashboardStats(),
        fetchLatestStudents()
      ]);
      
      setStats(statsData);
      setLatestStudents(studentsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'الاسم', accessor: 'name' },
    { header: 'الصف', accessor: 'gradeSection' },
    { header: 'الهاتف', accessor: 'phone' },
    { 
      header: 'الحالة', 
      accessor: 'status',
      render: (student) => (
        <span className="status status-present">نشط</span>
      )
    },
    { header: 'الإجراءات', accessor: 'actions' }
  ];

  const renderActions = (student) => (
    <div>
      <button className="action-btn">
        <i className="fas fa-eye"></i>
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i> جاري التحميل...
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <h1 className="page-title">
        <i className="fas fa-tachometer-alt"></i>
        لوحة التحكم
      </h1>
      
      <div className="stats-grid">
        <StatCard 
          icon="fas fa-users" 
          value={stats.totalStudents} 
          label="إجمالي الطلاب" 
          variant="primary" 
        />
        <StatCard 
          icon="fas fa-calendar-check" 
          value={stats.attendanceToday} 
          label="الحضور اليوم" 
          variant="success" 
        />
        <StatCard 
          icon="fas fa-money-bill-wave" 
          value={stats.feesDue} 
          label="المستحقات المالية" 
          variant="warning" 
        />
        <StatCard 
          icon="fas fa-exclamation-triangle" 
          value={stats.absentToday} 
          label="الغياب اليوم" 
          variant="danger" 
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-user-graduate"></i>
            أحدث الطلاب المسجلين
          </h2>
        </div>
        <Table 
          columns={columns} 
          data={latestStudents.map(student => ({
            ...student,
            gradeSection: `${student.grade} - ${student.section}`
          }))} 
          renderActions={renderActions} 
          emptyMessage="لا يوجد طلاب حديثين"
        />
      </div>
    </div>
  );
};

export default DashboardPage;