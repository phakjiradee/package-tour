"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
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
  RotateCcw,
  ExternalLink,
  Upload,
  Loader2,
} from "lucide-react";
import { BookingStatusBadge } from "@/components/ui/Badges";
import { api } from "@/lib/axios";

export default function BookingDetailModal({
  booking,
  isOpen,
  onClose,
  onUpdateStatus,
  updating = false,
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundReasonOption, setRefundReasonOption] = useState("สภาพอากาศหรือสถานที่ท่องเที่ยวไม่พร้อมเดินทาง");
  const [customRefundReason, setCustomRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(null);
  const [isMarkRefundedOpen, setIsMarkRefundedOpen] = useState(false);
  const [refundSlipUrl, setRefundSlipUrl] = useState("");
  const [uploadingSlip, setUploadingSlip] = useState(false);

  const handleUploadSlip = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      setUploadingSlip(true);
      const res = await api.post("/upload/single", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.url) {
        setRefundSlipUrl(res.data.url);
      }
    } catch (err) {
      console.error("Upload refund slip failed:", err);
      alert("อัปโหลดไฟล์สลิปไม่สำเร็จ กรุณาลองใหม่หรือใส่เป็นลิงก์ URL");
    } finally {
      setUploadingSlip(false);
    }
  };

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
                  ยืนยันการจอง, ยกเลิก หรือแจ้งคืนเงินกรณีเกิดปัญหาในการจัดทริป
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Confirm button */}
                <button
                  type="button"
                  disabled={updating || booking.status === "CONFIRMED" || booking.status === "CANCELLED" || booking.status === "REFUNDED" || (booking.payments || []).filter((payment) => payment.status === "APPROVED" && ["STRIPE_LIVE_CARD", "BANK_TRANSFER_VERIFIED"].includes(payment.payment_method)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0) + 0.01 < Number(booking.total_price)}
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

                {/* Cancel button */}
                <button
                  type="button"
                  disabled={updating || booking.status === "CANCELLED" || booking.status === "REFUNDED"}
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

                {/* Refund action: trigger refund request if confirmed or pending payment */}
                {["CONFIRMED", "PENDING_PAYMENT", "AWAITING_VERIFICATION"].includes(booking.status) && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => {
                      setRefundAmount(booking.refund_amount ?? booking.total_price ?? 0);
                      setIsRefundDialogOpen(!isRefundDialogOpen);
                      setIsMarkRefundedOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700 active:scale-95 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    แจ้งคืนเงิน (ทริปมีปัญหา)
                  </button>
                )}

                {/* Mark as refunded action: if already pending refund */}
                {booking.status === "REFUND_PENDING" && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => {
                      setRefundSlipUrl(booking.refund_slip_url || "");
                      setIsMarkRefundedOpen(!isMarkRefundedOpen);
                      setIsRefundDialogOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    บันทึกการโอนเงินคืนสำเร็จ (REFUNDED)
                  </button>
                )}
              </div>
            </div>

            {/* Inline Dialog: Trigger Refund (Admin Only) */}
            {isRefundDialogOpen && (
              <div className="mt-4 rounded-xl border border-purple-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-purple-600" />
                    <p className="text-xs font-bold text-purple-950">
                      แจ้งขอคืนเงินเนื่องจากทริปมีปัญหา (Admin Refund)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRefundDialogOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕ ปิด
                  </button>
                </div>
                <p className="text-[11px] text-purple-700">
                  * การคืนเงินจะเกิดขึ้นเมื่อแอดมินดำเนินการเนื่องจากสถานที่หรือการจัดเดินทางมีปัญหาเท่านั้น
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">สาเหตุที่ขอคืนเงิน:</label>
                  <select
                    value={refundReasonOption}
                    onChange={(e) => setRefundReasonOption(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="สภาพอากาศหรือสถานที่ท่องเที่ยวไม่พร้อมเดินทาง">
                      สภาพอากาศหรือสถานที่ท่องเที่ยวไม่พร้อมเดินทาง
                    </option>
                    <option value="ยกเลิกทริปโดยผู้จัดทัวร์เนื่องจากเหตุสุดวิสัย">
                      ยกเลิกทริปโดยผู้จัดทัวร์เนื่องจากเหตุสุดวิสัย
                    </option>
                    <option value="จำนวนผู้เดินทางไม่ถึงเกณฑ์ขั้นต่ำของทริป">
                      จำนวนผู้เดินทางไม่ถึงเกณฑ์ขั้นต่ำของทริป
                    </option>
                    <option value="OTHER">อื่นๆ (ระบุเอง)</option>
                  </select>
                  {refundReasonOption === "OTHER" && (
                    <input
                      type="text"
                      placeholder="ระบุสาเหตุการขอคืนเงิน..."
                      value={customRefundReason}
                      onChange={(e) => setCustomRefundReason(e.target.value)}
                      className="w-full mt-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">ยอดเงินที่ต้องคืน (บาท):</label>
                  <input
                    type="number"
                    min="0"
                    value={refundAmount ?? booking.total_price ?? 0}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRefundDialogOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => {
                      const finalReason = refundReasonOption === "OTHER" ? customRefundReason.trim() : refundReasonOption;
                      if (!finalReason) {
                        alert("กรุณาระบุสาเหตุการขอคืนเงิน");
                        return;
                      }
                      const finalAmount = Number(refundAmount ?? booking.total_price ?? 0);
                      if (!confirm(`ยืนยันส่งเรื่องขอคืนเงินรหัส ${booking.booking_code} ยอด ฿${formatPrice(finalAmount)} หรือไม่?`)) {
                        return;
                      }
                      onUpdateStatus(booking.id, "REFUND_PENDING", {
                        refund_reason: finalReason,
                        refund_amount: finalAmount,
                      });
                      setIsRefundDialogOpen(false);
                    }}
                    className="rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-700 active:scale-95 disabled:opacity-50"
                  >
                    ยืนยันขอคืนเงิน (REFUND_PENDING)
                  </button>
                </div>
              </div>
            )}

            {/* Inline Dialog: Complete Refund (REFUNDED) */}
            {isMarkRefundedOpen && (
              <div className="mt-4 rounded-xl border border-teal-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-teal-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    <p className="text-xs font-bold text-teal-950">
                      บันทึกการโอนเงินคืนสำเร็จ (REFUNDED)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMarkRefundedOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕ ปิด
                  </button>
                </div>
                <p className="text-[11px] text-teal-700">
                  กรุณาตรวจสอบว่าได้ทำการโอนเงินคืน ฿{formatPrice(booking.refund_amount || booking.total_price)} ให้ลูกค้าเรียบร้อยแล้ว และแนบหลักฐานสลิปสำหรับบันทึก Transaction การเงิน
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">หลักฐานการโอนเงินคืน (สลิปโอนเงิน):</label>
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition">
                      {uploadingSlip ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 text-slate-600" />
                      )}
                      <span>{uploadingSlip ? "กำลังอัปโหลด..." : "อัปโหลดสลิปจากเครื่อง"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadSlip}
                        disabled={uploadingSlip}
                      />
                    </label>
                    <span className="text-[11px] text-slate-400">หรือระบุเป็นลิงก์ URL:</span>
                  </div>
                  <input
                    type="url"
                    placeholder="https://example.com/slip.jpg"
                    value={refundSlipUrl}
                    onChange={(e) => setRefundSlipUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  {refundSlipUrl && (
                    <div className="mt-1 flex items-center gap-2">
                      <a
                        href={refundSlipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline"
                      >
                        <ExternalLink className="h-3 w-3" /> ดูตัวอย่างสลิปที่แนบ
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsMarkRefundedOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => {
                      if (!confirm(`ยืนยันการบันทึกสถานะว่าคืนเงินให้ลูกค้าเรียบร้อยแล้วหรือไม่?`)) {
                        return;
                      }
                      onUpdateStatus(booking.id, "REFUNDED", {
                        refund_slip_url: refundSlipUrl.trim() || null,
                      });
                      setIsMarkRefundedOpen(false);
                    }}
                    className="rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-700 active:scale-95 disabled:opacity-50"
                  >
                    ยืนยันการคืนเงินเสร็จสิ้น
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Refund Information Card (if in refund flow or has refund data) */}
          {(booking.status === "REFUND_PENDING" || booking.status === "REFUNDED" || booking.refund_reason) && (
            <div
              className={`rounded-xl border p-5 shadow-sm ${
                booking.status === "REFUNDED"
                  ? "border-teal-200 bg-teal-50/50"
                  : "border-purple-200 bg-purple-50/50"
              }`}
            >
              <h3
                className={`flex items-center gap-2 text-sm font-bold border-b pb-3 ${
                  booking.status === "REFUNDED"
                    ? "text-teal-950 border-teal-100"
                    : "text-purple-950 border-purple-100"
                }`}
              >
                <RotateCcw
                  className={`h-4 w-4 ${
                    booking.status === "REFUNDED" ? "text-teal-600" : "text-purple-600"
                  }`}
                />
                ข้อมูลการขอคืนเงิน (Refund Information)
              </h3>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-500">สถานะการคืนเงิน:</p>
                  <p className="font-bold text-slate-800">
                    {booking.status === "REFUNDED"
                      ? "คืนเงินเรียบร้อยแล้ว (REFUNDED)"
                      : "อยู่ระหว่างรอดำเนินการคืนเงิน (REFUND PENDING)"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">ยอดเงินคืน:</p>
                  <p
                    className={`font-black text-sm ${
                      booking.status === "REFUNDED" ? "text-teal-700" : "text-purple-700"
                    }`}
                  >
                    ฿{formatPrice(booking.refund_amount ?? booking.total_price)}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-slate-500">สาเหตุการคืนเงิน:</p>
                  <p className="font-medium text-slate-800">
                    {booking.refund_reason || "เนื่องจากสถานที่หรือการจัดเดินทางมีปัญหา"}
                  </p>
                </div>
                {booking.refunded_at && (
                  <div>
                    <p className="text-slate-500">วันเวลาที่คืนเงินสำเร็จ:</p>
                    <p className="font-medium text-slate-800">
                      {formatDateTime(booking.refunded_at)}
                    </p>
                  </div>
                )}
                {booking.refund_slip_url && (
                  <div>
                    <p className="text-slate-500">หลักฐานการโอนเงินคืน:</p>
                    <a
                      href={booking.refund_slip_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 underline mt-0.5"
                    >
                      <ExternalLink className="h-3 w-3" /> เปิดดูสลิป
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

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
                    {booking.package?.name || "แพ็กเกจทัวร์"}
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

          {/* Collaborators List (if any) */}
          {booking.bookingCollaps && booking.bookingCollaps.length > 0 && (
            <div className="rounded-xl border border-purple-200/80 bg-purple-50/40 p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-purple-950 border-b border-purple-100 pb-3">
                <Users className="h-4 w-4 text-purple-600" />
                ผู้ร่วมทริปในการจองนี้ (Collaborators - {booking.bookingCollaps.length} ท่าน)
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 border border-purple-100 shadow-2xs text-xs">
                  <span className="font-bold text-slate-800">👑 {booking.contact_name || booking.user?.name || "ผู้จองหลัก"}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">ผู้จองหลัก</span>
                </div>
                {booking.bookingCollaps.map((collab) => (
                  <div key={collab.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 border border-purple-200 shadow-2xs text-xs">
                    <span className="font-bold text-purple-900">@{collab.user?.name || "Collab"}</span>
                    <span className="text-slate-500 text-[11px]">({collab.user?.email || "ผู้ร่วมทริป"})</span>
                    <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">ผู้ร่วมทริป</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              {booking.insurance_total_satang > 0 && <div className="flex justify-between text-slate-600">
                <span>ประกันการเดินทาง:</span>
                <span className="font-medium text-slate-900">฿{formatPrice(booking.insurance_total_satang / 100)}</span>
              </div>}
              {booking.insurance_opted_in === false && <div className="flex justify-between text-slate-600">
                <span>ประกันการเดินทาง:</span>
                <span className="font-medium text-slate-900">ไม่ได้ซื้อ</span>
              </div>}
              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900">
                  ยอดรวมสุทธิ (Grand Total):
                </span>
                <span className="text-2xl font-black text-cyan-600">
                  ฿{formatPrice(booking.total_price)}
                </span>
              </div>
            </div>

            {/* Payment & Financial Transactions History */}
            {booking.payments && booking.payments.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  ประวัติธุรกรรมการเงินและหลักฐาน ({booking.payments.length} รายการ)
                </p>
                <div className="mt-2 space-y-2">
                  {booking.payments.map((p) => {
                    const isRefund = p.payment_method === "REFUND_TRANSFER" || p.status === "REFUNDED";
                    return (
                      <div
                        key={p.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3 text-xs transition ${
                          isRefund
                            ? "border-purple-200/90 bg-purple-50/50"
                            : "border-slate-100 bg-slate-50/50"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {isRefund
                                ? "โอนเงินคืน (Refund Transaction)"
                                : p.payment_method === "PROMPTPAY_MOCK"
                                ? "PromptPay QR (จำลอง)"
                                : p.payment_method === "STRIPE_LIVE_CARD"
                                ? "บัตรเครดิต / เดบิต (Stripe)"
                                : p.payment_method || "PromptPay QR"}
                            </span>
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                isRefund
                                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                                  : p.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {isRefund
                                ? "คืนเงินแล้ว (REFUNDED)"
                                : p.status === "APPROVED"
                                ? "อนุมัติแล้ว"
                                : p.status}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px]">
                            วันเวลาทำรายการ: {formatDateTime(p.paid_at || p.createdAt)}
                          </p>
                          {p.reject_reason && (
                            <p className="text-purple-900 text-[11px] font-medium">
                              หมายเหตุ: {p.reject_reason}
                            </p>
                          )}
                          {p.slip_url && (
                            <a
                              href={p.slip_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-cyan-700 hover:text-cyan-900 underline text-[11px] mt-0.5"
                            >
                              <ExternalLink className="h-3 w-3" /> เปิดดูสลิปหลักฐานการเงิน
                            </a>
                          )}
                        </div>
                        <div className="text-left sm:text-right">
                          <span
                            className={`font-black text-sm ${
                              isRefund ? "text-rose-600" : "text-emerald-700"
                            }`}
                          >
                            {isRefund ? "−" : "+"}฿{formatPrice(p.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
