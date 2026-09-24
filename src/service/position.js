import { api } from "../lib/axios";

export const positionService = {
  // Get all positions
  async getAll() {
    const response = await api.get("/position");
    return response.data?.data || [];
  },

  // Get position by ID
  async getById(id) {
    const response = await api.get(`/position/${id}`);
    return response.data?.data;
  },

  // Create new position
  async create(payload) {
    const response = await api.post("/position", payload);
    return response.data;
  },

  // Update position
  async update(id, payload) {
    const response = await api.put(`/position/${id}`, payload);
    return response.data;
  },

  // Delete position
  async delete(id) {
    const response = await api.delete(`/position/${id}`);
    return response.data;
  },
};

export default positionService;
