// src/services/discountService.js
import api from './api';

export const addDiscount = async (discountData) => {
  try {
    const response = await api.post('/discounts', discountData);
    return response.data;
  } catch (error) {
    console.error('Error adding discount:', error);
    throw error;
  }
};