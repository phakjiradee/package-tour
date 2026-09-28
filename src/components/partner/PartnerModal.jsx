"use client";

import { useState } from "react";
import {
  AlertCircle,
  Building2,
  Handshake,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Tag,
  X,
} from "lucide-react";

export default function PartnerModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  partnerTypes = [],
  onOpenTypeModal,
}) {
  const isEditing = Boolean(initialData);

  const [name, setName] = useState(initialData?.name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [partnerTypeId, setPartnerTypeId] = useState(
    initialData?.pt_type_id
      ? String(initialData.pt_type_id)
      : partnerTypes.length > 0
      ? String(partnerTypes[0].id)
      : ""
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("กรุณากรอกชื่อพาร์ทเนอร์");
      return;
    }

    if (!phone.trim()) {
      setError("กรุณากรอกเบอร์โทรศัพท์");
      return;
    }

    if (!email.trim()) {
      setError("กรุณากรอกอีเมล");
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    if (!partnerTypeId) {
      setError("กรุณาเลือกประเภทพาร์ทเนอร์");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim() ? address.trim() : null,
        pt_type_id: parseInt(partnerTypeId),
      });
      onClose();
    } catch (err) {
      console.error("Submit partner error:", err);
      setError(
        err.response?.data?.message ||
          "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {isEditing ? "แก้ไขข้อมูลพาร์ทเนอร์" : "เพิ่มพาร์ทเนอร์ใหม่"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "แก้ไขรายละเอียดคู่ค้า ข้อมูลติดต่อ และประเภทพาร์ทเนอร์"
                  : "กรอกข้อมูลพาร์ทเนอร์เพื่อบันทึกเข้าสู่ระบบ"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[75vh] space-y-4 overflow-y-auto px-6 py-5">
            {error && (
              <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>ชื่อพาร์ทเนอร์ / บริษัทคู่ค้า</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น โรงแรมแกรนด์พาเลซ, บจก. นอร์ทเทิร์น ทรานสปอร์ต"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100"
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Partner Type */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  <span>ประเภทพาร์ทเนอร์</span>
                  <span className="text-rose-500">*</span>
                </label>
                {onOpenTypeModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTypeModal();
                    }}
                    className="text-xs font-medium text-cyan-600 hover:underline"
                  >
                    + จัดการประเภท
                  </button>
                )}
              </div>

              {partnerTypes.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  ยังไม่มีประเภทพาร์ทเนอร์ในระบบ กรุณาเพิ่มประเภทพาร์ทเนอร์ก่อน
                </div>
              ) : (
                <select
                  value={partnerTypeId}
                  onChange={(e) => setPartnerTypeId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 transition focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  disabled={loading}
                >
                  <option value="" disabled>
                    -- เลือกประเภทพาร์ทเนอร์ --
                  </option>
                  {partnerTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Phone & Email Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>เบอร์โทรศัพท์</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812345678"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>อีเมล</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@partner.com"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>ที่อยู่ / ที่ตั้งสถานประกอบการ</span>
                <span className="text-xs font-normal text-slate-400">(ไม่บังคับ)</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100"
                disabled={loading}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex h-9.5 items-center gap-2 rounded-lg bg-slate-950 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEditing ? "บันทึกการแก้ไข" : "เพิ่มพาร์ทเนอร์"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
