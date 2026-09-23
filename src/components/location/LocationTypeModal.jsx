"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Edit2, FolderTree, Loader2, Plus, Trash2, X } from "lucide-react";

export default function LocationTypeModal({
  isOpen,
  onClose,
  locationTypes = [],
  onCreateType,
  onUpdateType,
  onDeleteType,
}) {
  const [typeName, setTypeName] = useState("");
  const [editingType, setEditingType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingType) {
      setTypeName(editingType.name || "");
    } else {
      setTypeName("");
    }
    setError("");
  }, [editingType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!typeName.trim()) {
      setError("กรุณากรอกชื่อประเภทสถานที่");
      return;
    }

    try {
      setLoading(true);
      setError("");
      if (editingType) {
        await onUpdateType(editingType.id, { name: typeName.trim() });
        setEditingType(null);
      } else {
        await onCreateType({ name: typeName.trim() });
      }
      setTypeName("");
    } catch (err) {
      console.error("Save location type error:", err);
      setError(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกประเภทสถานที่"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (type) => {
    setEditingType(type);
    setTypeName(type.name);
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingType(null);
    setTypeName("");
    setError("");
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบประเภท "${name}"?`)) return;
    try {
      setLoading(true);
      await onDeleteType(id);
    } catch (err) {
      console.error("Delete location type error:", err);
      alert(
        err.response?.data?.message ||
          "ไม่สามารถลบประเภทสถานที่ได้ อาจมีสถานที่ผูกอยู่กับประเภทนี้"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-600">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                จัดการประเภทสถานที่
              </h3>
              <p className="text-xs text-slate-500">
                เพิ่ม แก้ไข หรือลบหมวดหมู่ของสถานที่
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

        {/* Form add/edit */}
        <div className="border-b border-slate-100 bg-slate-50/70 p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <label className="block text-xs font-semibold text-slate-700">
              {editingType ? `แก้ไขประเภท: ${editingType.name}` : "เพิ่มประเภทใหม่"}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="เช่น ทะเล, ภูเขา, วัด, เกาะ, คาเฟ่"
                className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                disabled={loading}
              />
              {editingType && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex h-10 items-center gap-1.5 rounded-lg bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : editingType ? (
                  "บันทึก"
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    เพิ่ม
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* List of Types */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            รายการประเภททั้งหมด ({locationTypes.length})
          </p>

          {locationTypes.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              ยังไม่มีประเภทสถานที่ในระบบ
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {locationTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3.5 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-500">
                      {type.id}
                    </span>
                    <span className="text-sm font-medium text-slate-800">
                      {type.name}
                    </span>
                    {type.locations && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        {type.locations.length} สถานที่
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(type)}
                      className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-cyan-600"
                      title="แก้ไข"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(type.id, type.name)}
                      className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="ลบ"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
