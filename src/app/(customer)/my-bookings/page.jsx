"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Compass,
  CreditCard,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  User,
  ChevronRight
} from "lucide-react";
import bookingService from "@/service/booking";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await bookingService.getMyBookings();
        if (res?.success) {
          setBookings(res.data || []);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          setIsUnauthorized(true);
        } else {
          setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadBookings();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return {
          label: "ยืนยันการจองแล้ว",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200"
        };
      case "AWAITING_VERIFICATION":
        return {
          label: "รอเจ้าหน้าที่ตรวจสลิป",
          bg: "bg-blue-50 text-blue-700 border-blue-200"
        };
      case "CANCELLED":
        return {
          label: "ยกเลิกการจอง",
          bg: "bg-rose-50 text-rose-700 border-rose-200"
        };
      case "PENDING_PAYMENT":
      default:
        return {
          label: "รอการชำระเงิน",
          bg: "bg-amber-50 text-amber-700 border-amber-200"
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium">กำลังโหลดประวัติการจองของคุณ...</p>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <User className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">กรุณาเข้าสู่ระบบ</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          เข้าสู่ระบบเพื่อตรวจสอบประวัติการจองแพ็กเกจทัวร์และใบยืนยันการจองของคุณ
        </p>
        <Link
          href="/auth/login"
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all"
        >
          ไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Receipt className="h-7 w-7 text-indigo-600" />
            <span>ประวัติการจองของฉัน</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            ตรวจสอบสถานะการจอง ใบเสร็จ และรายละเอียดการเดินทางของคุณทั้งหมด
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 border border-rose-200">
            {error}
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm border border-slate-200/80">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Compass className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">ยังไม่มีประวัติการจอง</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
              คุณยังไม่เคยทำการจองแพ็กเกจทัวร์ เลือกชมและจองทริปที่คุณสนใจได้เลยวันนี้
            </p>
            <Link
              href="/package"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
            >
              <span>เลือกดูแพ็กเกจทัวร์</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((item) => {
              const badge = getStatusBadge(item.status);
              const travelDateStr = item.travel_date
                ? new Date(item.travel_date).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })
                : "-";

              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {item.booking_code}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        จองเมื่อ {new Date(item.createdAt).toLocaleDateString("th-TH")}
                      </span>
                    </div>

                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex gap-3.5">
                      {item.package?.image ? (
                        <img
                          src={item.package.image}
                          alt={item.package.name}
                          className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <Compass className="h-6 w-6" />
                        </div>
                      )}

                      <div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {item.package?.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                          <span>วันเดินทาง: {travelDateStr}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          ผู้ร่วมเดินทาง: {item.adult_count} ท่าน {item.child_count > 0 && `(เด็ก ${item.child_count})`}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] text-slate-400">ยอดสุทธิ</p>
                        <p className="text-lg font-extrabold text-indigo-600">
                          ฿{item.total_price?.toLocaleString()}
                        </p>
                      </div>

                      <Link
                        href={`/booking/success/${item.booking_code}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <span>ดูใบยืนยันการจอง</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
