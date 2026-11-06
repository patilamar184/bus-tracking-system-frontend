import axios from "axios";
import { clearToken, getToken } from "./auth";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

const isProtectedAdminUrl = (url = "") => url.startsWith("/api/admin") && url !== "/api/admin/login";

// Attach the JWT to protected admin requests only (parent requests never carry it).
api.interceptors.request.use((config) => {
  if (isProtectedAdminUrl(config.url)) {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Expired or invalid admin token: clear it and go back to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && isProtectedAdminUrl(error.config?.url)) {
      clearToken();
      sessionStorage.setItem("session_expired", "1");
      if (window.location.pathname !== "/admin/login") {
        window.location.assign("/admin/login");
      }
    }
    return Promise.reject(error);
  }
);

// Turns an Axios error into a readable message for the UI.
export function getErrorMessage(error) {
  if (error.response) {
    const detail = error.response.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d) => `${(d.loc || []).filter((p) => p !== "body").join(".")}: ${d.msg}`)
        .join("; ");
    }
    return `Server error (HTTP ${error.response.status})`;
  }
  if (error.code === "ECONNABORTED") return "The server took too long to respond.";
  return `Cannot reach the server at ${API_URL}. Check that the backend is running and that CORS allows this site.`;
}

const data = (promise) => promise.then((res) => res.data);

// ----- Admin -----
export const adminLogin = (username, password) =>
  data(api.post("/api/admin/login", { username, password }));
export const getDashboard = () => data(api.get("/api/admin/dashboard"));

export const getBuses = () => data(api.get("/api/admin/buses"));
export const createBus = (body) => data(api.post("/api/admin/buses", body));
export const getBus = (id) => data(api.get(`/api/admin/buses/${id}`));
export const updateBus = (id, body) => data(api.put(`/api/admin/buses/${id}`, body));
export const deleteBus = (id) => data(api.delete(`/api/admin/buses/${id}`));

export const getRoutes = () => data(api.get("/api/admin/routes"));
export const createRoute = (body) => data(api.post("/api/admin/routes", body));
export const updateRoute = (id, body) => data(api.put(`/api/admin/routes/${id}`, body));
export const deleteRoute = (id) => data(api.delete(`/api/admin/routes/${id}`));

// ----- Parent (no authentication) -----
export const getTrack = (token) => data(api.get(`/api/parent/track/${encodeURIComponent(token)}`));
export const getEta = (token, stopId) =>
  data(api.get(`/api/parent/track/${encodeURIComponent(token)}/eta/${stopId}`));
