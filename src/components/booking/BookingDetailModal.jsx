"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  PackageCheck,
  Phone,
  ShieldCheck,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { BookingStatusBadge } from "@/components/ui/Badges";

export default function BookingDetailModal({
  booking,
  isOpen,
  onClose,
  onUpdateStatus,
  updating = false,
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  if (!isOpen || !booking) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(booking.booking_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (val) => {
    return Number(val || 0).toLocaleString("th-TH");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100 text-cyan-700">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  รหัสการจอง: {booking.booking_code}
                </h2>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-200 transition"
                  title="คัดลอกรหัส"
                >
                  {copiedCode ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedCode ? "คัดลอกแล้ว" : "คัดลอก"}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                ทำรายการเมื่อ {formatDateTime(booking.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BookingStatusBadge status={booking.status} />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick status change bar */}
          <div className="rounded-xl border border-cyan-100 bg-gradient-to-r from-cyan-50/50 via-sky-50/40 to-slate-50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  ปรับปรุงสถานะการจอง (Admin Action)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  เลือกเปลี่ยนสถานะเพื่อแจ้งลูกค้าและบันทึกในระบบ
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={updating || booking.status === "CONFIRMED"}
                  onClick={() => onUpdateStatus(booking.id, "CONFIRMED")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                    booking.status === "CONFIRMED"
                      ? "bg-emerald-100 text-emerald-800 cursor-default ring-1 ring-emerald-300"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  ยืนยันการจอง
                </button>

                <button
                  type="button"
                  disabled={updating || booking.status === "AWAITING_VERIFICATION"}
                  onClick={() => onUpdateStatus(booking.id, "AWAITING_VERIFICATION")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                    booking.status === "AWAITING_VERIFICATION"
                      ? "bg-sky-100 text-sky-800 cursor-default ring-1 ring-sky-300"
                      : "bg-sky-600 text-white hover:bg-sky-700 active:scale-95 disabled:opacity-50"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  รอตรวจสอบ
                </button>

                <button
                  type="button"
                  disabled={updating || booking.status === "PENDING_PAYMENT"}
                  onClick={() => onUpdateStatus(booking.id, "PENDING_PAYMENT")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                    booking.status === "PENDING_PAYMENT"
                      ? "bg-amber-100 text-amber-800 cursor-default ring-1 ring-amber-300"
                      : "bg-amber-600 text-white hover:bg-amber-700 active:scale-95 disabled:opacity-50"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  รอชำระเงิน
                </button>

                <button
                  type="button"
                  disabled={updating || booking.status === "CANCELLED"}
                  onClick={() => {
                    if (confirm(`คุณต้องการยกเลิกการจองรหัส ${booking.booking_code} หรือไม่?`)) {
                      onUpdateStatus(booking.id, "CANCELLED");
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                    booking.status === "CANCELLED"
                      ? "bg-rose-100 text-rose-800 cursor-default ring-1 ring-rose-300"
                      : "bg-rose-600 text-white hover:bg-rose-700 active:scale-95 disabled:opacity-50"
                  }`}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  ยกเลิกการจอง
                </button>
              </div>
            </div>
          </div>

          {/* Grid: Package & Customer Info */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Package details */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                <MapPin className="h-4 w-4 text-cyan-600" />
                ข้อมูลแพ็กเกจทัวร์
              </h3>
              <div className="mt-4 flex gap-4">
                {booking.package?.image ? (
                  <img
                    src={booking.package.image}
                    alt={booking.package.name}
                    className="h-20 w-24 shrink-0 rounded-lg object-cover border border-slate-100"
                  />
                ) : (
                  <div className="grid h-20 w-24 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400">
                    <MapPin className="h-8 w-8" />
                  </div>
                )}
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900 text-base line-clamp-2">
                    {booking.package?.name || `Package ID: ${booking.package_id}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    รหัสแพ็กเกจ: #{booking.package_id}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-700">
                    <Calendar className="h-3.5 w-3.5" />
                    วันที่เดินทาง: {formatDate(booking.travel_date)}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
                <div>
                  <span className="text-slate-500">ผู้ใหญ่:</span>
                  <span className="ml-1.5 font-bold text-slate-800">
                    {booking.adult_count} ท่าน
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">เด็ก:</span>
                  <span className="ml-1.5 font-bold text-slate-800">
                    {booking.child_count || 0} ท่าน
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">ราคาต่อท่าน:</span>
                  <span className="ml-1.5 font-bold text-slate-800">
                    ฿{formatPrice(booking.package_price)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">ยอดรวมแพ็กเกจ:</span>
                  <span className="ml-1.5 font-bold text-cyan-700">
                    ฿{formatPrice(booking.package_price * booking.adult_count)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Contact */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                <User className="h-4 w-4 text-cyan-600" />
                ข้อมูลผู้ติดต่อ
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">ชื่อผู้ติดต่อ:</span>
                  <span className="font-semibold text-slate-900">
                    {booking.contact_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">เบอร์โทรศัพท์:</span>
                  <a
                    href={`tel:${booking.contact_phone}`}
                    className="font-medium text-cyan-600 hover:underline flex items-center gap-1"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {booking.contact_phone}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">อีเมล:</span>
                  <a
                    href={`mailto:${booking.contact_email}`}
                    className="font-medium text-cyan-600 hover:underline flex items-center gap-1"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {booking.contact_email}
                  </a>
                </div>
                {booking.contact_line_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">LINE ID:</span>
                    <span className="font-medium text-emerald-700">
                      {booking.contact_line_id}
                    </span>
                  </div>
                )}
                {booking.user_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">User ID ในระบบ:</span>
                    <span className="font-mono text-xs text-slate-600">
                      #{booking.user_id}
                    </span>
                  </div>
                )}
              </div>

              {booking.special_request && (
                <div className="mt-4 rounded-lg bg-amber-50/70 p-3 border border-amber-200/50">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                    <MessageSquare className="h-3.5 w-3.5" />
                    คำขอพิเศษจากลูกค้า:
                  </p>
                  <p className="mt-1 text-xs text-amber-900 leading-relaxed">
                    {booking.special_request}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Travelers List */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center justify-between text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-600" />
                รายชื่อผู้เดินทาง ({booking.travelers?.length || 0} ท่าน)
              </span>
            </h3>

            {booking.travelers && booking.travelers.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                      <th className="py-2.5 px-3">ลำดับ</th>
                      <th className="py-2.5 px-3">คำนำหน้า</th>
                      <th className="py-2.5 px-3">ชื่อ - นามสกุล</th>
                      <th className="py-2.5 px-3">เลขบัตร ปชช. / พาสปอร์ต</th>
                      <th className="py-2.5 px-3">เบอร์โทรศัพท์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {booking.travelers.map((t, idx) => (
                      <tr key={t.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {t.title || "-"}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {t.full_name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {t.id_card_or_passport || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {t.phone || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-lg">
                ไม่มีข้อมูลรายชื่อผู้เดินทางเพิ่มเติม (เดินทางโดยผู้ติดต่อหลัก)
              </p>
            )}
          </div>

          {/* Add-ons List (if any) */}
          {booking.booking_addons && booking.booking_addons.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                <ShieldCheck className="h-4 w-4 text-cyan-600" />
                บริการเสริม / Add-ons ({booking.booking_addons.length} รายการ)
              </h3>
              <div className="mt-4 space-y-2">
                {booking.booking_addons.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {addon.addon_name}
                      </p>
                      <p className="text-slate-500">
                        จำนวน: {addon.quantity} ชุด
                      </p>
                    </div>
                    <p className="font-bold text-slate-900">
                      ฿{formatPrice(addon.price * addon.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Breakdown & Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              <CreditCard className="h-4 w-4 text-cyan-600" />
              สรุปยอดค่าบริการและชำระเงิน
            </h3>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>
                  แพ็กเกจทัวร์ (฿{formatPrice(booking.package_price)} ×{" "}
                  {booking.adult_count} ท่าน):
                </span>
                <span className="font-medium text-slate-900">
                  ฿{formatPrice(booking.package_price * booking.adult_count)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>บริการเสริม (Add-ons):</span>
                <span className="font-medium text-slate-900">
                  ฿{formatPrice(booking.addon_total)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900">
                  ยอดรวมสุทธิ (Grand Total):
                </span>
                <span className="text-2xl font-black text-cyan-600">
                  ฿{formatPrice(booking.total_price)}
                </span>
              </div>
            </div>

            {/* Payment history */}
            {booking.payments && booking.payments.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  ประวัติการชำระเงิน ({booking.payments.length} รายการ)
                </p>
                <div className="mt-2 space-y-2">
                  {booking.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          วิธีชำระ: {p.payment_method || "PromptPay QR"}
                        </p>
                        <p className="text-slate-500">
                          {formatDateTime(p.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700">
                          ฿{formatPrice(p.amount)}
                        </span>
                        <p className="text-slate-500 capitalize">{p.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            ปิดหน้าต่าง
          </button>
          <a
            href={`/booking/success/${booking.booking_code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-700 transition"
          >
            <FileText className="h-3.5 w-3.5" />
            ดูใบเสร็จ / Voucher ลูกค้า
          </a>
        </div>
      </div>
    </div>
  );
}
