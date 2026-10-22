"use client";

import { Plus, Trash2, Wallet } from "lucide-react";

const CATEGORIES = [
  ["FOOD", "ร้านอาหาร"], ["LOCATION", "สถานที่"], ["TRANSPORT", "รถ/เดินทาง"],
  ["GUIDE", "ไกด์"], ["HOTEL", "ที่พัก"], ["OTHER", "อื่น ๆ"],
];

const money = (value) => Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });
const satang = (value) => Math.round(Number(value || 0) * 100);

export function serializePackageCosts(data) {
  return {
    target_travelers: data.target_travelers === "" ? null : Number(data.target_travelers),
    minimum_travelers: data.minimum_travelers === "" ? null : Number(data.minimum_travelers),
    cost_items: (data.cost_items || []).map((item) => ({
      category: item.category,
      supplier_name: item.supplier_name,
      pricing_mode: item.pricing_mode,
      amount_satang: satang(item.amount),
      deposit_satang: satang(item.deposit),
      paid_deposit_satang: satang(item.paid_deposit),
      paid_balance_satang: satang(item.paid_balance),
    })),
  };
}

export function hydratePackageCosts(data) {
  return {
    target_travelers: data.target_travelers ?? "",
    minimum_travelers: data.minimum_travelers ?? "",
    cost_items: (data.costItems || []).map((item) => ({
      category: item.category,
      supplier_name: item.supplier_name,
      pricing_mode: item.pricing_mode,
      amount: String(item.amount_satang / 100),
      deposit: String(item.deposit_satang / 100),
      paid_deposit: String(item.paid_deposit_satang / 100),
      paid_balance: String(item.paid_balance_satang / 100),
    })),
  };
}

export default function PackageCostEditor({ value, onChange, price }) {
  const items = value.cost_items || [];
  const target = Number(value.target_travelers || 0);
  const minimum = Number(value.minimum_travelers || 0);
  const costAt = (people) => items.reduce((sum, item) => sum + Number(item.amount || 0) * (item.pricing_mode === "PER_PERSON" ? people : 1), 0);
  const paid = items.reduce((sum, item) => sum + Number(item.paid_deposit || 0) + Number(item.paid_balance || 0), 0);
  const setField = (field, fieldValue) => onChange({ ...value, [field]: fieldValue });
  const setItem = (index, field, fieldValue) => onChange({ ...value, cost_items: items.map((item, i) => i === index ? { ...item, [field]: fieldValue } : item) });

  return (
    <section id="costs" className="scroll-mt-44 mt-8">
      <h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-slate-900"><Wallet className="h-5 w-5 text-indigo-600" />ต้นทุนและการจ่ายผู้ให้บริการ</h2>
      <p className="mb-4 text-sm text-slate-500">ใช้วางแผนจุดคุ้มทุนของแพ็กเกจนี้ ข้อมูลนี้แสดงเฉพาะหลังบ้าน</p>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">จำนวนขั้นต่ำที่วางแผน (คน)
            <input type="number" min="1" max="10000" value={value.minimum_travelers ?? ""} onChange={(e) => setField("minimum_travelers", e.target.value)} placeholder="เช่น 10" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" />
          </label>
          <label className="text-sm font-medium text-slate-700">จำนวนที่รองรับ/เป้าหมาย (คน)
            <input type="number" min="1" max="10000" value={value.target_travelers ?? ""} onChange={(e) => setField("target_travelers", e.target.value)} placeholder="เช่น 20" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" />
          </label>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div><h3 className="font-semibold text-slate-900">รายการต้นทุน</h3><p className="text-xs text-slate-500">เหมาจ่ายคิดครั้งเดียว · ต่อคนคูณจำนวนผู้เดินทาง</p></div>
          <button type="button" onClick={() => onChange({ ...value, cost_items: [...items, { category: "FOOD", supplier_name: "", pricing_mode: "FIXED", amount: "", deposit: "", paid_deposit: "", paid_balance: "" }] })} className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700"><Plus size={16} />เพิ่มต้นทุน</button>
        </div>
        {items.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">ยังไม่ระบุต้นทุน ระบบจะแสดงว่า “ยังไม่ตั้งต้นทุน” ในหน้าการจอง</p>}
        {items.map((item, index) => {
          const total = Number(item.amount || 0) * (item.pricing_mode === "PER_PERSON" ? target : 1);
          const itemPaid = Number(item.paid_deposit || 0) + Number(item.paid_balance || 0);
          return <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">ประเภท
                <select value={item.category} onChange={(e) => setItem(index, "category", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm">{CATEGORIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select>
              </label>
              <label className="text-xs font-semibold text-slate-600">ชื่อร้าน/สถานที่/ผู้ให้บริการ
                <input value={item.supplier_name} onChange={(e) => setItem(index, "supplier_name", e.target.value)} placeholder="เช่น ร้านอาหารริมน้ำ" className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-600">รูปแบบต้นทุน
                <select value={item.pricing_mode} onChange={(e) => setItem(index, "pricing_mode", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"><option value="FIXED">เหมาจ่าย</option><option value="PER_PERSON">ต่อผู้เดินทาง 1 คน</option></select>
              </label>
              <label className="text-xs font-semibold text-slate-600">ต้นทุน {item.pricing_mode === "PER_PERSON" ? "ต่อคน" : "รวม"} (บาท)
                <input type="number" min="0" step="0.01" value={item.amount} onChange={(e) => setItem(index, "amount", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-600">มัดจำที่ตกลง (บาท)
                <input type="number" min="0" step="0.01" value={item.deposit} onChange={(e) => setItem(index, "deposit", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-600">จ่ายมัดจำแล้ว (บาท)
                <input type="number" min="0" step="0.01" value={item.paid_deposit} onChange={(e) => setItem(index, "paid_deposit", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-600">จ่ายส่วนที่เหลือแล้ว (บาท)
                <input type="number" min="0" step="0.01" value={item.paid_balance} onChange={(e) => setItem(index, "paid_balance", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" />
              </label>
              <div className="flex items-end justify-between gap-2 text-sm"><span>ต้นทุนที่เป้าหมาย ฿{money(total)}<br /><span className="text-slate-500">จ่ายแล้ว ฿{money(itemPaid)} · คงเหลือ ฿{money(Math.max(0, total - itemPaid))}</span></span><button type="button" title="ลบรายการต้นทุน" onClick={() => onChange({ ...value, cost_items: items.filter((_, i) => i !== index) })} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={17} /></button></div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 text-xs"><span className={`mr-auto font-semibold ${itemPaid >= total && total > 0 ? "text-emerald-700" : itemPaid > 0 ? "text-amber-700" : "text-slate-500"}`}>{itemPaid >= total && total > 0 ? "จ่ายครบแล้ว" : itemPaid > 0 ? "จ่ายบางส่วนแล้ว" : "ยังไม่จ่าย"}</span><button type="button" disabled={!Number(item.deposit || 0)} onClick={() => onChange({ ...value, cost_items: items.map((row, i) => i === index ? { ...row, paid_deposit: item.deposit, paid_balance: String(Math.min(Number(row.paid_balance || 0), Math.max(0, total - Number(item.deposit)))) } : row) })} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 disabled:opacity-40">บันทึกจ่ายมัดจำ</button><button type="button" disabled={!total} onClick={() => setItem(index, "paid_balance", String(Math.max(0, total - Number(item.paid_deposit || 0))))} className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-indigo-700 disabled:opacity-40">บันทึกจ่ายเต็ม</button></div>
          </div>;
        })}
        {items.length > 0 && <div className="grid gap-3 rounded-xl bg-indigo-50 p-4 text-sm sm:grid-cols-3"><div>ต้นทุนที่ {minimum || "-"} คน<br /><strong>฿{money(costAt(minimum))}</strong></div><div>ต้นทุนที่ {target || "-"} คน<br /><strong>฿{money(costAt(target))}</strong></div><div>จ่ายผู้ให้บริการแล้ว<br /><strong>฿{money(paid)}</strong></div></div>}
        <p className="text-xs text-slate-500">ราคาขายปัจจุบัน ฿{money(Number(String(price || 0).replace(/,/g, "")))} ต่อผู้ใหญ่ 1 คน · ยอดมัดจำเป็นส่วนหนึ่งของต้นทุน ไม่บวกซ้ำ</p>
      </div>
    </section>
  );
}
