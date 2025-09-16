// src/services/dashboardService.js
import api from './api';

export const fetchDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const fetchLatestStudents = async () => {
  try {
    const response = await api.get('/dashboard/latest-students');
    return response.data;
  } catch (error) {
    console.error('Error fetching latest students:', error);
    throw error;
  }
};