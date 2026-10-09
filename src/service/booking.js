import { api } from "../lib/axios";

export const bookingService = {
  // สร้างรายการจองใหม่
  async create(payload) {
    const response = await api.post("/booking", payload);
    return response.data;
  },

  // ดึงข้อมูลการจองตาม ID
  async getById(id) {
    const response = await api.get(`/booking/${id}`);
    return response.data;
  },

  // ดึงข้อมูลการจองตาม Booking Code (เช่น ZT-2410-ABCD)
  async getByCode(code) {
    const response = await api.get(`/booking/${code}`);
    return response.data;
  },

  // ดึงประวัติการจองทั้งหมดของ User ที่ล็อกอินอยู่
  async getMyBookings() {
    const response = await api.get("/booking/my-bookings");
    return response.data;
  },

  // ดึงรายการจองทั้งหมด (สำหรับแอดมินหรือหน้าจัดการ)
  async getAll(params = {}) {
    const response = await api.get("/booking", { params });
    return response.data;
  },
};

export default bookingService;
