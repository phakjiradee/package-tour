import axios from "axios";

const getBaseURL = () => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  }
  return "/api";
};

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.baseURL = "/api";
    const boToken = window.localStorage.getItem("bo_token");
    const supplierPortal = config.url?.startsWith("/supplier/") &&
      !config.url?.startsWith("/supplier/admin/");
    const token = supplierPortal
      ? window.localStorage.getItem("sp_token")
      : boToken || window.localStorage.getItem("pt_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (boToken && !supplierPortal) {
      config.headers["x-is-employee"] = "true";
    }
  }
  return config;
});

