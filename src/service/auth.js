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
};
