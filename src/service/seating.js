import { api } from "../lib/axios";

export const seatingService = {
  async getPaidBookings() {
    const response = await api.get("/seating");
    return response.data.data;
  },
  async getBooking(id) {
    const response = await api.get(`/seating/${id}`);
    return response.data.data;
  },
  async save(id, assignments) {
    const response = await api.put(`/seating/${id}`, { assignments });
    return response.data;
  },
};
