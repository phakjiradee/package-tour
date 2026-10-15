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

  // อัปเดตสถานะการจอง (สำหรับแอดมิน)
  async updateStatus(id, status) {
    const response = await api.patch(`/booking/${id}/status`, { status });
    return response.data;
  },

  // จำลองการชำระเงิน (Mock QR Payment)
  async mockPay(code) {
    const response = await api.post(`/booking/${code}/mock-pay`);
    return response.data;
  },

  // สร้าง Stripe Checkout Session (ชำระด้วยบัตรเครดิต/เดบิต)
  async createStripeSession(code, origin) {
    const response = await api.post(`/booking/${code}/create-stripe-session`, { origin });
    return response.data;
  },

  // ตรวจสอบสถานะการชำระเงิน Stripe เมื่อกลับมาจากหน้า Checkout
  async verifyStripe(code, sessionId) {
    const response = await api.get(`/booking/${code}/verify-stripe`, {
      params: { session_id: sessionId },
    });
    return response.data;
  },

  // ขอยกเลิกการจอง
  async cancel(code, reason = "") {
    const response = await api.post(`/booking/${code}/cancel`, { reason });
    return response.data;
  },
};

export default bookingService;
