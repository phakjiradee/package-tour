import { api } from "../lib/axios";

export const collabService = {
  // ค้นหาผู้ใช้งาน (สำหรับ invite หรือเพิ่มเป็น collaborator)
  async searchUsers(query = "") {
    const response = await api.get("/collab/users/search", {
      params: { q: query },
    });
    return response.data;
  },

  // ดึงรายชื่อผู้ร่วมทริปของแพ็กเกจ
  async getByPackage(packageId) {
    const response = await api.get(`/collab/package/${packageId}`);
    return response.data;
  },

  // ดึงรายชื่อผู้ร่วมทริปของการจอง
  async getByBooking(bookingId) {
    const response = await api.get(`/collab/booking/${bookingId}`);
    return response.data;
  },

  // ดึงทริปทั้งหมดของฉันที่เข้าร่วม
  async getMyCollabs() {
    const response = await api.get("/collab/my");
    return response.data;
  },

  // เพิ่มผู้ร่วมทริป (ส่ง package_id, user_id หรือ email, role, status)
  async add(payload) {
    const response = await api.post("/collab", payload);
    return response.data;
  },

  // แก้ไขข้อมูล / สถานะผู้ร่วมทริป
  async update(id, payload) {
    const response = await api.patch(`/collab/${id}`, payload);
    return response.data;
  },

  // ลบผู้ร่วมทริปตาม record ID
  async remove(id) {
    const response = await api.delete(`/collab/${id}`);
    return response.data;
  },

  // ลบผู้ร่วมทริปตาม package_id และ user_id
  async removeByPackageAndUser(packageId, userId) {
    const response = await api.delete("/collab", {
      data: { package_id: packageId, user_id: userId },
    });
    return response.data;
  },
};

export default collabService;
