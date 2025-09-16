// src/services/reportService.js
import api from './api';

export const fetchStudentsForReport = async () => {
  try {
    const response = await api.get('/students/for-report');
    return response.data;
  } catch (error) {
    console.error('Error fetching students for report:', error);
    throw error;
  }
};

export const fetchStudentReport = async (studentId) => {
  try {
    const response = await api.get(`/reports/student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student report:', error);
    throw error;
  }
};