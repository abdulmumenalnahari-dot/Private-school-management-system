// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:10000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// إضافة توكين المصادقة إذا لزم الأمر
// api.interceptors.request.use(config => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export default api;
