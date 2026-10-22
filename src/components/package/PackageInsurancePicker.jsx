"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ShieldCheck } from "lucide-react";
import insuranceService from "@/service/insurance";

export default function PackageInsurancePicker({ selected, onChange }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const result = await insuranceService.getPlans();
      setPlans(result.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "โหลดแผนประกันไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(loadPlans); }, [loadPlans]);

  const plan = plans.find((item) => item.id === Number(selected));

  return (
    <section id="insurance" className="scroll-mt-44">
      <div className="mb-4 mt-8">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <ShieldCheck className="h-5 w-5 text-indigo-600" /> ประกันการเดินทาง
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">เลือกหนึ่งแผนต่อแพ็กเกจ ลูกค้าจะเลือกซื้อในหน้าจอง และคิดเบี้ยตามจำนวนผู้เดินทางเมื่อเลือกซื้อ</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[240px] flex-1 text-sm font-semibold text-slate-700">
            แผนประกันของแพ็กเกจ
            <select value={selected ?? ""} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)} disabled={loading} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-indigo-500 disabled:opacity-60">
              <option value="">{loading ? "กำลังโหลดแผนประกัน..." : "เลือกแผนประกัน"}</option>
              {plans.map((item) => <option key={item.id} value={item.id}>{item.plan_name} · {item.insurer_name}{item.is_demo ? " (ตัวอย่าง)" : item.active ? " (เปิดใช้งาน)" : " (ยังไม่เปิดใช้งาน)"}</option>)}
            </select>
          </label>
          <button type="button" onClick={loadPlans} aria-label="รีเฟรชแผนประกัน" className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"><RefreshCw size={17} /></button>
          <Link href="/backoffice/insurance" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-indigo-200 px-3 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">จัดการแผนประกัน</Link>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
        {!loading && plans.length === 0 && !error && <p className="mt-3 text-sm text-amber-700">ยังไม่มีแผนประกัน กรุณาสร้างแผนในหน้าประกันการเดินทางก่อน</p>}
        {!loading && plans.length > 0 && !selected && <p className="mt-3 text-sm text-amber-700">กรุณาเลือกหนึ่งแผนก่อนบันทึกแพ็กเกจ ลูกค้าจะซื้อประกันไม่ได้จนกว่าจะมีแผนจริงที่เปิดใช้งาน</p>}
        {plan && <div className={`mt-4 rounded-xl border p-4 text-sm ${plan.active && !plan.is_demo ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
          <p className="font-semibold">{plan.insurer_name} · {plan.plan_name}</p>
          <p className="mt-1">เบี้ย ฿{(plan.premium_satang / 100).toLocaleString("th-TH")} ต่อคน · อายุที่รับ {plan.min_age}–{plan.max_age} ปี</p>
          {plan.is_demo ? <p className="mt-2">แผนตัวอย่างสำหรับเตรียมระบบ ยังไม่ใช่กรมธรรม์จริงและลูกค้ายังเลือกซื้อไม่ได้</p> : !plan.active ? <p className="mt-2">แผนนี้ยังไม่เปิดใช้งาน ลูกค้ายังเลือกซื้อประกันไม่ได้จนกว่าแผนจะพร้อม</p> : <a href={plan.terms_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold underline">อ่านเงื่อนไขกรมธรรม์</a>}
        </div>}
      </div>
    </section>
  );
}
