import { api } from "../lib/axios";

export const busService = {
  async getAll() {
    const response = await api.get("/bus");
    return response.data?.data || [];
  },

  async create(payload) {
    const response = await api.post("/bus", payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await api.put(`/bus/${id}`, payload);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/bus/${id}`);
    return response.data;
  },
};

export default busService;
