"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Mail,
  CreditCard,
  Lock,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Sparkles,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import bookingService from "@/service/booking";
import MockPaymentQR from "@/components/payment/MockPaymentQR";
import CancelBookingModal from "@/components/booking/CancelBookingModal";

function BookingSuccessContent({ params }) {
  // Unwrap dynamic params in Next.js 15
  const unwrappedParams = React.use(params);
  const bookingCode = unwrappedParams?.code || "";

  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const isCanceled = searchParams.get("canceled");

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [isVerifyingStripe, setIsVerifyingStripe] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [stripeNotification, setStripeNotification] = useState(null);
  const [showAlternativePayment, setShowAlternativePayment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleConfirmCancelBooking = async (code) => {
    const res = await bookingService.cancel(code);
    if (res?.success) {
      setBooking((prev) => ({
        ...prev,
        status: "CANCELLED",
      }));
      setStripeNotification({
        type: "warning",
        message: "ยกเลิกรายการจองนี้เรียบร้อยแล้ว",
      });
    } else {
      throw new Error(res?.message || "ไม่สามารถยกเลิกการจองได้");
    }
  };

  // โหลดข้อมูลการจอง
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

  // จัดการกรณียกเลิกชำระเงินจาก Stripe
  useEffect(() => {
    if (isCanceled) {
      setStripeNotification({
        type: "warning",
        message: "การชำระเงินผ่านบัตรเครดิตถูกยกเลิก คุณสามารถกดทำรายการชำระเงินใหม่อีกครั้งได้ตลอดเวลา",
      });
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [isCanceled]);

  // ตรวจสอบสถานะการชำระเงินเมื่อ Stripe Redirect กลับมาพร้อม session_id
  useEffect(() => {
    async function checkStripePayment() {
      if (!sessionId || !bookingCode) return;
      try {
        setIsVerifyingStripe(true);
        const res = await bookingService.verifyStripe(bookingCode, sessionId);
        if (res?.success) {
          setBooking((prev) => ({
            ...prev,
            ...(res.data || {}),
            status: "CONFIRMED",
          }));
          setStripeNotification({
            type: "success",
            message: "🎉 ชำระเงินผ่านบัตรเครดิตสำเร็จเรียบร้อย! ข้อมูลการจองของคุณได้รับการยืนยันแล้ว",
          });
          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", window.location.pathname);
          }
        } else {
          setStripeNotification({
            type: "error",
            message: res?.message || "ไม่สามารถยืนยันการชำระเงินได้ กรุณาติดต่อเจ้าหน้าที่",
          });
        }
      } catch (err) {
        console.error("Verify stripe error:", err);
        setStripeNotification({
          type: "error",
          message: err.response?.data?.message || "เกิดข้อผิดพลาดในการตรวจสอบสถานะการชำระเงิน",
        });
      } finally {
        setIsVerifyingStripe(false);
      }
    }

    checkStripePayment();
  }, [sessionId, bookingCode]);

  // ฟังก์ชันกดไปชำระเงินด้วยบัตรเครดิตผ่าน Stripe Checkout
  const handleStripeCheckout = async () => {
    if (!bookingCode) return;
    try {
      setIsStripeLoading(true);
      const clientOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await bookingService.createStripeSession(bookingCode, clientOrigin);
      if (res?.success && res?.url) {
        // นำลูกค้าไปที่หน้าชำระเงินของ Stripe โดยตรง
        window.location.href = res.url;
      } else {
        alert(res?.message || "ไม่สามารถเชื่อมต่อไปยังระบบชำระเงิน Stripe ได้");
      }
    } catch (err) {
      console.error("Stripe checkout error:", err);
      alert(err.response?.data?.message || "เกิดข้อผิดพลาดในการสร้างรายการชำระเงิน");
    } finally {
      setIsStripeLoading(false);
    }
  };

  const handlePaymentSuccess = (updatedData) => {
    setBooking((prev) => ({
      ...prev,
      ...updatedData,
      status: "CONFIRMED",
    }));
  };

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
        weekday: "long",
      })
    : "-";

  const isConfirmed = booking.status === "CONFIRMED";
  const isCancelled = booking.status === "CANCELLED";

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">

        {/* Verifying Banner */}
        {isVerifyingStripe && (
          <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50/90 p-4 text-indigo-900 shadow-sm flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-bold">กำลังตรวจสอบข้อมูลการชำระเงินกับ Stripe...</p>
              <p className="text-xs text-indigo-700">กรุณารอสักครู่ ระบบกำลังอัปเดตสถานะการจองของคุณ</p>
            </div>
          </div>
        )}

        {/* Notification Banner */}
        {stripeNotification && (
          <div
            className={`mb-6 rounded-2xl border p-4 shadow-sm flex items-start gap-3 transition-all ${
              stripeNotification.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : stripeNotification.type === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {stripeNotification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle
                className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  stripeNotification.type === "warning" ? "text-amber-600" : "text-rose-600"
                }`}
              />
            )}
            <div className="flex-1 text-sm">
              <p className="font-semibold">{stripeNotification.message}</p>
            </div>
            <button
              onClick={() => setStripeNotification(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Status Header Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 text-center shadow-sm border border-slate-200/80 mb-6">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
              isCancelled
                ? "bg-rose-50 text-rose-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {isCancelled ? (
              <XCircle className="h-10 w-10 text-rose-600" />
            ) : (
              <CheckCircle2 className="h-10 w-10" />
            )}
          </div>

          <span
            className={`inline-block rounded-full px-3.5 py-1 text-xs font-bold mb-2 ${
              isCancelled
                ? "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
                : isConfirmed
                ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                : "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
            }`}
          >
            {isCancelled
              ? "ยกเลิกการจองแล้ว (CANCELLED)"
              : isConfirmed
              ? "ชำระเงินและยืนยันการจองเรียบร้อยแล้ว"
              : "บันทึกการจองสำเร็จ (รอชำระเงิน)"}
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isCancelled
              ? "รายการจองนี้ถูกยกเลิกแล้ว"
              : "ขอบคุณสำหรับการจองทัวร์กับ Zentura"}
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            {isCancelled
              ? "รายการจองนี้ถูกยกเลิกตามคำขอเรียบร้อยแล้ว หากคุณต้องการเดินทาง กรุณาเลือกแพ็กเกจและทำรายการจองใหม่อีกครั้ง"
              : isConfirmed
              ? "ระบบได้รับยอดชำระและยืนยันที่นั่งเรียบร้อยแล้ว คุณสามารถพิมพ์ใบยืนยันการจองได้ทันที"
              : "กรุณาชำระเงินผ่านบัตรเครดิตเพื่อยืนยันที่นั่งและออกใบยืนยันการจอง"}
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

        {/* PAYMENT / CANCELLATION SECTION */}
        {isCancelled ? (
          /* Cancelled Summary Card */
          <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-md mb-6 border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <p className="text-xs font-medium text-slate-400">ยอดเงินที่ยกเลิก</p>
                <p className="text-3xl font-extrabold text-slate-400 line-through">
                  ฿{booking.total_price?.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl px-4 py-2 border bg-rose-500/20 border-rose-400/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-400" />
                สถานะ: ยกเลิกการจอง (CANCELLED)
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
              <p className="max-w-md leading-relaxed">
                ระบบได้บันทึกการยกเลิกเรียบร้อยแล้ว ไม่มีการตัดเงินหรือคิดค่าบริการเพิ่มเติม หากต้องการจองใหม่สามารถเลือกดูแพ็กเกจทัวร์อื่นๆ ได้ทันที
              </p>
              <Link
                href="/package"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 text-xs flex items-center gap-1.5 shrink-0 transition shadow-sm"
              >
                <span>เลือกดูแพ็กเกจทัวร์</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : isConfirmed ? (
          /* Payment Completed Summary Card */
          <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-md mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-emerald-800/60">
              <div>
                <p className="text-xs font-medium text-emerald-200">ยอดเงินที่ชำระแล้ว</p>
                <p className="text-3xl font-extrabold text-white">
                  ฿{booking.total_price?.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl px-4 py-2 border bg-emerald-500/20 border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                สถานะ: ชำระเงินแล้ว (CONFIRMED)
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="font-semibold text-white">ช่องทางชำระเงิน</p>
                  <p className="text-emerald-200">บัตรเครดิต / เดบิต (Stripe Payment Gateway)</p>
                </div>
              </div>
              <div className="text-left sm:text-right text-emerald-300">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> ปลอดภัยตามมาตรฐานสากล
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Credit Card Payment Card (Powered by Stripe) */
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden mb-6">
            {/* Header: Price & Status */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-7 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-indigo-200 uppercase tracking-wider">
                    ยอดเงินที่ต้องชำระ
                  </span>
                  <p className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-0.5 text-white">
                    ฿{booking.total_price?.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl px-3.5 py-1.5 border border-amber-400/40 bg-amber-500/10 text-amber-300 text-xs font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  รอชำระเงิน (PENDING)
                </div>
              </div>
            </div>

            {/* Main Credit Card Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        ชำระเงินด้วยบัตรเครดิต / เดบิต
                      </h2>
                      <p className="text-xs text-slate-500">
                        ปลอดภัยด้วยมาตรฐาน PCI-DSS ระดับสากลผ่าน Stripe
                      </p>
                    </div>
                  </div>

                  {/* Card Brand Pills */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-sans">
                      VISA
                    </span>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-sans">
                      Mastercard
                    </span>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-sans">
                      JCB
                    </span>
                  </div>
                </div>
              </div>

              {/* Security features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <Lock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>เข้ารหัสความปลอดภัย 256-bit SSL</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <Sparkles className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                  <span>ยืนยันที่นั่งและออกใบจองทันทีหลังชำระเงิน</span>
                </div>
              </div>

              {/* Stripe Test Mode Notice Box */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-indigo-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-indigo-800">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  <span>โหมดทดสอบระบบ (Stripe Test Mode)</span>
                </div>
                <p className="text-indigo-700 leading-relaxed">
                  ระบบนี้ทำงานในโหมดทดสอบ ไม่มีการตัดเงินจริงจากบัตรของคุณ คุณสามารถใช้เลขบัตรทดสอบ{" "}
                  <code className="rounded bg-indigo-200/70 px-1.5 py-0.5 font-mono font-bold text-indigo-900">
                    4242 4242 4242 4242
                  </code>{" "}
                  (วันหมดอายุในอนาคต เช่น 12/28 และ CVC ใดๆ ก็ได้) เพื่อทดสอบจ่ายเงินได้ทันที
                </p>
              </div>

              {/* Primary Stripe Button */}
              <button
                type="button"
                onClick={handleStripeCheckout}
                disabled={isStripeLoading || isVerifyingStripe}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.008] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isStripeLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                    <span>กำลังเชื่อมต่อไปยังระบบ Stripe...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>ชำระเงินด้วยบัตรเครดิต ฿{booking.total_price?.toLocaleString()}</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              {/* Collapsible Alternative: Mock QR Payment / Bank Transfer */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAlternativePayment(!showAlternativePayment)}
                  className="w-full flex items-center justify-between py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <span>หรือต้องการโอนเงิน / สแกน QR จำลอง (ช่องทางสำรอง)</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      showAlternativePayment ? "rotate-180 text-indigo-600" : ""
                    }`}
                  />
                </button>

                {showAlternativePayment && (
                  <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4">
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <p className="font-bold text-slate-900">โอนผ่านบัญชีธนาคาร:</p>
                      <p>ธนาคารกสิกรไทย (KBANK): <span className="font-mono font-bold text-indigo-600">123-4-56789-0</span></p>
                      <p>ชื่อบัญชี: บจก. เซนทูรา ทราเวล แอนด์ ทัวร์</p>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <MockPaymentQR
                        booking={booking}
                        onPaymentSuccess={handlePaymentSuccess}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Cancel Booking Quick Link */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">ไม่ประสงค์จะเดินทางแล้วใช่หรือไม่?</span>
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="inline-flex items-center gap-1.5 font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>ขอยกเลิกการจองนี้</span>
                </button>
              </div>

            </div>
          </div>
        )}

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
              <span className="text-slate-400">ผู้ติดต่อ (ผู้จอง):</span> {booking.contact_name}
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

          {/* Collaborators List (if any) */}
          {booking.bookingCollaps && booking.bookingCollaps.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-purple-600" />
                <span>สมาชิกผู้ร่วมทริป (Collab)</span>
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs">
                  👑 {booking.contact_name || booking.user?.name || "ผู้จองหลัก"} (ผู้จอง)
                </span>
                {booking.bookingCollaps.map((collab) => (
                  <span
                    key={collab.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/80 font-medium text-xs"
                  >
                    @{collab.user?.name || collab.user?.email || "ผู้ร่วมทริป"}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <Link
            href="/package"
            className="w-full sm:w-auto text-center rounded-xl bg-white border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            ← ดูแพ็กเกจทัวร์อื่นๆ
          </Link>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {!isCancelled && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 shadow-sm transition-all cursor-pointer"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>ยกเลิกการจอง</span>
              </button>
            )}

            {!isCancelled && (
              <button
                onClick={handlePrint}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>พิมพ์ใบยืนยันการจอง</span>
              </button>
            )}
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        <CancelBookingModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          booking={booking}
          onConfirm={handleConfirmCancelBooking}
        />

      </div>
    </div>
  );
}

export default function BookingSuccessPage(props) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium">กำลังโหลด...</p>
        </div>
      }
    >
      <BookingSuccessContent {...props} />
    </Suspense>
  );
}
