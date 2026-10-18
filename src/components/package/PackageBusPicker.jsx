"use client";

import { Bus } from "lucide-react";

export default function PackageBusPicker({ buses, selected, onChange }) {
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);

  return (
    <section id="buses" className="scroll-mt-44">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Bus className="h-5 w-5 text-indigo-600" /> รถบัสประจำแพ็กเกจ
        </h2>
        <p className="mt-1 text-sm text-slate-500">เลือกรถได้หลายคัน แอดมินจะจัดที่นั่งให้ผู้โดยสารหลังชำระเงิน</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {buses.length === 0 ? (
          <p className="text-sm text-slate-500">ยังไม่มีรถบัสในระบบ เพิ่มรถที่หน้ารถบัสก่อน</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {buses.map((bus) => {
              const checked = selected.includes(bus.id);
              const disabled = bus.status !== "ACTIVE" && !checked;
              return (
                <label key={bus.id} className={`flex items-center gap-3 rounded-xl border p-4 ${checked ? "border-indigo-400 bg-indigo-50" : "border-slate-200"} ${disabled ? "opacity-50" : "cursor-pointer hover:border-indigo-300"}`}>
                  <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(bus.id)} className="accent-indigo-600" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{bus.name}</p>
                    <p className="text-xs text-slate-500">{bus.plate || "ไม่ระบุทะเบียน"} · {bus.seat_count} ที่นั่ง</p>
                  </div>
                  <span className="text-xs text-slate-500">{bus.status === "ACTIVE" ? "ใช้งาน" : "หยุดใช้"}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
