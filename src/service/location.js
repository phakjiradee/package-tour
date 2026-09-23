import { api } from "../lib/axios";

export const locationService = {
  // Get all locations
  async getAll() {
    const response = await api.get("/location");
    return response.data;
  },

  // Get location by ID
  async getById(id) {
    const response = await api.get(`/location/${id}`);
    return response.data;
  },

  // Get locations by type ID
  async getByTypeId(typeId) {
    const response = await api.get(`/location/location_type/${typeId}`);
    return response.data;
  },

  // Create new location
  async create(payload) {
    const response = await api.post("/location", payload);
    return response.data;
  },

  // Update location
  async update(id, payload) {
    const response = await api.put(`/location/${id}`, payload);
    return response.data;
  },

  // Delete location
  async delete(id) {
    const response = await api.delete(`/location/${id}`);
    return response.data;
  },
};

export const locationTypeService = {
  // Get all location types
  async getAll() {
    const response = await api.get("/location-type");
    return response.data;
  },

  // Get location type by ID
  async getById(id) {
    const response = await api.get(`/location-type/${id}`);
    return response.data;
  },

  // Create location type
  async create(payload) {
    const response = await api.post("/location-type", payload);
    return response.data;
  },

  // Update location type
  async update(id, payload) {
    const response = await api.put(`/location-type/${id}`, payload);
    return response.data;
  },

  // Delete location type
  async delete(id) {
    const response = await api.delete(`/location-type/${id}`);
    return response.data;
  },
};

export default locationService;
