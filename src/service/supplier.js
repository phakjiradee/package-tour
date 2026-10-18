import { api } from "../lib/axios";

export const supplierService = {
  // Supplier Portal Auth
  async login({ email, password }) {
    const response = await api.post("/supplier/login", { email, password });
    return response.data;
  },

  async setPassword({ email, currentPassword, newPassword }) {
    const response = await api.post("/supplier/set-password", {
      email,
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  async getMe() {
    const response = await api.get("/supplier/me");
    return response.data?.user || null;
  },

  // Supplier Portal: Trips arriving at supplier's location
  async getTrips() {
    const response = await api.get("/supplier/trips");
    return response.data;
  },

  // Admin Management for Supplier Accounts (used by /backoffice/supplier)
  admin: {
    async getAccounts() {
      const response = await api.get("/supplier/admin/accounts");
      return response.data?.data || [];
    },

    async createAccount(payload) {
      const response = await api.post("/supplier/admin/accounts", payload);
      return response.data;
    },

    async updateAccount(id, payload) {
      const response = await api.put(`/supplier/admin/accounts/${id}`, payload);
      return response.data;
    },

    async deleteAccount(id) {
      const response = await api.delete(`/supplier/admin/accounts/${id}`);
      return response.data;
    },
  },
};

export default supplierService;
