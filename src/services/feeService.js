// src/services/feeService.js
import api from "./api";
export const fetchFees = async () => {
  try {
    const response = await api.get("/fees");
    return response.data;
  } catch (error) {
    console.error("Error fetching fees:", error);
    throw error;
  }
};
export const fetchStudentsForFees = async () => {
  try {
    const response = await api.get("/students/for-fees");
    return response.data;
  } catch (error) {
    console.error("Error fetching students for fees:", error);
    throw error;
  }
};
export const fetchFeeTypes = async () => {
  try {
    const response = await api.get("/fee-types");
    return response.data;
  } catch (error) {
    console.error("Error fetching fee types:", error);
    throw error;
  }
};
export const addFee = async (feeData) => {
  try {
    const response = await api.post("/fees", feeData);
    return response.data;
  } catch (error) {
    console.error("Error adding fee:", error);
    throw error;
  }
};
export const deleteFee = async (id) => {
  try {
    await api.delete(`/fees/${id}`);
  } catch (error) {
    console.error("Error deleting fee:", error);
    throw error;
  }
};