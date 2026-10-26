"use client";

import { Trash2, Wallet } from "lucide-react";

const money = (value) => Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });
const satang = (value) => Math.round(Number(value || 0) * 100);
const sourceKey = (item) => item.itinerary_place ? `place:${item.itinerary_place.trim().toLocaleLowerCase()}` : item.partner_id ? `partner:${item.partner_id}` : item.location_id ? `location:${item.location_id}` : "";
const hasAmounts = (item) => ["amount", "deposit", "paid_deposit", "paid_balance"].some((field) => Number(item[field] || 0) !== 0);
const category = (name, partner = false) => {
  if (/ร้านอาหาร|ภัตตาคาร|คาเฟ่|restaurant|cafe/i.test(name || "")) return "ร้านอาหาร";
  if (/โรงแรม|ที่พัก|รีสอร์ท|hotel|resort/i.test(name || "")) return "โรงแรม/ที่พัก";
  if (/สถานที่ท่องเที่ยว|แหล่งท่องเที่ยว|attraction/i.test(name || "")) return "สถานที่ท่องเที่ยว";
  if (partner || /ร้านค้า|ของฝาก|จุดแวะ|แวะพัก|ขนส่ง|ยานพาหนะ|สถานี|สนามบิน|shopping|shop/i.test(name || "")) return null;
  return "สถานที่ท่องเที่ยว";
};

// Keep this in step with itineraryPlaceCategory in the API.
const itineraryCategory = (name, activity = "", hotel = false) => {
  const place = String(name || "").trim();
  const detail = String(activity || "");
  if (!place || /ไม่มีค้างคืน|ไม่พัก|สิ้นสุด|กลับบ้าน|^[-–—]$/i.test(place)) return null;
  if (hotel) return "โรงแรม/ที่พัก";
  if (/ออกเดินทาง|เดินทางกลับ|จุดนัดพบ|รับส่ง|เช็คเอาท์|check.out/i.test(detail)) return null;
  if (/ของฝาก|ร้านค้า|ร้านขาย|จุดแวะ|จุดพัก|ปั๊ม|ท่าเรือ|สถานี|สนามบิน|shopping|souvenir/i.test(`${place} ${detail}`)) return null;
  if (/ร้านอาหาร|ภัตตาคาร|คาเฟ่|restaurant|cafe|รับประทานอาหาร/i.test(`${place} ${detail}`)) return "ร้านอาหาร";
  if (/โรงแรม|ที่พัก|รีสอร์ท|hotel|resort/i.test(place)) return "โรงแรม/ที่พัก";
  return "สถานที่ท่องเที่ยว";
};

export function serializePackageCosts(data) {
  return {
    minimum_travelers: data.minimum_travelers === "" ? null : Number(data.minimum_travelers),
    cost_items: (data.cost_items || []).filter(hasAmounts).map((item) => ({
      location_id: item.location_id || null,
      partner_id: item.partner_id || null,
      itinerary_place: item.itinerary_place || null,
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
      itinerary_place: item.itinerary_place,
      supplier_name: item.supplier_name,
      amount: String(item.amount_satang / 100),
      deposit: String(item.deposit_satang / 100),
      paid_deposit: String(item.paid_deposit_satang / 100),
      paid_balance: String(item.paid_balance_satang / 100),
    })),
  };
}

export default function PackageCostEditor({ value, onChange, price, buses = [], locations = [], partners = [] }) {
  const savedItems = value.cost_items || [];
  const capacity = buses.filter((bus) => (value.bus_ids || []).some((id) => String(id) === String(bus.id))).reduce((sum, bus) => sum + Number(bus.seat_count || 0), 0);
  const minimum = Number(value.minimum_travelers || 0);
  const chosenLocations = new Set([value.location_id, ...(value.days || []).map((day) => day.id_location || day.location_id || value.location_id)].map(String));
  const chosenPartners = new Set((value.partner_ids?.length ? value.partner_ids : value.partner_id ? [value.partner_id] : []).map(String));
  const sources = partners.filter((partner) => chosenPartners.has(String(partner.id))).map((partner) => ({ key: `partner:${partner.id}`, name: partner.name, kind: category(partner.pt_type?.name, true), partner_id: partner.id })).filter((source) => source.kind);
  const partnerNames = new Set(sources.map((source) => String(source.name).trim().toLocaleLowerCase()));
  for (const day of value.days || []) {
    const hotel = String(day.hotel || "").trim();
    const hotelKind = itineraryCategory(hotel, "", true);
    if (hotelKind && !partnerNames.has(hotel.toLocaleLowerCase())) sources.push({ key: `place:${hotel.toLocaleLowerCase()}`, name: hotel, kind: hotelKind, itinerary_place: hotel });
    for (const activity of day.activities || []) {
      if (String(activity.status || "").toLowerCase() === "optional") continue;
      const name = String(activity.landmark || "").trim();
      const kind = itineraryCategory(name, activity.activity);
      if (kind && !partnerNames.has(name.toLocaleLowerCase())) sources.push({ key: `place:${name.toLocaleLowerCase()}`, name, kind, itinerary_place: name });
    }
  }
  if (!sources.length) sources.push(...locations.filter((location) => chosenLocations.has(String(location.id))).map((location) => ({ key: `location:${location.id}`, name: location.name, kind: category(location.lct_type?.name), location_id: location.id })).filter((source) => source.kind));
  sources.push(...locations.filter((location) => chosenLocations.has(String(location.id)) && savedItems.some((item) => String(item.location_id) === String(location.id))).map((location) => ({ key: `location:${location.id}`, name: location.name, kind: category(location.lct_type?.name), location_id: location.id })).filter((source) => source.kind));
  const uniqueSources = sources.filter((source, index) => sources.findIndex((candidate) => candidate.key === source.key) === index);
  const missingItems = savedItems.filter((item) => hasAmounts(item) && !uniqueSources.some((source) => source.key === sourceKey(item)));
  const items = [
    ...uniqueSources.map((source) => savedItems.find((item) => sourceKey(item) === source.key) || { location_id: source.location_id || null, partner_id: source.partner_id || null, itinerary_place: source.itinerary_place || null, amount: "", deposit: "", paid_deposit: "", paid_balance: "" }),
    ...missingItems,
  ];
  const paid = items.reduce((sum, item) => sum + Number(item.paid_deposit || 0) + Number(item.paid_balance || 0), 0);
  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const setItem = (index, field, fieldValue) => onChange({ ...value, cost_items: items.map((item, i) => i === index ? { ...item, [field]: fieldValue } : item) });

  return (
    <section id="costs" className="scroll-mt-44 mt-8">
      <h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-slate-900"><Wallet className="h-5 w-5 text-indigo-600" />ต้นทุนและการจ่ายผู้ให้บริการ</h2>
      <p className="mb-4 text-sm text-slate-500">กรอกต้นทุนแยกตามร้านอาหาร โรงแรม และสถานที่ท่องเที่ยวในกำหนดการ ข้อมูลนี้แสดงเฉพาะหลังบ้าน</p>
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">จำนวนขั้นต่ำที่วางแผน (คน)
            <input type="number" min="1" max={capacity || undefined} step="1" disabled={!capacity} value={value.minimum_travelers ?? ""} onChange={(e) => onChange({ ...value, minimum_travelers: e.target.value === "" ? "" : String(Math.min(capacity, Math.max(1, Math.floor(Number(e.target.value))))) })} placeholder={capacity ? `ไม่เกิน ${capacity}` : "เลือกรถบัสก่อน"} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 disabled:bg-slate-100" />
          </label>
          <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900"><span className="font-semibold">ที่นั่งจากรถบัสที่เลือก: {capacity} ที่นั่ง</span><p className="mt-1 text-xs">นับจากผังที่นั่งจริงของรถทุกคันในแพ็กเกจ</p></div>
        </div>
        {minimum > capacity && <p role="alert" className="text-sm text-rose-600">จำนวนขั้นต่ำเกิน {capacity} ที่นั่ง กรุณาปรับจำนวนหรือเลือกรถเพิ่ม</p>}
        <div className="border-t border-slate-100 pt-4"><h3 className="font-semibold text-slate-900">ค่าใช้จ่ายตามร้าน/สถานที่</h3><p className="text-xs text-slate-500">สถานที่จากกำหนดการจะแสดงทันที กรอกเฉพาะแห่งที่มีค่าใช้จ่าย แล้วกดบันทึกการแก้ไขด้านบน</p></div>
        {!items.length && <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">ยังไม่มีร้านอาหาร โรงแรม หรือสถานที่ท่องเที่ยวในกำหนดการ กรุณาเพิ่มชื่อสถานที่ในกิจกรรมของแต่ละวันก่อน</p>}
        {items.map((item, index) => {
          const itemTotal = Number(item.amount || 0);
          const itemPaid = Number(item.paid_deposit || 0) + Number(item.paid_balance || 0);
          const source = uniqueSources[index];
          return <div key={index} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between gap-2"><div><p className="font-semibold text-slate-900">{source?.name || item.supplier_name || item.itinerary_place || "สถานที่เดิม"}</p><p className={`text-xs ${source ? "text-slate-500" : "text-rose-600"}`}>{source?.kind || "ไม่อยู่ในกำหนดการแล้ว · ล้างรายการนี้หรือเพิ่มสถานที่กลับในกำหนดการ"}</p></div>{savedItems.some((saved) => sourceKey(saved) === sourceKey(item)) && <button type="button" title="ล้างต้นทุนของสถานที่นี้" onClick={() => onChange({ ...value, cost_items: items.filter((_, i) => i !== index) })} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={17} /></button>}</div>
            {source && <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">ต้นทุนรวมที่ตกลง (บาท)<input type="number" min="0.01" step="0.01" value={item.amount} onChange={(e) => setItem(index, "amount", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" /></label>
              <label className="text-xs font-semibold text-slate-600">มัดจำที่ตกลง (บาท)<input type="number" min="0" step="0.01" value={item.deposit} onChange={(e) => setItem(index, "deposit", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" /></label>
              <label className="text-xs font-semibold text-slate-600">จ่ายมัดจำแล้ว (บาท)<input type="number" min="0" step="0.01" value={item.paid_deposit} onChange={(e) => setItem(index, "paid_deposit", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" /></label>
              <label className="text-xs font-semibold text-slate-600">จ่ายหลังมัดจำแล้ว (บาท)<input type="number" min="0" step="0.01" value={item.paid_balance} onChange={(e) => setItem(index, "paid_balance", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" /></label>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3 text-sm"><span className="mr-auto">จ่ายแล้ว <strong>฿{money(itemPaid)}</strong> · เหลือจ่าย <strong>฿{money(Math.max(0, itemTotal - itemPaid))}</strong></span><button type="button" disabled={!Number(item.deposit || 0)} onClick={() => setItem(index, "paid_deposit", String(item.deposit))} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 disabled:opacity-40">กรอกจ่ายมัดจำ</button><button type="button" disabled={!itemTotal} onClick={() => setItem(index, "paid_balance", String(Math.max(0, itemTotal - Number(item.paid_deposit || 0))))} className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-indigo-700 disabled:opacity-40">กรอกจ่ายเต็ม</button></div></>}
          </div>;
        })}
        {items.some(hasAmounts) && <div className="grid gap-3 rounded-xl bg-indigo-50 p-4 text-sm sm:grid-cols-3"><div>ต้นทุนรวม<br /><strong>฿{money(total)}</strong></div><div>จ่ายแล้ว<br /><strong>฿{money(paid)}</strong></div><div>เหลือจ่าย<br /><strong>฿{money(Math.max(0, total - paid))}</strong></div></div>}
        <p className="text-xs text-slate-500">ราคาขายปัจจุบัน ฿{money(Number(String(price || 0).replace(/,/g, "")))} ต่อผู้ใหญ่ 1 คน · มัดจำเป็นส่วนหนึ่งของต้นทุนรวม</p>
      </div>
    </section>
  );
}
