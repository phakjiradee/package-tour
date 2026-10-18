"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Store,
  Trash2,
  User,
  UsersRound,
} from "lucide-react";
import supplierService from "@/service/supplier";
import partnerService from "@/service/partner";

export default function SupplierManagementPage() {
  const [accounts, setAccounts] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    lineId: "",
    password: "",
    partner_id: "",
    status: "ใช้งาน",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Delete Confirm
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [accsRes, partsRes] = await Promise.all([
        supplierService.admin.getAccounts(),
        partnerService.getAll(),
      ]);
      setAccounts(Array.isArray(accsRes) ? accsRes : []);
      setPartners(Array.isArray(partsRes) ? partsRes : []);
    } catch (err) {
      console.error("Error loading supplier data:", err);
      showToast("ไม่สามารถดึงข้อมูลบัญชี Supplier ได้", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const openCreateModal = () => {
    setEditingAccount(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      lineId: "",
      password: "",
      partner_id: partners.length > 0 ? String(partners[0].id) : "",
      status: "ใช้งาน",
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const openEditModal = (acc) => {
    setEditingAccount(acc);
    setFormData({
      name: acc.name || "",
      email: acc.email || "",
      phone: acc.phone || "",
      lineId: acc.lineId || "",
      password: "",
      partner_id: acc.partner_id ? String(acc.partner_id) : "",
      status: acc.status || "ใช้งาน",
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!formData.name.trim() || !formData.email.trim()) {
      setModalError("กรุณากรอกชื่อและอีเมล");
      return;
    }

    if (!editingAccount && (!formData.password || formData.password.length < 6)) {
      setModalError("รหัสผ่านเริ่มต้นต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    try {
      setModalLoading(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        lineId: formData.lineId.trim(),
        partner_id: formData.partner_id ? parseInt(formData.partner_id) : null,
        status: formData.status,
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      if (editingAccount) {
        await supplierService.admin.updateAccount(editingAccount.id, payload);
        showToast("อัปเดตบัญชี Supplier เรียบร้อยแล้ว");
      } else {
        await supplierService.admin.createAccount(payload);
        showToast("สร้างบัญชี Supplier สำเร็จแล้ว");
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      setModalError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;
    try {
      setDeleteLoading(true);
      await supplierService.admin.deleteAccount(deletingAccount.id);
      showToast("ลบบัญชี Supplier สำเร็จ");
      setDeletingAccount(null);
      loadData();
    } catch (err) {
      showToast("ไม่สามารถลบบัญชีได้", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Find partner location helper
  const selectedPartnerObj = useMemo(() => {
    if (!formData.partner_id) return null;
    return partners.find((p) => String(p.id) === String(formData.partner_id));
  }, [formData.partner_id, partners]);

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.phone?.includes(q) ||
        a.partner_name?.toLowerCase().includes(q) ||
        a.location_name?.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const activeCount = accounts.filter((a) => a.status === "ใช้งาน").length;
  const linkedLocationCount = accounts.filter((a) => !!a.location_name).length;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">บัญชี Supplier</h1>
              <p className="text-xs text-slate-500">
                จัดการบัญชีสำหรับพาร์ทเนอร์/Supplier โดยเฉพาะ แยกขาดจากพนักงานทั่วไป และเชื่อมกับ Location
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>รีเฟรช</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มบัญชี Supplier</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">บัญชีทั้งหมด</span>
            <UsersRound className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{accounts.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600">สถานะใช้งาน</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600">เชื่อมโยงกับ Location</span>
            <MapPin className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">{linkedLocationCount}</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {/* Search Bar */}
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, อีเมล, พาร์ทเนอร์, หรือสถานที่..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs text-slate-800 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 border-b border-slate-100 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">ผู้ใช้งาน Supplier</th>
                <th className="px-5 py-3.5">การติดต่อ</th>
                <th className="px-5 py-3.5">พาร์ทเนอร์ที่สังกัด</th>
                <th className="px-5 py-3.5">สถานที่ (Location)</th>
                <th className="px-5 py-3.5">สถานะ</th>
                <th className="px-5 py-3.5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-500" />
                    <p className="mt-2 text-xs">กำลังโหลดข้อมูลบัญชี Supplier...</p>
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Store className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 font-medium text-slate-700 text-sm">
                      {search ? "ไม่พบบัญชีที่ค้นหา" : "ยังไม่มีบัญชี Supplier"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      กดปุ่ม &quot;เพิ่มบัญชี Supplier&quot; ด้านบนเพื่อเริ่มสร้างบัญชีเข้าใช้งาน
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 font-bold text-sm">
                          {acc.name ? acc.name.charAt(0).toUpperCase() : "S"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{acc.name}</p>
                          <p className="text-[11px] text-slate-400">ID: #{acc.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{acc.email}</span>
                        </div>
                        {acc.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{acc.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {acc.partner_name ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{acc.partner_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">ไม่ได้ผูกพาร์ทเนอร์</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {acc.location_name ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                          <MapPin className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                          <span>{acc.location_name}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                          <ShieldAlert className="h-3 w-3" />
                          <span>ยังไม่มี Location</span>
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          acc.status === "ใช้งาน"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            acc.status === "ใช้งาน" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {acc.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(acc)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingAccount(acc)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200 px-2.5 text-rose-600 transition hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingAccount ? "แก้ไขบัญชี Supplier" : "เพิ่มบัญชี Supplier ใหม่"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    บัญชีนี้จะล็อกอินได้ที่หน้า /supplier/login เท่านั้น
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  ชื่อผู้ใช้งาน / ชื่อตัวแทน <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น สมศักดิ์ ตัวแทนอยุธยา"
                    className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    อีเมล (สำหรับ Login) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="supplier@partner.com"
                      className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    เบอร์โทรศัพท์
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="081-234-5678"
                      className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Partner Selection (Linked to Location) */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  พาร์ทเนอร์ที่สังกัด (เชื่อมโยง Location) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={formData.partner_id}
                    onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">-- เลือกพาร์ทเนอร์ --</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.location?.name ? `(ที่ตั้ง: ${p.location.name})` : "(ยังไม่มี Location)"}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPartnerObj && (
                  <div className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-100 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-600 shrink-0" />
                    <span className="text-slate-600">
                      สถานที่ที่เชื่อมต่อ:{" "}
                      <strong className="text-slate-800">
                        {selectedPartnerObj.location?.name || "ยังไม่มี (สามารถไปผูกได้ที่หน้าพาร์ทเนอร์)"}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {editingAccount ? "รหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)" : "รหัสผ่านเริ่มต้น *"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingAccount ? "••••••••" : "ความยาวอย่างน้อย 6 ตัวอักษร"}
                    className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-10 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">สถานะ</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ใช้งาน">ใช้งาน</option>
                  <option value="ปิดใช้งาน">ปิดใช้งาน</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {modalLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingAccount ? "บันทึกการแก้ไข" : "สร้างบัญชี"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600 mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-center text-sm font-bold text-slate-900">
              ยืนยันการลบบัญชี Supplier?
            </h3>
            <p className="mt-1 text-center text-xs text-slate-500">
              คุณต้องการลบบัญชี <span className="font-semibold text-slate-800">{deletingAccount.name}</span> ({deletingAccount.email}) ใช่หรือไม่? บัญชีนี้จะไม่สามารถเข้าสู่ระบบได้อีก
            </p>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="h-9 flex-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>ยืนยันลบ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
