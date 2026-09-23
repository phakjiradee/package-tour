"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, MapPin, X } from "lucide-react";

export default function LocationModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  locationTypes = [],
  onOpenTypeModal,
}) {
  const [name, setName] = useState("");
  const [locationTypeId, setLocationTypeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setLocationTypeId(initialData.lct_type_id ? String(initialData.lct_type_id) : "");
    } else {
      setName("");
      setLocationTypeId(locationTypes.length > 0 ? String(locationTypes[0].id) : "");
    }
    setError("");
  }, [initialData, locationTypes, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("กรุณากรอกชื่อสถานที่");
      return;
    }

    if (!locationTypeId) {
      setError("กรุณาเลือกประเภทสถานที่");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onSubmit({
        name: name.trim(),
        lct_type_id: parseInt(locationTypeId),
      });
      onClose();
    } catch (err) {
      console.error("Submit location error:", err);
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
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {isEditing ? "แก้ไขสถานที่" : "เพิ่มสถานที่ใหม่"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "แก้ไขรายละเอียดสถานที่และประเภท"
                  : "กรอกข้อมูลสถานที่เพื่อบันทึกเข้าสู่ระบบ"}
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
          <div className="space-y-4 px-6 py-5">
            {error && (
              <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                ชื่อสถานที่ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น วัดพระแก้ว, เกาะพีพี, ดอยอินทนนท์"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100"
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  ประเภทสถานที่ <span className="text-rose-500">*</span>
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

              {locationTypes.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  ยังไม่มีประเภทสถานที่ในระบบ กรุณาเพิ่มประเภทสถานที่ก่อน
                </div>
              ) : (
                <select
                  value={locationTypeId}
                  onChange={(e) => setLocationTypeId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 transition focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  disabled={loading}
                >
                  <option value="" disabled>
                    -- เลือกประเภทสถานที่ --
                  </option>
                  {locationTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              )}
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
              {isEditing ? "บันทึกการแก้ไข" : "เพิ่มสถานที่"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
