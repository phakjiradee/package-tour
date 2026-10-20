"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import StatusChip from "@/components/backoffice/StatusChip";
import insuranceService from "@/service/insurance";

const statusLabels = {
  LEGACY: ["จองก่อนมีระบบประกัน", "neutral"],
  AWAITING_PAYMENT: ["รอชำระเงิน", "warning"],
  PENDING_ISSUANCE: ["รอบริษัทออกกรมธรรม์", "info"],
  ISSUANCE_FAILED: ["ออกกรมธรรม์ไม่สำเร็จ", "danger"],
  ACTIVE: ["คุ้มครองแล้ว", "success"],
  CANCELLATION_REQUESTED: ["รอยกเลิกกับบริษัท", "warning"],
  CANCELLED: ["ยกเลิกแล้ว", "neutral"],
};
const claimLabels = {
  REPORTED: "บันทึกเหตุ",
  SUBMITTED: "ส่งบริษัทแล้ว",
  NEED_DOCUMENTS: "รอเอกสาร",
  UNDER_REVIEW: "บริษัทกำลังพิจารณา",
  APPROVED: "บริษัทอนุมัติ",
  REJECTED: "บริษัทปฏิเสธ",
  PAID: "บริษัทจ่ายแล้ว",
  CLOSED: "ปิดเคลม",
};
const categories = {
  ACCIDENT: "อุบัติเหตุ",
  MEDICAL: "ค่ารักษาพยาบาล",
  BAGGAGE: "สัมภาระ/ของส่วนตัวเสียหายหรือสูญหาย",
  TRIP_DELAY: "การเดินทางล่าช้า",
  TRIP_CANCEL: "ยกเลิก/ลดวันเดินทาง",
  LIABILITY: "ความรับผิดต่อบุคคลภายนอก",
  OTHER: "อื่น ๆ",
};
const blankPlan = { insurer_name: "", plan_name: "", master_policy_no: "", terms_url: "", premium: "", min_age: "", max_age: "", active: false };
const localDateTime = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function InsurancePage() {
  const [plan, setPlan] = useState(blankPlan);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPlan, setShowPlan] = useState(false);
  const [claimTraveler, setClaimTraveler] = useState(null);
  const [claimForm, setClaimForm] = useState({ category: "ACCIDENT", occurred_at: localDateTime(), description: "", amount: "" });

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await insuranceService.getTravelers({ page, limit: 20, search, status });
      setRows(res.data || []);
      setTotalPages(Math.max(1, res.pagination?.totalPages || 1));
      setError("");
    } catch (err) {
      setError(err.response?.status === 401 ? "เซสชันหลังบ้านหมดอายุ กรุณาเข้าสู่ระบบใหม่" : err.response?.data?.message || "โหลดข้อมูลประกันไม่สำเร็จ");
    } finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { void Promise.resolve().then(loadRows); }, [loadRows]);
  useEffect(() => {
    insuranceService.getPlan().then(({ data }) => {
      if (data) setPlan({ ...data, premium: String(data.premium_satang / 100) });
    }).catch(() => {});
  }, []);

  const run = async (action, success) => {
    setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice(success); await loadRows(); return true; }
    catch (err) { setError(err.response?.data?.message || "ทำรายการไม่สำเร็จ"); return false; }
    finally { setBusy(false); }
  };

  const savePlan = async (event) => {
    event.preventDefault();
    await run(async () => {
      const premium_satang = Math.round(Number(plan.premium) * 100);
      const res = await insuranceService.savePlan({ ...plan, premium_satang, min_age: Number(plan.min_age), max_age: Number(plan.max_age) });
      setPlan({ ...res.data, premium: String(res.data.premium_satang / 100) });
      setShowPlan(false);
    }, "บันทึกแผนประกันแล้ว");
  };

  const downloadPending = async () => {
    setBusy(true); setError("");
    try {
      const blob = await insuranceService.downloadPending();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = "insurance-pending.csv"; anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) { setError(err.response?.data?.message || "ดาวน์โหลดรายชื่อไม่สำเร็จ"); }
    finally { setBusy(false); }
  };

  const changeEnrollment = (row, nextStatus) => {
    let data = { status: nextStatus };
    if (nextStatus === "ACTIVE") {
      const certificate_no = window.prompt("เลขรับรอง/เลขกรมธรรม์ที่บริษัทประกันยืนยันแล้ว");
      if (!certificate_no?.trim()) return;
      data.certificate_no = certificate_no.trim();
    }
    if (nextStatus === "ISSUANCE_FAILED") {
      const failure_reason = window.prompt("สาเหตุที่บริษัทออกกรมธรรม์ไม่สำเร็จ");
      if (!failure_reason?.trim()) return;
      data.failure_reason = failure_reason.trim();
    }
    run(() => insuranceService.updateEnrollment(row.insuranceEnrollment.id, data), "อัปเดตสถานะกรมธรรม์แล้ว");
  };

  const submitClaim = async (event) => {
    event.preventDefault();
    const enrollment = claimTraveler?.insuranceEnrollment;
    if (!enrollment) return;
    const saved = await run(() => insuranceService.createClaim({
      enrollment_id: enrollment.id,
      category: claimForm.category,
      occurred_at: new Date(claimForm.occurred_at).toISOString(),
      description: claimForm.description,
      claimed_amount_satang: claimForm.amount === "" ? null : Math.round(Number(claimForm.amount) * 100)
    }), "บันทึกเหตุแล้ว กรุณาส่งเอกสารและเรื่องเคลมให้บริษัทประกันตามขั้นตอนของแผน");
    if (saved) {
      setClaimTraveler(null);
      setClaimForm({ category: "ACCIDENT", occurred_at: localDateTime(), description: "", amount: "" });
    }
  };

  const changeClaim = (claim) => {
    const status = window.prompt(`สถานะจากบริษัทประกัน: ${Object.keys(claimLabels).join(", ")}`, claim.status);
    if (!status || !claimLabels[status]) return;
    const insurer_claim_no = window.prompt("เลขเคลมจากบริษัทประกัน (หากมี)", claim.insurer_claim_no || "");
    if (insurer_claim_no === null) return;
    const insurer_note = window.prompt("หมายเหตุ/ผลที่บริษัทแจ้ง", claim.insurer_note || "");
    if (insurer_note === null) return;
    run(() => insuranceService.updateClaim(claim.id, { status, insurer_claim_no, insurer_note }), "อัปเดตผลเคลมแล้ว");
  };

  return <div className="mx-auto max-w-7xl">
    <PageHeader title="ประกันการเดินทาง" description="รายชื่อผู้เดินทาง สถานะกรมธรรม์ และเหตุเคลมรายคน" actions={<>
      <button type="button" onClick={downloadPending} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold hover:bg-zinc-50 disabled:opacity-50"><Download size={15} /> ส่งออกรายชื่อรอออกกรมธรรม์</button>
      <button type="button" onClick={() => setShowPlan(!showPlan)} className="h-9 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">ตั้งค่าแผนประกัน</button>
    </>} />

    <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
      <div className="flex items-center gap-2 font-semibold"><ShieldCheck size={17} /> {plan.active ? `${plan.insurer_name} · ${plan.plan_name}` : "ยังไม่เปิดแผนประกัน"}</div>
      <p className="mt-1 text-xs">{plan.active ? `เบี้ย ฿${plan.premium} ต่อผู้เดินทาง · อายุ ${plan.min_age}–${plan.max_age} ปี` : "การจองใหม่จะยังทำไม่ได้จนกว่าจะตั้งค่าและเปิดแผนจากบริษัทประกันจริง"} การบันทึกเคลมในหน้านี้เป็นการแจ้งเหตุภายใน Zentura ต้องส่งเรื่องและหลักฐานให้บริษัทประกันแยกต่างหาก</p>
    </div>

    {showPlan && <form onSubmit={savePlan} className="mb-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">แผนที่ใช้กับการจองใหม่ทุกคน</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[["insurer_name", "บริษัทประกัน"], ["plan_name", "ชื่อแผน"], ["master_policy_no", "เลขกรมธรรม์กลุ่ม/อ้างอิง"], ["premium", "เบี้ยต่อคน (บาท)"], ["min_age", "อายุต่ำสุด"], ["max_age", "อายุสูงสุด"], ["terms_url", "ลิงก์เงื่อนไข HTTPS"]].map(([key, label]) => <label key={key} className={key === "terms_url" ? "sm:col-span-2" : ""}>
          <span className="mb-1 block text-xs font-medium text-zinc-600">{label}</span>
          <input required={key !== "master_policy_no"} type={["premium", "min_age", "max_age"].includes(key) ? "number" : "text"} min={key === "premium" ? "0.01" : "0"} step={key === "premium" ? "0.01" : "1"} value={plan[key] ?? ""} onChange={(e) => setPlan({ ...plan, [key]: e.target.value })} className="h-9 w-full rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-blue-500" />
        </label>)}
      </div>
      <label className="mt-4 flex items-center gap-2 text-xs text-zinc-700"><input type="checkbox" checked={Boolean(plan.active)} onChange={(e) => setPlan({ ...plan, active: e.target.checked })} /> เปิดรับจองเมื่อยืนยันแผนและช่องทางส่งรายชื่อกับบริษัทประกันแล้ว</label>
      <button disabled={busy} className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">บันทึกแผน</button>
    </form>}

    {error && <p role="alert" className="mb-4 rounded-md bg-rose-50 p-3 text-xs text-rose-700">{error} {error.includes("เข้าสู่ระบบ") && <Link href="/backoffice/login" className="underline">เข้าสู่ระบบ</Link>}</p>}
    {notice && <p role="status" className="mb-4 rounded-md bg-emerald-50 p-3 text-xs text-emerald-700">{notice}</p>}

    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 p-4">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); loadRows(); }} className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-zinc-200 px-3"><Search size={16} className="text-zinc-400" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="ค้นหาชื่อ เลขจอง หรือแพ็กเกจ" className="h-9 w-full text-sm outline-none" /></form>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-xs">
          <option value="ALL">ทุกสถานะ</option>{Object.entries(statusLabels).map(([key, [label]]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <button type="button" onClick={loadRows} aria-label="รีเฟรช" className="rounded-md border border-zinc-200 p-2 text-zinc-600"><RefreshCw size={17} /></button>
      </div>
      {loading ? <p className="p-8 text-center text-sm text-zinc-500">กำลังโหลดข้อมูล...</p> : rows.length === 0 ? <p className="p-8 text-center text-sm text-zinc-500">ไม่พบผู้เดินทาง</p> : <div className="divide-y divide-zinc-100">
        {rows.map((row) => {
          const coverage = row.insuranceEnrollment;
          const [label, tone] = statusLabels[coverage?.status || "LEGACY"] || statusLabels.LEGACY;
          return <div key={row.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-zinc-900">{row.full_name}</strong><StatusChip label={label} tone={tone} /></div>
                <p className="mt-1 text-xs text-zinc-500">{row.booking.booking_code} · {row.booking.package?.name} · {row.passenger_type === "child" ? "เด็ก" : "ผู้ใหญ่"}</p>
                <p className="mt-1 text-xs text-zinc-500">{coverage ? `${coverage.insurer_name} · ${coverage.plan_name} · เลขรับรอง ${coverage.certificate_no || "ยังไม่มี"}` : "การจองเดิม ไม่มีรายการประกันในระบบ"}</p>
                {coverage?.failure_reason && <p className="mt-1 text-xs text-rose-700">สาเหตุ: {coverage.failure_reason}</p>}
                {coverage?.events?.length > 0 && <details className="mt-1 text-[11px] text-zinc-500"><summary className="cursor-pointer">ประวัติกรมธรรม์</summary>{coverage.events.map((event) => <p key={event.id} className="ml-3 border-l border-zinc-200 pl-2">{new Date(event.createdAt).toLocaleString("th-TH")} · {event.action} {event.detail || ""}</p>)}</details>}
              </div>
              <div className="flex flex-wrap gap-2">
                {coverage?.status === "PENDING_ISSUANCE" && row.booking.payments.length > 0 && <><button disabled={busy} onClick={() => changeEnrollment(row, "ACTIVE")} className="rounded-md border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700">บันทึกเลขกรมธรรม์</button><button disabled={busy} onClick={() => changeEnrollment(row, "ISSUANCE_FAILED")} className="rounded-md border border-rose-200 px-3 py-1.5 text-xs text-rose-700">ออกไม่สำเร็จ</button></>}
                {coverage?.status === "ISSUANCE_FAILED" && <button disabled={busy} onClick={() => changeEnrollment(row, "PENDING_ISSUANCE")} className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs">ส่งออกใหม่</button>}
                {coverage?.status === "ACTIVE" && <button disabled={busy} onClick={() => { setClaimTraveler(row); setClaimForm({ category: "ACCIDENT", occurred_at: localDateTime(), description: "", amount: "" }); }} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">แจ้งเหตุ / เปิดเคลม</button>}
                {coverage?.status === "CANCELLATION_REQUESTED" && <button disabled={busy} onClick={() => changeEnrollment(row, "CANCELLED")} className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs">ยืนยันบริษัทรับยกเลิก</button>}
              </div>
            </div>
            {coverage?.claims?.length > 0 && <div className="mt-3 space-y-1 border-t border-zinc-100 pt-3">
              {coverage.claims.map((claim) => <div key={claim.id} className="text-xs text-zinc-600"><div className="flex flex-wrap items-center justify-between gap-2"><span>{categories[claim.category] || claim.category} · {claimLabels[claim.status] || claim.status} {claim.insurer_claim_no ? `· เลขเคลม ${claim.insurer_claim_no}` : ""}</span><button disabled={busy} onClick={() => changeClaim(claim)} className="font-semibold text-blue-600 underline">บันทึกผลจากบริษัท</button></div>{claim.events?.length > 0 && <details className="mt-1 text-[11px]"><summary className="cursor-pointer">ประวัติรายการ</summary>{claim.events.map((event) => <p key={event.id} className="ml-3 border-l border-zinc-200 pl-2">{new Date(event.createdAt).toLocaleString("th-TH")} · {event.action} {event.detail || ""}</p>)}</details>}</div>)}
            </div>}
          </div>;
        })}
      </div>}
      <div className="flex items-center justify-between border-t border-zinc-200 p-4 text-xs text-zinc-500"><span>หน้า {page} / {totalPages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">ก่อนหน้า</button><button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">ถัดไป</button></div></div>
    </div>

    {claimTraveler && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setClaimTraveler(null); }}>
      <form onSubmit={submitClaim} role="dialog" aria-modal="true" aria-label="แจ้งเหตุประกัน" className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">แจ้งเหตุ: {claimTraveler.full_name}</h2><button type="button" onClick={() => setClaimTraveler(null)} aria-label="ปิด"><X size={18} /></button></div>
        <p className="mb-4 rounded-md bg-amber-50 p-3 text-xs text-amber-800">บันทึกเหตุภายในระบบเท่านั้น การอนุมัติและจ่ายสินไหมขึ้นกับบริษัทประกันตามเงื่อนไขกรมธรรม์</p>
        <div className="space-y-3">
          <label className="block text-xs">ประเภทเหตุ<select value={claimForm.category} onChange={(e) => setClaimForm({ ...claimForm, category: e.target.value })} className="mt-1 h-10 w-full rounded-md border px-3">{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="block text-xs">วันและเวลาเกิดเหตุ<input required type="datetime-local" max={localDateTime()} value={claimForm.occurred_at} onChange={(e) => setClaimForm({ ...claimForm, occurred_at: e.target.value })} className="mt-1 h-10 w-full rounded-md border px-3" /></label>
          <label className="block text-xs">มูลค่าความเสียหายโดยประมาณ (บาท ถ้ามี)<input type="number" min="0" step="0.01" value={claimForm.amount} onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })} className="mt-1 h-10 w-full rounded-md border px-3" /></label>
          <label className="block text-xs">รายละเอียดเหตุการณ์<textarea required minLength={10} rows={4} value={claimForm.description} onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })} className="mt-1 w-full rounded-md border p-3" /></label>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setClaimTraveler(null)} className="rounded-md border px-4 py-2 text-xs">ยกเลิก</button><button disabled={busy} className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">บันทึกเหตุ</button></div>
      </form>
    </div>}
  </div>;
}
