import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 60000, // 60s — handles Render free-tier cold starts (can take 30-50s)
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 responses, clear auth and redirect to login
// Skip for auth endpoints (login/register) so first-attempt errors aren't swallowed
// Skip for network errors and timeouts — don't kick user to login on slow server
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register");
    // Only redirect on explicit 401 (Unauthorized), not on network/timeout errors
    if (error.response && error.response.status === 401 && !isAuthRoute) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;