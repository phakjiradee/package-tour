"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  Users,
  MapPin,
  Clock,
  Printer,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  QrCode,
  Building,
  Phone,
  Mail
} from "lucide-react";
import bookingService from "@/service/booking";

export default function BookingSuccessPage({ params }) {
  // Unwrap dynamic params in Next.js 15
  const unwrappedParams = React.use(params);
  const bookingCode = unwrappedParams?.code || "";

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchBooking() {
      if (!bookingCode) return;
      try {
        const res = await bookingService.getByCode(bookingCode);
        if (res?.success && res?.data) {
          setBooking(res.data);
        } else {
          setErrorMessage(res?.message || "ไม่พบข้อมูลการจองนี้");
        }
      } catch (err) {
        console.error("Fetch booking error:", err);
        setErrorMessage(err.response?.data?.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setIsLoading(false);
      }
    }
    fetchBooking();
  }, [bookingCode]);

  const handleCopyCode = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(bookingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">กำลังโหลดข้อมูลการจอง...</p>
      </div>
    );
  }

  if (errorMessage || !booking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">ไม่พบข้อมูลการจอง</h2>
        <p className="text-sm text-slate-500">{errorMessage || "รหัสการจองไม่ถูกต้องหรือไม่มีในระบบ"}</p>
        <Link
          href="/package"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          กลับสู่หน้ารายการแพ็กเกจ
        </Link>
      </div>
    );
  }

  const travelDateFormatted = booking.travel_date
    ? new Date(booking.travel_date).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
      })
    : "-";

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        
        {/* Success Header Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 text-center shadow-sm border border-slate-200/80 mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <span className="inline-block rounded-full bg-emerald-100/70 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
            บันทึกการจองสำเร็จเรียบร้อย
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ขอบคุณสำหรับการจองทัวร์กับ Zentura
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            ระบบได้บันทึกการจองของคุณแล้ว กรุณาชำระเงินตามช่องทางด้านล่างเพื่อยืนยันที่นั่ง
          </p>

          {/* Booking Code Pill */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 px-5 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                รหัสการจอง (Booking Code)
              </p>
              <p className="text-lg font-mono font-bold text-indigo-600">{booking.booking_code}</p>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm hover:bg-slate-100 border border-slate-200 transition-colors"
              title="คัดลอกรหัสการจอง"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Payment Transfer Card */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-md mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-indigo-800/60">
            <div>
              <p className="text-xs font-medium text-indigo-200">ยอดเงินที่ต้องชำระ</p>
              <p className="text-3xl font-extrabold text-white">
                ฿{booking.total_price?.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-indigo-500/20 px-3.5 py-1.5 border border-indigo-400/30 text-xs font-semibold text-indigo-200">
              สถานะ: {booking.status === "PENDING_PAYMENT" ? "รอชำระเงิน" : booking.status}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Bank Info */}
            <div className="space-y-3 text-xs">
              <p className="font-semibold text-indigo-200">ข้อมูลบัญชีธนาคารสำหรับโอนเงิน:</p>
              <div className="rounded-xl bg-white/10 p-4 border border-white/10 space-y-1.5">
                <p className="font-bold text-white text-sm">ธนาคารกสิกรไทย (KBANK)</p>
                <p className="font-mono text-base font-extrabold text-amber-300">123-4-56789-0</p>
                <p className="text-indigo-200">ชื่อบัญชี: บจก. เซนทูรา ทราเวล แอนด์ ทัวร์</p>
              </div>
              <p className="text-[11px] text-indigo-300 leading-relaxed">
                * หลังโอนเงินเสร็จแล้ว สามารถแจ้งสลิปโอนเงินผ่านทาง LINE หรือระบบอัปโหลดสลิป
              </p>
            </div>

            {/* PromptPay QR Mock */}
            <div className="flex flex-col items-center justify-center rounded-xl bg-white p-4 text-slate-800 text-center">
              <QrCode className="h-28 w-28 text-slate-900" />
              <p className="text-[11px] font-bold text-slate-700 mt-2">สแกนจ่ายผ่านพร้อมเพย์ (PromptPay)</p>
              <p className="text-[10px] text-slate-400">ยอดเงิน ฿{booking.total_price?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Booking Details Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 mb-6 space-y-6">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            รายละเอียดแพ็กเกจและการเดินทาง
          </h2>

          {/* Package Info */}
          <div className="flex gap-4">
            {booking.package?.image && (
              <img
                src={booking.package.image}
                alt={booking.package.name}
                className="h-20 w-20 rounded-2xl object-cover flex-shrink-0"
              />
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {booking.package?.name}
              </h3>
              <p className="text-xs font-medium text-indigo-600 mt-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {travelDateFormatted}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                ผู้ร่วมเดินทาง: ผู้ใหญ่ {booking.adult_count} ท่าน {booking.child_count > 0 && `, เด็ก ${booking.child_count} ท่าน`}
              </p>
            </div>
          </div>

          {/* Travelers List */}
          {booking.travelers && booking.travelers.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                รายชื่อผู้ร่วมเดินทาง ({booking.travelers.length} ท่าน)
              </h4>
              <div className="space-y-2">
                {booking.travelers.map((t, idx) => (
                  <div key={t.id || idx} className="flex justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-50 text-slate-700">
                    <span>
                      {idx + 1}. {t.title} {t.full_name}
                    </span>
                    {t.id_card_or_passport && (
                      <span className="font-mono text-slate-500">{t.id_card_or_passport}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Addons List */}
          {booking.booking_addons && booking.booking_addons.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                บริการเสริม (Add-on)
              </h4>
              <div className="space-y-1.5">
                {booking.booking_addons.map((a, idx) => (
                  <div key={a.id || idx} className="flex justify-between text-xs text-slate-600">
                    <span>• {a.addon_name} (1 ชุด)</span>
                    <span className="font-semibold">+฿{a.price?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Person */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
            <div>
              <span className="text-slate-400">ผู้ติดต่อ:</span> {booking.contact_name}
            </div>
            <div>
              <span className="text-slate-400">เบอร์โทร:</span> {booking.contact_phone}
            </div>
            <div>
              <span className="text-slate-400">อีเมล:</span> {booking.contact_email}
            </div>
            {booking.contact_line_id && (
              <div>
                <span className="text-slate-400">LINE ID:</span> {booking.contact_line_id}
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <Link
            href="/package"
            className="w-full sm:w-auto text-center rounded-xl bg-white border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            ← ดูแพ็กเกจทัวร์อื่นๆ
          </Link>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>พิมพ์ใบยืนยันการจอง</span>
          </button>
        </div>

      </div>
    </div>
  );
}
