// src/services/studentService.js
import api from './api';

export const fetchStudents = async () => {
  try {
    const response = await api.get('/students');
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

export const fetchSections = async () => {
  try {
    const response = await api.get('/sections');
    return response.data;
  } catch (error) {
    console.error('Error fetching sections:', error);
    throw error;
  }
};

export const addStudent = async (studentData) => {
  try {
    const response = await api.post('/students', studentData);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error.includes('الطالب موجود مسبقًا')) {
      throw new Error('الطالب موجود مسبقًا');
    }
    throw error;
  }
};

export const deleteStudent = async (id) => {
  try {
    await api.delete(`/students/${id}`);
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};