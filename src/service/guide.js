import { api } from "../lib/axios";

export const guideService = {
  async login(payload) {
    const response = await api.post("/guide/login", payload);
    return response.data;
  },

  async setPassword(payload) {
    const response = await api.post("/guide/set-password", payload);
    return response.data;
  },

  async getMe() {
    const response = await api.get("/guide/me");
    return response.data;
  },

  /**
   * ดึงรายการแพ็กเกจที่ไกด์เคยดูแลหรือดูแลอยู่
   * @param {Object} params - { guide_id, status: 'all' | 'ongoing' | 'past' }
   */
  async getPackages(params = {}) {
    const response = await api.get("/guide/packages", { params });
    return response.data;
  },

  /**
   * ดึงเฉพาะ ID ของแพ็กเกจที่เคยดูแลหรือดูแลอยู่
   * @param {Object} params - { guide_id }
   */
  async getPackageIds(params = {}) {
    const response = await api.get("/guide/packages/ids", { params });
    return response.data;
  },

  /**
   * ดึงรายละเอียดของแพ็กเกจสำหรับไกด์ พร้อมข้อมูลลูกค้า ผู้ร่วมเดินทาง และสรุปสถิติ
   * @param {number|string} packageId
   * @param {Object} params - { guide_id }
   */
  async getPackageDetail(packageId, params = {}) {
    const response = await api.get(`/guide/packages/${packageId}`, { params });
    return response.data;
  },
};

export default guideService;
