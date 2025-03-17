import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

const baseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({ baseURL });

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);

    // ✅ Only add Authorization header if it's NOT register or login
    if (token && !config.url.includes("/register/") && !config.url.includes("/login/")) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error.response || error);
    return Promise.reject(error);
  }
);

export default api;
