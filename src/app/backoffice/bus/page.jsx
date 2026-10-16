"use client";

import { useCallback, useEffect, useState } from "react";
import { Bus, Edit3, Trash2, X } from "lucide-react";
import { busService } from "@/service/bus";
import SeatMap from "@/components/bus/SeatMap";
import SeatEditor, { DEFAULT_LAYOUT } from "@/components/bus/SeatEditor";

const STATUS = {
  ACTIVE: { label: "ใช้งาน", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PAUSED: { label: "หยุดใช้ชั่วคราว", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  BROKEN: { label: "รถเสีย", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

const EMPTY = { name: "", plate: "", layout: DEFAULT_LAYOUT, status: "ACTIVE", note: "" };

export default function BackofficeBusPage() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null = ปิด modal
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setBuses(await busService.getAll());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  };

  // ปุ่ม "เพิ่มรถ" อยู่ที่ BackofficeNavbar ส่ง event มาทาง window
  useEffect(() => {
    window.addEventListener("bus:create", openCreate);
    return () => window.removeEventListener("bus:create", openCreate);
  }, []);

  const openEdit = (b) => {
    setEditingId(b.id);
    setForm({ ...b, plate: b.plate || "", note: b.note || "" });
    setError("");
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) await busService.update(editingId, form);
      else await busService.create(form);
      setForm(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (b) => {
    if (!confirm(`ลบ "${b.name}" ?`)) return;
    try {
      await busService.delete(b.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "ลบไม่สำเร็จ");
    }
  };

  const input =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500";

  return (
    <div className="space-y-6">
      {loading ? (
        <p className="py-12 text-center text-sm text-slate-400">กำลังโหลด...</p>
      ) : buses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
          <Bus className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm">ยังไม่มีรถ กด "เพิ่มรถ" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-4">
          {buses.map((b) => (
            <div key={b.id} className="w-fit min-w-64 max-w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-950">{b.name}</p>
                  <p className="text-xs text-slate-500">
                    {b.plate || "ไม่ระบุทะเบียน"} · {b.seat_count} ที่นั่ง{b.layout.decks.length > 1 ? ` · ${b.layout.decks.length} ชั้น` : ""}
                  </p>
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS[b.status]?.cls}`}>
                  {STATUS[b.status]?.label}
                </span>
              </div>
              {b.note && <p className="mt-2 text-xs text-slate-500">หมายเหตุ: {b.note}</p>}
              <div className="mt-3 overflow-x-auto">
                <SeatMap layout={b.layout} compact />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => openEdit(b)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Edit3 className="h-3.5 w-3.5" /> แก้ไข
                </button>
                <button type="button" onClick={() => remove(b)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                  <Trash2 className="h-3.5 w-3.5" /> ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4">
          <form onSubmit={save} className="w-fit min-w-[34rem] max-w-full rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingId ? "แก้ไขรถ" : "เพิ่มรถ"}</h2>
              <button type="button" onClick={() => setForm(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid gap-6 md:grid-cols-[14rem_auto]">
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-600">
                  ชื่อรถ
                  <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="บัส 1" required />
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  ทะเบียน
                  <input className={input} value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  สถานะ
                  <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {Object.entries(STATUS).map(([v, s]) => (
                      <option key={v} value={v}>{s.label}</option>
                    ))}
                  </select>
                </label>
                {form.status !== "ACTIVE" && (
                  <label className="block text-xs font-semibold text-slate-600">
                    เหตุผล / หมายเหตุ
                    <input className={input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="เช่น เครื่องยนต์เสีย เข้าอู่" />
                  </label>
                )}
              </div>

              <div className="overflow-auto">
                <p className="mb-2 text-xs font-semibold text-slate-600">ผังที่นั่ง</p>
                <SeatEditor layout={form.layout} onChange={(layout) => setForm({ ...form, layout })} />
              </div>
            </div>

            {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setForm(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                ยกเลิก
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
