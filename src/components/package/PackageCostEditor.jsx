"use client";

import { Plus, Trash2, Wallet } from "lucide-react";

const money = (value) => Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });
const satang = (value) => Math.round(Number(value || 0) * 100);
const sourceKey = (item) => item.partner_id ? `partner:${item.partner_id}` : item.location_id ? `location:${item.location_id}` : "";
const category = (name, partner = false) => {
  if (/ร้านอาหาร|ภัตตาคาร|คาเฟ่|restaurant|cafe/i.test(name || "")) return "ร้านอาหาร";
  if (/โรงแรม|ที่พัก|รีสอร์ท|hotel|resort/i.test(name || "")) return "โรงแรม/ที่พัก";
  if (/สถานที่ท่องเที่ยว|แหล่งท่องเที่ยว|attraction/i.test(name || "")) return "สถานที่ท่องเที่ยว";
  if (partner || /ร้านค้า|ของฝาก|จุดแวะ|แวะพัก|ขนส่ง|ยานพาหนะ|สถานี|สนามบิน|shopping|shop/i.test(name || "")) return null;
  return "สถานที่ท่องเที่ยว";
};

export function serializePackageCosts(data) {
  return {
    minimum_travelers: data.minimum_travelers === "" ? null : Number(data.minimum_travelers),
    cost_items: (data.cost_items || []).map((item) => ({
      location_id: item.location_id || null,
      partner_id: item.partner_id || null,
      amount_satang: satang(item.amount),
      deposit_satang: satang(item.deposit),
      paid_deposit_satang: satang(item.paid_deposit),
      paid_balance_satang: satang(item.paid_balance),
    })),
  };
}

export function hydratePackageCosts(data) {
  return {
    minimum_travelers: data.minimum_travelers ?? "",
    cost_items: (data.costItems || []).map((item) => ({
      location_id: item.location_id,
      partner_id: item.partner_id,
      supplier_name: item.supplier_name,
      amount: String(item.amount_satang / 100),
      deposit: String(item.deposit_satang / 100),
      paid_deposit: String(item.paid_deposit_satang / 100),
      paid_balance: String(item.paid_balance_satang / 100),
    })),
  };
}

export default function PackageCostEditor({ value, onChange, price, buses = [], locations = [], partners = [] }) {
  const items = value.cost_items || [];
  const capacity = buses.filter((bus) => (value.bus_ids || []).some((id) => String(id) === String(bus.id))).reduce((sum, bus) => sum + Number(bus.seat_count || 0), 0);
  const minimum = Number(value.minimum_travelers || 0);
  const chosenLocations = new Set([value.location_id, ...(value.days || []).map((day) => day.id_location || day.location_id || value.location_id)].map(String));
  const chosenPartners = new Set((value.partner_ids?.length ? value.partner_ids : value.partner_id ? [value.partner_id] : []).map(String));
  const sources = [
    ...partners.filter((partner) => chosenPartners.has(String(partner.id))).map((partner) => ({ key: `partner:${partner.id}`, name: partner.name, kind: category(partner.pt_type?.name, true) })).filter((source) => source.kind),
    ...locations.filter((location) => chosenLocations.has(String(location.id))).map((location) => ({ key: `location:${location.id}`, name: location.name, kind: category(location.lct_type?.name) })).filter((source) => source.kind),
  ];
  const unused = sources.filter((source) => !items.some((item) => sourceKey(item) === source.key));
  const paid = items.reduce((sum, item) => sum + Number(item.paid_deposit || 0) + Number(item.paid_balance || 0), 0);
  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const setItem = (index, field, fieldValue) => onChange({ ...value, cost_items: items.map((item, i) => i === index ? { ...item, [field]: fieldValue } : item) });
  const selectSource = (index, key) => onChange({ ...value, cost_items: items.map((item, i) => i === index ? { ...item, partner_id: key.startsWith("partner:") ? Number(key.slice(8)) : null, location_id: key.startsWith("location:") ? Number(key.slice(9)) : null } : item) });
  const addItem = () => {
    const key = unused[0]?.key;
    if (!key) return;
    onChange({ ...value, cost_items: [...items, { partner_id: key.startsWith("partner:") ? Number(key.slice(8)) : null, location_id: key.startsWith("location:") ? Number(key.slice(9)) : null, amount: "", deposit: "", paid_deposit: "", paid_balance: "" }] });
  };

  return (
    <section id="costs" className="scroll-mt-44 mt-8">
      <h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-slate-900"><Wallet className="h-5 w-5 text-indigo-600" />ต้นทุนและการจ่ายผู้ให้บริการ</h2>
      <p className="mb-4 text-sm text-slate-500">ผูกยอดค่าใช้จ่ายกับร้านอาหาร โรงแรม และสถานที่ท่องเที่ยวที่เลือกไว้ในแพ็กเกจ ข้อมูลนี้แสดงเฉพาะหลังบ้าน</p>
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">จำนวนขั้นต่ำที่วางแผน (คน)
            <input type="number" min="1" max={capacity || undefined} step="1" disabled={!capacity} value={value.minimum_travelers ?? ""} onChange={(e) => onChange({ ...value, minimum_travelers: e.target.value === "" ? "" : String(Math.min(capacity, Math.max(1, Math.floor(Number(e.target.value))))) })} placeholder={capacity ? `ไม่เกิน ${capacity}` : "เลือกรถบัสก่อน"} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 disabled:bg-slate-100" />
          </label>
          <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900"><span className="font-semibold">ที่นั่งจากรถบัสที่เลือก: {capacity} ที่นั่ง</span><p className="mt-1 text-xs">นับจากผังที่นั่งจริงของรถทุกคันในแพ็กเกจ</p></div>
        </div>
        {minimum > capacity && <p role="alert" className="text-sm text-rose-600">จำนวนขั้นต่ำเกิน {capacity} ที่นั่ง กรุณาปรับจำนวนหรือเลือกรถเพิ่ม</p>}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div><h3 className="font-semibold text-slate-900">ค่าใช้จ่ายตามร้าน/สถานที่</h3><p className="text-xs text-slate-500">เลือกจากพาร์ทเนอร์และจุดท่องเที่ยวที่อยู่ในแพ็กเกจเท่านั้น</p></div>
          <button type="button" disabled={!unused.length} onClick={addItem} className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-40"><Plus size={16} />เพิ่มรายการ</button>
        </div>
        {!sources.length && <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">เลือกพาร์ทเนอร์ร้านอาหาร/โรงแรม หรือจุดท่องเที่ยวในแพ็กเกจก่อน จึงจะเพิ่มรายการต้นทุนได้</p>}
        {sources.length > 0 && !items.length && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">ยังไม่ระบุต้นทุนของแพ็กเกจ</p>}
        {items.map((item, index) => {
          const itemTotal = Number(item.amount || 0);
          const itemPaid = Number(item.paid_deposit || 0) + Number(item.paid_balance || 0);
          const key = sourceKey(item);
          return <div key={index} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-end gap-2">
              <label className="flex-1 text-xs font-semibold text-slate-600">ร้าน/สถานที่ในแพ็กเกจ
                <select value={sources.some((source) => source.key === key) ? key : ""} onChange={(e) => selectSource(index, e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm">
                  <option value="" disabled>{item.supplier_name ? `${item.supplier_name} — ไม่อยู่ในแพ็กเกจแล้ว` : "เลือกสถานที่"}</option>
                  {sources.filter((source) => source.key === key || !items.some((row) => sourceKey(row) === source.key)).map((source) => <option key={source.key} value={source.key}>{source.kind} · {source.name}</option>)}
                </select>
              </label>
              <button type="button" title="ลบรายการต้นทุน" onClick={() => onChange({ ...value, cost_items: items.filter((_, i) => i !== index) })} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={17} /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">ต้นทุนรวมที่ตกลง (บาท)<input type="number" min="0.01" step="0.01" value={item.amount} onChange={(e) => setItem(index, "amount", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" /></label>
              <label className="text-xs font-semibold text-slate-600">มัดจำที่ตกลง (บาท)<input type="number" min="0" step="0.01" value={item.deposit} onChange={(e) => setItem(index, "deposit", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" /></label>
              <label className="text-xs font-semibold text-slate-600">จ่ายมัดจำแล้ว (บาท)<input type="number" min="0" step="0.01" value={item.paid_deposit} onChange={(e) => setItem(index, "paid_deposit", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" /></label>
              <label className="text-xs font-semibold text-slate-600">จ่ายหลังมัดจำแล้ว (บาท)<input type="number" min="0" step="0.01" value={item.paid_balance} onChange={(e) => setItem(index, "paid_balance", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" /></label>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3 text-sm"><span className="mr-auto">จ่ายแล้ว <strong>฿{money(itemPaid)}</strong> · เหลือจ่าย <strong>฿{money(Math.max(0, itemTotal - itemPaid))}</strong></span><button type="button" disabled={!Number(item.deposit || 0)} onClick={() => setItem(index, "paid_deposit", String(item.deposit))} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 disabled:opacity-40">บันทึกจ่ายมัดจำ</button><button type="button" disabled={!itemTotal} onClick={() => setItem(index, "paid_balance", String(Math.max(0, itemTotal - Number(item.paid_deposit || 0))))} className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-indigo-700 disabled:opacity-40">บันทึกจ่ายเต็ม</button></div>
          </div>;
        })}
        {items.length > 0 && <div className="grid gap-3 rounded-xl bg-indigo-50 p-4 text-sm sm:grid-cols-3"><div>ต้นทุนรวม<br /><strong>฿{money(total)}</strong></div><div>จ่ายแล้ว<br /><strong>฿{money(paid)}</strong></div><div>เหลือจ่าย<br /><strong>฿{money(Math.max(0, total - paid))}</strong></div></div>}
        <p className="text-xs text-slate-500">ราคาขายปัจจุบัน ฿{money(Number(String(price || 0).replace(/,/g, "")))} ต่อผู้ใหญ่ 1 คน · มัดจำเป็นส่วนหนึ่งของต้นทุนรวม</p>
      </div>
    </section>
  );
}
