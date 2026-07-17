import axios from "axios";

// Accept both the documented gateway origin and the legacy value ending in /api.
const gatewayUrl = (import.meta.env.VITE_API_URL || "http://localhost:8080")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

const axiosClient = axios.create({
  baseURL: `${gatewayUrl}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosClient;
