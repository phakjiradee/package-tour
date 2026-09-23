import { api } from "../lib/axios";

export const authService = {
  async register(payload) {
    const response = await api.post("/auth/register", payload);
    return response.data;
  },

  async login(payload) {
    const response = await api.post("/auth/login", payload);
    return response.data;
  },

  async getMe() {
    const response = await api.get("/auth/me");
    return response.data;
  },

  async logout() {
    try {
      const response = await api.post("/auth/logout");
      return response.data;
    } catch {
      return null;
    }
  },
};

export const serviceAuth = authService;
export default authService;
