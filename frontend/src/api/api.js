import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor to add the token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refreshing
api.interceptors.response.use(
  (response) => {
    // If the request was successful, just return the response
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 (Unauthorized) and it's not a retry request
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark this request as a retry

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          // If no refresh token, logout and redirect
          console.error("No refresh token found.");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          window.location.href = "/login"; // Or your login route
          return Promise.reject(error);
        }

        // Make the request to refresh the token
        const response = await api.post("token/refresh/", {
          refresh: refreshToken,
        });

        // Get the new access token
        const { access } = response.data;

        // Save the new access token
        localStorage.setItem("access_token", access);

        // Update the authorization header on the original request
        originalRequest.headers.Authorization = `Bearer ${access}`;

        // Retry the original request with the new token
        return api(originalRequest);
        
      } catch (refreshError) {
        // If the refresh token itself is invalid, logout and redirect
        console.error("Error refreshing token:", refreshError);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login"; // Or your login route
        return Promise.reject(refreshError);
      }
    }

    // For any other errors, just pass them along
    return Promise.reject(error);
  }
);

export default api;