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
    const guidePortal = config.url?.startsWith("/guide/") &&
      !window.location.pathname.startsWith("/backoffice");
    const inBackoffice = window.location.pathname.startsWith("/backoffice");
    const inSupplier = window.location.pathname.startsWith("/supplier");
    const inGuide = window.location.pathname.startsWith("/worker");
    const token = supplierPortal || inSupplier
      ? window.localStorage.getItem("sp_token")
      : guidePortal || inGuide ? window.localStorage.getItem("gd_token")
      : inBackoffice ? boToken : window.localStorage.getItem("pt_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (inBackoffice && boToken && !supplierPortal) {
      config.headers["x-is-employee"] = "true";
    }
  }
  return config;
});

