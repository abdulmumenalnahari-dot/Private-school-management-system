// src/services/attendanceService.js
import api from './api';

export const fetchAttendance = async (date) => {
  try {
    const response = await api.get(`/attendance?date=${date}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
};

export const fetchStudentsForAttendance = async () => {
  try {
    const response = await api.get('/students/for-attendance');
    return response.data;
  } catch (error) {
    console.error('Error fetching students for attendance:', error);
    throw error;
  }
};

// تم الإضافة: دالة لتحميل الصفوف
export const fetchClasses = async () => {
  try {
    const response = await api.get('/classes');
    return response.data;
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
};

// تم الإضافة: دالة لتحميل الشعب حسب الصف
export const fetchSections = async (classId) => {
  try {
    const response = await api.get(`/sections?class_id=${classId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sections:', error);
    throw error;
  }
};