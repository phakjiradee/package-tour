"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Users,
  AlertCircle,
  Loader2,
  Sparkles,
  CreditCard,
  Building,
  RefreshCw,
} from "lucide-react";
import { useParams } from "next/navigation";
import bookingService, { bookingService as namedBookingService } from "@/service/booking";
import confetti from "canvas-confetti";

const service = bookingService || namedBookingService;

export default function MobileMockPayPage() {
  const routeParams = useParams();
  const [clientCode, setClientCode] = useState("");

  // Safely extract bookingCode from params or URL pathname
  useEffect(() => {
    if (routeParams?.code) {
      setClientCode(String(routeParams.code));
    } else if (typeof window !== "undefined") {
      const segments = window.location.pathname.split("/").filter(Boolean);
      const codePart = segments[segments.length - 1];
      if (codePart) {
        setClientCode(codePart);
      }
    }
  }, [routeParams]);

  const bookingCode = routeParams?.code || clientCode || "";

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadBooking = async (codeToFetch) => {
    const code = codeToFetch || bookingCode;
    if (!code) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await service.getByCode(code);
      if (res?.success && res?.data) {
        setBooking(res.data);
        if (res.data.status === "CONFIRMED") {
          setIsSuccess(true);
        }
      } else {
        setErrorMessage(res?.message || "ไม่พบข้อมูลการจองนี้");
      }
    } catch (err) {
      console.error("Fetch booking error:", err);
      // Even if fetch fails, keep bookingCode so user can still pay!
      setErrorMessage(
        err.response?.data?.message || "ไม่สามารถดึงข้อมูลทริปได้ กรุณาลองกดชำระเงินโดยตรง"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingCode) {
      loadBooking(bookingCode);
    }
  }, [bookingCode]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleConfirmPay = async () => {
    if (!bookingCode || paying) return;
    setPaying(true);
    setErrorMessage("");
    try {
      const res = await service.mockPay(bookingCode);
      if (res?.success) {
        setIsSuccess(true);
        triggerConfetti();
      } else {
        setErrorMessage(res?.message || "ไม่สามารถทำรายการได้");
      }
    } catch (err) {
      console.error("Mock pay error:", err);
      setErrorMessage(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการจำลองการชำระเงิน"
      );
    } finally {
      setPaying(false);
    }
  };

  const travelDateFormatted = booking?.travel_date
    ? new Date(booking.travel_date).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-5 text-white text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Zentura Mock Payment Gateway
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            จำลองระบบสแกนชำระเงิน
          </h1>
          <p className="text-xs text-cyan-100 mt-0.5">
            รหัสการจอง:{" "}
            <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded-lg text-white">
              {bookingCode || "กำลังตรวจสอบ..."}
            </span>
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Success State */}
          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-inner">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1">
                  PAYMENT COMPLETED
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  ชำระเงินเสร็จสมบูรณ์!
                </h2>
                <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
                  ระบบได้ปรับปรุงสถานะการจองเป็น{" "}
                  <span className="font-bold text-emerald-600">CONFIRMED</span>{" "}
                  และส่งข้อมูลไปยังหน้าจอคอมพิวเตอร์ของคุณแล้ว
                </p>
              </div>

              {/* Summary Card */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-left space-y-2 text-xs">
                {booking?.package?.name && (
                  <div className="flex justify-between text-slate-500">
                    <span>แพ็กเกจทัวร์:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">
                      {booking.package.name}
                    </span>
                  </div>
                )}
                {booking?.total_price && (
                  <div className="flex justify-between text-slate-500">
                    <span>ยอดเงินที่บันทึก:</span>
                    <span className="font-bold text-emerald-600 text-sm">
                      ฿{booking.total_price.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>ช่องทาง:</span>
                  <span className="font-medium text-slate-700">PromptPay QR (จำลอง)</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[11px] text-slate-400">
                  คุณสามารถปิดหน้าต่างเบราว์เซอร์นี้บนมือถือได้เลยครับ
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Demo Notice Banner */}
              <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-3.5 flex items-start gap-3 text-amber-900 text-xs">
                <ShieldCheck className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">โหมดทดสอบ (Demo Only):</span>{" "}
                  เมื่อคุณกดปุ่มด้านล่าง ระบบจะจำลองว่าได้รับเงินแล้วโดยทันที
                  ไม่มีการตัดเงินจริงจากบัญชีของคุณ
                </div>
              </div>

              {/* Package Summary Box */}
              {loading ? (
                <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
                  <span>กำลังโหลดข้อมูลแพ็กเกจ...</span>
                </div>
              ) : booking ? (
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3">
                  <div className="flex gap-3">
                    {booking.package?.image && (
                      <img
                        src={booking.package.image}
                        alt=""
                        className="h-16 w-16 rounded-xl object-cover flex-shrink-0 border border-slate-200"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-cyan-600 font-semibold">แพ็กเกจที่เลือก</p>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">
                        {booking.package?.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        วันเดินทาง: {travelDateFormatted}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                    <div>
                      <p className="text-xs text-slate-500">ยอดชำระสุทธิ</p>
                      <p className="text-[11px] text-slate-400">
                        ผู้เดินทาง {booking.adult_count} ท่าน
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-cyan-600">
                        ฿{booking.total_price?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {errorMessage && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600 text-center font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Action Button - ALWAYS VISIBLE if bookingCode is present! */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmPay}
                  disabled={paying || !bookingCode}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition disabled:opacity-60"
                >
                  {paying ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>กำลังประมวลผลการจำลอง...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span>แตะเพื่อยืนยันชำระเงิน (ฟรี / Demo)</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-slate-400">
                  กดปุ่มนี้เพื่อเปลี่ยนสถานะหน้าเว็บบนคอมพิวเตอร์เป็น &ldquo;ชำระเงินสำเร็จ&rdquo;
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
