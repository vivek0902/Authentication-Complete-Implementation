import axios from "axios";

const server = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

// Create an Axios instance
const api = axios.create({
  baseURL: server,
  withCredentials: true,
});

let isRefreshing = false; // Flag to indicate if token refresh is in progress
let failedQueue = []; // Queue to hold failed requests while token is being refreshed

// Function to process the failed requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a response interceptor to handle 403 errors and refresh tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 403 && !originalRequest._retry) {
      if (isRefreshing) {
        // If token refresh is already in progress, add the failed request to the queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        });
      }

      isRefreshing = true; // Set the retry flag to prevent infinite loops
      originalRequest._retry = true; // Mark the original request as a retry

      try {
        await api.post("/api/v1/refresh-token"); // Attempt to refresh the token
        processQueue(null); // Process the queue of failed requests
        return api(originalRequest); // Retry the original request
      } catch (refreshError) {
        // If token refresh fails, reject all failed requests and clear the queue
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
