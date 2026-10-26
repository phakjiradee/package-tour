"use client";

import React, { useState } from "react";
import { AlertTriangle, X, Loader2, Calendar, FileText } from "lucide-react";

export default function CancelBookingModal({
  isOpen,
  onClose,
  booking,
  onConfirm,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !booking) return null;

  const handleConfirmCancel = async () => {
    try {
      setIsSubmitting(true);
      setError("");
      await onConfirm(booking.booking_code);
      onClose();
    } catch (err) {
      console.error("Cancel booking error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "เกิดข้อผิดพลาดในการยกเลิกการจอง กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const travelDateFormatted = booking.travel_date
    ? new Date(booking.travel_date).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200/90 z-10 overflow-hidden transform transition-all animate-scale-up">
        {/* Close Button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Warning Icon Badge */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
            <AlertTriangle className="h-8 w-8 text-rose-600" />
          </div>

          {/* Title & Subtitle */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-extrabold text-slate-900">
              ยืนยันการยกเลิกการจอง
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              คุณแน่ใจหรือไม่ว่าต้องการยกเลิกรายการจองนี้?
            </p>
          </div>

          {/* Booking Summary Box */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 mb-6 space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="font-semibold text-slate-500">รหัสการจอง:</span>
              <span className="font-mono font-bold text-indigo-600 text-sm">
                {booking.booking_code}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-slate-500 flex-shrink-0">แพ็กเกจ:</span>
              <span className="font-medium text-slate-900 text-right line-clamp-1">
                {booking.package?.name || "แพ็กเกจทัวร์"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" /> วันเดินทาง:
              </span>
              <span className="font-medium text-slate-700">{travelDateFormatted}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <span className="font-semibold text-slate-500">ยอดเงินรวม:</span>
              <span className="font-extrabold text-rose-600 text-sm">
                ฿{booking.total_price?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Danger Warning Alert */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-800 leading-relaxed mb-6">
            <p className="font-bold flex items-center gap-1.5 mb-0.5">
              ⚠️ คำเตือนการยกเลิก
            </p>
            <p>
              เมื่อกดยืนยันแล้ว รายการจองนี้จะถูกเปลี่ยนสถานะเป็น{" "}
              <strong className="underline">&ldquo;ยกเลิกการจอง&rdquo;</strong> ทันที
              และคุณจะไม่สามารถชำระเงินหรือกู้คืนรายการนี้ได้ (การยกเลิกโดยผู้จองไม่สามารถขอคืนเงินได้ ยกเว้นกรณีทริปถูกยกเลิกโดยผู้จัด)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              ย้อนกลับ (ไม่ยกเลิก)
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmCancel}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 px-4 text-sm font-bold text-white shadow-md shadow-rose-200 hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>กำลังยกเลิก...</span>
                </>
              ) : (
                <span>ยืนยันยกเลิกการจอง</span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
