"use client";

import { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Loader2,
  Sparkles,
  RefreshCw,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";
import bookingService, { bookingService as namedBookingService } from "@/service/booking";

const service = bookingService || namedBookingService;

export default function MockPaymentQR({
  booking,
  onPaymentSuccess,
}) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isPaid, setIsPaid] = useState(booking?.status === "CONFIRMED");
  const [instantPaying, setInstantPaying] = useState(false);
  const [customHost, setCustomHost] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const pollTimerRef = useRef(null);

  // Determine LAN IP or hostname for phone QR scanning
  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentHost = window.location.hostname;
      // If browsing via localhost, default to current local LAN IP
      if (currentHost === "localhost" || currentHost === "127.0.0.1") {
        setCustomHost("192.168.1.40");
      } else {
        setCustomHost(currentHost);
      }
    }
  }, []);

  const bookingCode = booking?.booking_code;
  const port = typeof window !== "undefined" ? window.location.port || "3000" : "3000";
  const hostToUse = customHost || "192.168.1.40";
  const mobilePayUrl = `http://${hostToUse}:${port}/pay-mock/${bookingCode}`;

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {
      // ignore if canvas not supported
    }
  };

  // Setup Polling when not yet paid
  useEffect(() => {
    if (!bookingCode || isPaid) return;

    const checkStatus = async () => {
      try {
        const res = await service.getByCode(bookingCode);
        if (res?.success && res?.data?.status === "CONFIRMED") {
          setIsPaid(true);
          triggerCelebration();
          if (onPaymentSuccess) {
            onPaymentSuccess(res.data);
          }
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
          }
        }
      } catch (err) {
        console.error("Payment polling error:", err);
      }
    };

    pollTimerRef.current = setInterval(checkStatus, 2000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [bookingCode, isPaid, onPaymentSuccess]);

  // Handle instant demo pay from desktop
  const handleInstantPay = async () => {
    if (!bookingCode || instantPaying || isPaid) return;
    setInstantPaying(true);
    try {
      const res = await service.mockPay(bookingCode);
      if (res?.success) {
        setIsPaid(true);
        triggerCelebration();
        if (onPaymentSuccess) {
          onPaymentSuccess(res.data);
        }
      }
    } catch (err) {
      console.error("Instant mock pay error:", err);
      alert("เกิดข้อผิดพลาดในการจำลองการชำระเงิน");
    } finally {
      setInstantPaying(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(mobilePayUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  if (isPaid || booking?.status === "CONFIRMED") {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 p-6 text-center text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 mb-3 animate-bounce">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-1">
          ชำระเงินเรียบร้อยแล้ว
        </span>
        <h3 className="text-xl font-black text-white">
          ยอดเงิน ฿{booking?.total_price?.toLocaleString()}
        </h3>
        <p className="text-xs text-emerald-200/80 mt-1 max-w-xs">
          ระบบยืนยันการชำระเงินผ่าน PromptPay QR จำลองแล้ว ที่นั่งของคุณได้รับการยืนยัน
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-5 text-slate-800 text-center shadow-lg border border-slate-100">
      {/* Top Tag */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold mb-3">
        <Sparkles className="h-3 w-3 text-indigo-600" />
        PromptPay QR Code (Demo)
      </div>

      {/* QR Code Container */}
      <div className="relative p-3 bg-white rounded-2xl border-2 border-slate-200/90 shadow-sm transition hover:shadow-md">
        <QRCodeSVG
          value={mobilePayUrl}
          size={160}
          level="M"
          includeMargin={true}
        />
        {/* Floating Scan Icon */}
        <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-xl shadow-md border-2 border-white">
          <Smartphone className="h-4 w-4" />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-3 space-y-1">
        <p className="text-xs font-bold text-slate-800">
          เปิดกล้องมือถือสแกน QR Code นี้
        </p>
        <p className="text-[11px] text-slate-500">
          ยอดเงิน ฿{booking?.total_price?.toLocaleString()} (ไม่ต้องจ่ายเงินจริง)
        </p>
      </div>

      {/* Live Polling Status */}
      <div className="mt-3 flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-200/60">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>ระบบกำลังรอตรวจจับการชำระเงิน...</span>
      </div>

      {/* Quick Action Buttons for Testing */}
      <div className="mt-4 pt-3 border-t border-slate-100 w-full flex flex-col gap-2">
        {/* Instant Pay Desktop Button */}
        <button
          type="button"
          onClick={handleInstantPay}
          disabled={instantPaying}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition disabled:opacity-60"
          title="จำลองจ่ายเงินทันทีโดยไม่ต้องใช้มือถือสแกน"
        >
          {instantPaying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Zap className="h-3.5 w-3.5" />
          )}
          <span>จำลองชำระเงินทันที (คลิกเดียว)</span>
        </button>

        {/* Copy / Open URL Button */}
        <div className="flex items-center justify-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition"
          >
            {copiedUrl ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span>{copiedUrl ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์มือถือ"}</span>
          </button>
          <span className="text-slate-300">|</span>
          <a
            href={mobilePayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition"
          >
            <ExternalLink className="h-3 w-3" />
            <span>เปิดหน้ามือถือ</span>
          </a>
        </div>

        {/* IP Config Toggle */}
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="text-[10px] text-slate-400 hover:text-slate-600 transition"
        >
          {showConfig ? "▲ ซ่อนการตั้งค่า IP" : "▼ สแกนไม่ติด? แก้ไข IP มือถือ"}
        </button>

        {showConfig && (
          <div className="rounded-xl bg-slate-50 p-2 text-left border border-slate-200 text-[11px] space-y-1">
            <label className="block text-[10px] font-semibold text-slate-500">
              LAN IP ของเครื่องคอมพิวเตอร์:
            </label>
            <input
              type="text"
              value={customHost}
              onChange={(e) => setCustomHost(e.target.value)}
              placeholder="เช่น 192.168.1.40"
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
            />
            <p className="text-[9px] text-slate-400">
              *มือถือกับคอมต้องต่อ WiFi เดียวกัน
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
