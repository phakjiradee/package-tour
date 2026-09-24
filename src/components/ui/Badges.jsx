"use client";

/**
 * PositionBadge
 * User specification:
 * - แอดมิน (Admin): bg สีน้ำเงิน (Blue)
 * - sup (suppler): bg สีม่วง (Purple)
 * - user: bg สีเทา (Gray)
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
        className={`inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-300 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
        {raw || "Admin"}
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
        className={`inline-flex items-center gap-1.5 rounded-md bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-800 ring-1 ring-inset ring-purple-300 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-purple-600"></span>
        {raw || "suppler"}
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
        className={`inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-inset ring-amber-400 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        {raw || "ไกด์"}
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
        className={`inline-flex items-center gap-1.5 rounded-md bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
        {raw || "user"}
      </span>
    );
  }

  // Fallback
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
      {raw || "-"}
    </span>
  );
}

/**
 * StatusBadge
 * User specification:
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
        className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-300 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        {raw || "ใช้งาน"}
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
        className={`inline-flex items-center gap-1.5 rounded-md bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-300 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
        {raw || "ปิดใช้งาน"}
      </span>
    );
  }

  // พักงาน -> เหลือง
  if (st === "พักงาน" || lower === "suspended" || lower === "on leave") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-900 ring-1 ring-inset ring-yellow-400 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
        {raw || "พักงาน"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
      {raw || "ไม่ระบุ"}
    </span>
  );
}
