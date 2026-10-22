import { api } from "../lib/axios";

const insuranceService = {
  async getPlan() {
    return (await api.get("/insurance/admin/plan")).data;
  },
  async getPlans() {
    return (await api.get("/insurance/plans")).data;
  },
  async createPlan(data) {
    return (await api.post("/insurance/admin/plans", data)).data;
  },
  async updatePlan(id, data) {
    return (await api.put(`/insurance/admin/plans/${id}`, data)).data;
  },
  async savePlan(data) {
    return (await api.put("/insurance/admin/plan", data)).data;
  },
  async getTravelers(params) {
    return (await api.get("/insurance/travelers", { params })).data;
  },
  async updateEnrollment(id, data) {
    return (await api.patch(`/insurance/enrollments/${id}`, data)).data;
  },
  async createClaim(data) {
    return (await api.post("/insurance/claims", data)).data;
  },
  async updateClaim(id, data) {
    return (await api.patch(`/insurance/claims/${id}`, data)).data;
  },
  async downloadPending() {
    return (await api.get("/insurance/pending-export.csv", { responseType: "blob" })).data;
  },
};

export default insuranceService;
