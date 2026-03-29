import axios from "axios";

const resolvedBaseUrl = String(import.meta.env.VITE_API_URL || "/api").trim();

const apiClient = axios.create({
  baseURL: resolvedBaseUrl || "/api",
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
