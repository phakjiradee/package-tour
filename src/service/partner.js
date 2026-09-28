import { api } from "../lib/axios";

export const partnerService = {
  // Get all partners
  async getAll() {
    const response = await api.get("/partner");
    return response.data;
  },

  // Get partner by ID
  async getById(id) {
    const response = await api.get(`/partner/${id}`);
    return response.data;
  },

  // Create new partner
  async create(payload) {
    const response = await api.post("/partner", payload);
    return response.data;
  },

  // Update partner
  async update(id, payload) {
    const response = await api.put(`/partner/${id}`, payload);
    return response.data;
  },

  // Delete partner
  async delete(id) {
    const response = await api.delete(`/partner/${id}`);
    return response.data;
  },
};

export const partnerTypeService = {
  // Get all partner types
  async getAll() {
    const response = await api.get("/partner-type");
    return response.data;
  },

  // Get partner type by ID
  async getById(id) {
    const response = await api.get(`/partner-type/${id}`);
    return response.data;
  },

  // Create partner type
  async create(payload) {
    const response = await api.post("/partner-type", payload);
    return response.data;
  },

  // Update partner type
  async update(id, payload) {
    const response = await api.put(`/partner-type/${id}`, payload);
    return response.data;
  },

  // Delete partner type
  async delete(id) {
    const response = await api.delete(`/partner-type/${id}`);
    return response.data;
  },
};

export default partnerService;
