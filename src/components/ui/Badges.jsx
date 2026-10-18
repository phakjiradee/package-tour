"use client";

import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building2,
  MapPin,
  User,
  HelpCircle,
} from "lucide-react";

/**
 * PositionBadge
 * - แอดมิน (Admin): bg สีน้ำเงิน (Blue)
 * - ซัพพลายเออร์ (Supplier): bg สีม่วง (Purple)
 * - ผู้ใช้งาน (User): bg สีเทา (Gray)
 * - ไกด์ (Guide): bg สีเหลืองส้ม (Yellow-Orange / Amber)
 */
export function PositionBadge({ position, className = "" }) {
  const raw = position || "";
  const pos = raw.toLowerCase().trim();

  // แอดมิน / Admin -> bg สีน้ำเงิน
  if (
    pos === "admin" ||
    pos === "แอดมิน" ||
    pos.includes("admin") ||
    pos.includes("แอดมิน")
  ) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200 shadow-2xs ${className}`}
      >
        <ShieldCheck size={12.5} className="text-blue-600 shrink-0" />
        <span>แอดมิน</span>
      </span>
    );
  }

  // sup / suppler / supplier -> bg สีม่วง
  if (
    pos === "sup" ||
    pos === "suppler" ||
    pos === "supplier" ||
    pos.includes("sup") ||
    pos.includes("ซัพ")
  ) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-800 border border-purple-200 shadow-2xs ${className}`}
      >
        <Building2 size={12.5} className="text-purple-600 shrink-0" />
        <span>ซัพพลายเออร์</span>
      </span>
    );
  }

  // ไกด์ / Guide -> bg สีเหลืองส้ม
  if (
    pos === "ไกด์" ||
    pos === "guide" ||
    pos.includes("ไกด์") ||
    pos.includes("guide")
  ) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900 border border-amber-200 shadow-2xs ${className}`}
      >
        <MapPin size={12.5} className="text-amber-600 shrink-0" />
        <span>ไกด์</span>
      </span>
    );
  }

  // user -> bg สีเทา
  if (
    pos === "user" ||
    pos === "ผู้ใช้" ||
    pos === "ลูกค้า" ||
    pos.includes("user")
  ) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs ${className}`}
      >
        <User size={12.5} className="text-slate-500 shrink-0" />
        <span>ผู้ใช้งาน</span>
      </span>
    );
  }

  // Fallback
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs ${className}`}
    >
      <User size={12.5} className="text-slate-400 shrink-0" />
      <span>{raw || "ไม่ระบุ"}</span>
    </span>
  );
}

/**
 * StatusBadge
 * - ใช้งาน: เขียว (Green)
 * - ปิดใช้งาน: แดง (Red)
 * - พักงาน: เหลือง (Yellow)
 */
export function StatusBadge({ status, className = "" }) {
  const raw = status || "";
  const st = raw.trim();
  const lower = st.toLowerCase();

  // ใช้งาน -> เขียว
  if (st === "ใช้งาน" || lower === "active") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200 shadow-2xs ${className}`}
      >
        <CheckCircle2 size={12.5} className="text-emerald-600 shrink-0" />
        <span>ใช้งาน</span>
      </span>
    );
  }

  // ปิดใช้งาน -> แดง
  if (
    st === "ปิดใช้งาน" ||
    st === "ระงับการใช้งาน" ||
    lower === "inactive" ||
    lower === "disabled"
  ) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200 shadow-2xs ${className}`}
      >
        <XCircle size={12.5} className="text-rose-600 shrink-0" />
        <span>ปิดใช้งาน</span>
      </span>
    );
  }

  // พักงาน -> เหลือง
  if (st === "พักงาน" || lower === "suspended" || lower === "on leave") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900 border border-amber-200 shadow-2xs ${className}`}
      >
        <AlertCircle size={12.5} className="text-amber-600 shrink-0" />
        <span>พักงาน</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs ${className}`}
    >
      <HelpCircle size={12.5} className="text-slate-400 shrink-0" />
      <span>ไม่ระบุ</span>
    </span>
  );
}

/**
 * BookingStatusBadge
 * Formats booking status with modern color-coded badge
 */
export function BookingStatusBadge({ status, className = "" }) {
  const s = (status || "").toUpperCase();

  if (s === "CONFIRMED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200 shadow-2xs ${className}`}
      >
        <CheckCircle2 size={12.5} className="text-emerald-600 shrink-0" />
        <span>ยืนยันการจองแล้ว</span>
      </span>
    );
  }

  if (s === "PENDING_PAYMENT") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200 shadow-2xs ${className}`}
      >
        <Clock size={12.5} className="text-amber-600 shrink-0" />
        <span>รอชำระเงิน</span>
      </span>
    );
  }

  if (s === "AWAITING_VERIFICATION") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-800 border border-sky-200 shadow-2xs ${className}`}
      >
        <Clock size={12.5} className="text-sky-600 shrink-0" />
        <span>รอตรวจสอบการชำระเงิน</span>
      </span>
    );
  }

  if (s === "CANCELLED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200 shadow-2xs ${className}`}
      >
        <XCircle size={12.5} className="text-rose-600 shrink-0" />
        <span>ยกเลิกแล้ว</span>
      </span>
    );
  }

  if (s === "COMPLETED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-800 border border-purple-200 shadow-2xs ${className}`}
      >
        <CheckCircle2 size={12.5} className="text-purple-600 shrink-0" />
        <span>เดินทางสำเร็จ</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs ${className}`}
    >
      <AlertCircle size={12.5} className="text-slate-400 shrink-0" />
      <span>{status || "-"}</span>
    </span>
  );
}
