import axios from "axios";

const API_URL = "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // CORS uchun
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const getStats = () => api.get("/stats");
export const getUsers = (page = 1) => api.get(`/users?page=${page}`);
export const blockUser = (id) => api.put(`/users/${id}/block`);
export const getCongrats = () => api.get("/congrats");
export const approveCongrats = (id) => api.post(`/congrats/${id}/approve`);
export const rejectCongrats = (id, reason = null) =>
  api.post(`/congrats/${id}/reject`, { reason });
export const getChannels = () => api.get("/channels");
export const addChannel = (data) => api.post("/channels", data);
export const toggleChannel = (id) => api.put(`/channels/${id}/toggle`);
export const deleteChannel = (id) => api.delete(`/channels/${id}`);
export const getCertificates = () => api.get("/certificates");
export const addCertificate = (formData) =>
  api.post("/certificates", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateCertificate = (id, data) =>
  api.put(`/certificates/${id}`, data);
export const generateCertificate = (data) =>
  api.post("/generate-certificate", data);
export const uploadFont = (formData) =>
  api.post("/upload-font", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getBroadcastStats = () => api.get("/broadcast/stats");
export const sendBroadcast = (data) => api.post("/broadcast", data);

// Admin Management
export const getAdmins = () => api.get("/admins");
export const addAdmin = (data) => api.post("/admins", data);
export const updateAdmin = (id, data) => api.put(`/admins/${id}`, data);
export const deleteAdmin = (id) => api.delete(`/admins/${id}`);
export const checkAdmin = (userId) => api.get(`/admins/check/${userId}`);

export default api;
