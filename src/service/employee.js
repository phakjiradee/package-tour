import { api } from "../lib/axios";

export const employeeService = {
  // Get all employees
  async getAll() {
    const response = await api.get("/employee");
    return response.data?.data || [];
  },

  // Get employee by ID
  async getById(id) {
    const response = await api.get(`/employee/${id}`);
    return response.data?.data;
  },

  // Create new employee
  async create(payload) {
    const response = await api.post("/employee", payload);
    return response.data;
  },

  // Update employee
  async update(id, payload) {
    const response = await api.put(`/employee/${id}`, payload);
    return response.data;
  },

  // Delete employee
  async delete(id) {
    const response = await api.delete(`/employee/${id}`);
    return response.data;
  },

  // Get all roles
  async getRoles() {
    const response = await api.get("/roles");
    return response.data?.data || [];
  },

  // Generate mock employees
  async generateMock(count = 20) {
    const response = await api.post("/employee/generate-mock", { count });
    return response.data;
  },
};

export default employeeService;
