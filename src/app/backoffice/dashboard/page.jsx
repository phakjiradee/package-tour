"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Eye,
  MapPin,
  PlaneTakeoff,
  RefreshCw,
  TrendingUp,
  User,
  UsersRound,
  XCircle,
} from "lucide-react";
import { bookingService } from "@/service/booking";
import { BookingStatusBadge } from "@/components/ui/Badges";
import BookingDetailModal from "@/components/booking/BookingDetailModal";
import { api } from "@/lib/axios";

export default function DashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Detail Modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [bookingRes, packageRes] = await Promise.allSettled([
        bookingService.getAll({ limit: 100 }),
        api.get("/packages"),
      ]);

      if (bookingRes.status === "fulfilled" && bookingRes.value?.success) {
        setBookings(bookingRes.value.data || []);
      }

      if (packageRes.status === "fulfilled") {
        const pkgData = Array.isArray(packageRes.value.data)
          ? packageRes.value.data
          : packageRes.value.data?.data || [];
        setPackages(pkgData);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update status
  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      setUpdatingStatus(true);
      await bookingService.updateStatus(bookingId, newStatus);
      // Refresh local bookings state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Update status error:", err);
      alert("ไม่สามารถอัปเดตสถานะได้");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const totalBookings = bookings.length;

    // Total revenue from confirmed or all active bookings
    const confirmedRevenue = bookings
      .filter((b) => b.status === "CONFIRMED")
      .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

    const pendingCount = bookings.filter(
      (b) => b.status === "PENDING_PAYMENT" || b.status === "AWAITING_VERIFICATION"
    ).length;

    const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
    const cancelledCount = bookings.filter((b) => b.status === "CANCELLED").length;

    const activePackagesCount = packages.filter(
      (p) => p.status === "Published" || !p.status
    ).length;

    return {
      totalBookings,
      confirmedRevenue,
      pendingCount,
      confirmedCount,
      cancelledCount,
      activePackagesCount: activePackagesCount || packages.length,
    };
  }, [bookings, packages]);

  // Recent 6 bookings
  const recentBookings = useMemo(() => {
    return bookings.slice(0, 6);
  }, [bookings]);

  // Compute 7-day bookings activity
  const activityDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("th-TH", { weekday: "short" });
      
      const count = bookings.filter((b) => {
        if (!b.createdAt) return false;
        return new Date(b.createdAt).toISOString().slice(0, 10) === dateStr;
      }).length;

      days.push({ label, count, dateStr });
    }

    const maxCount = Math.max(...days.map((d) => d.count), 1);
    return days.map((d) => ({
      ...d,
      heightPercent: Math.max(12, Math.round((d.count / maxCount) * 100)),
    }));
  }, [bookings]);

  // Formatters
  const formatPrice = (val) => {
    return Number(val || 0).toLocaleString("th-TH");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("th-TH", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Refresh bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ภาพรวมระบบและการจอง (Dashboard)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            สรุปข้อมูลสถิติยอดจอง รายได้ และการดำเนินงานทั้งหมดของ Zentura Tour
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-500 ${refreshing ? "animate-spin" : ""}`}
            />
            อัปเดตข้อมูล
          </button>

          <Link
            href="/backoffice/booking"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 active:scale-95"
          >
            <CalendarCheck className="h-4 w-4" />
            จัดการรายการจอง
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Total Bookings */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                ยอดการจองทั้งหมด
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {loading ? "-" : kpis.totalBookings}
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
              <CalendarDays className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              <TrendingUp className="h-3.5 w-3.5" />
              ยืนยันแล้ว {kpis.confirmedCount} รายการ
            </span>
            <Link
              href="/backoffice/booking"
              className="text-cyan-600 hover:underline flex items-center gap-0.5"
            >
              ดูทั้งหมด <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Confirmed Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                รายได้ที่ยืนยันแล้ว
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-700">
                {loading ? "-" : `฿${formatPrice(kpis.confirmedRevenue)}`}
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <CircleDollarSign className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>คำนวณจากยอดที่ Confirmed</span>
            <span className="font-semibold text-slate-700">
              {kpis.confirmedCount} ใบเสร็จ
            </span>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/20 p-5 shadow-sm hover:border-amber-300 transition">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-amber-800">
                รอชำระ / รอตรวจสอบ
              </p>
              <p className="mt-2 text-3xl font-black text-amber-900">
                {loading ? "-" : kpis.pendingCount}
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-800">
              <Clock className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-amber-800">
            <span>ต้องดำเนินการตรวจสอบ</span>
            <Link
              href="/backoffice/booking?status=AWAITING_VERIFICATION"
              className="font-bold underline flex items-center gap-0.5"
            >
              ตรวจสอบเลย <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Active Packages */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                แพ็กเกจทัวร์ในระบบ
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {loading ? "-" : kpis.activePackagesCount}
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
              <PlaneTakeoff className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>แพ็กเกจพร้อมให้บริการ</span>
            <Link
              href="/backoffice/package"
              className="text-cyan-600 hover:underline flex items-center gap-0.5"
            >
              จัดการแพ็กเกจ <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Middle Section: Booking Trends & Status Overview */}
      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Activity Chart & Trends */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                สถิติการทำรายการจอง (7 วันล่าสุด)
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                จำนวนคำสั่งจองแพ็กเกจทัวร์ที่ลูกค้าทำรายการเข้ามาในแต่ละวัน
              </p>
            </div>
            <Link
              href="/backoffice/booking"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              ดูรายการทั้งหมด
            </Link>
          </div>

          {/* Bar Chart Representation */}
          <div className="mt-8 flex h-56 items-end gap-3 sm:gap-6 border-b border-slate-100 pb-2">
            {activityDays.map((day, idx) => (
              <div
                key={idx}
                className="group relative flex min-w-0 flex-1 flex-col items-center justify-end h-full"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded px-2 py-1 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                  {day.dateStr}: {day.count} รายการ
                </div>
                {/* Bar */}
                <div
                  className={`w-full max-w-[48px] rounded-t-lg transition-all duration-300 ${
                    day.count > 0
                      ? "bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:from-cyan-700 group-hover:to-cyan-500"
                      : "bg-slate-100"
                  }`}
                  style={{ height: `${day.heightPercent}%` }}
                />
                <span className="mt-2 text-xs font-semibold text-slate-500 truncate">
                  {day.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {day.count}
                </span>
              </div>
            ))}
          </div>

          {/* Status Breakdown Bar */}
          <div className="mt-6 pt-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              สัดส่วนสถานะการจองในระบบ
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/backoffice/booking?status=CONFIRMED"
                className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-100 hover:bg-emerald-100/70 transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  ยืนยันแล้ว
                </div>
                <p className="mt-1 text-xl font-black text-emerald-900">
                  {kpis.confirmedCount}
                </p>
              </Link>

              <Link
                href="/backoffice/booking?status=PENDING_PAYMENT"
                className="rounded-lg bg-amber-50/70 p-3 border border-amber-100 hover:bg-amber-100/70 transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <Clock className="h-3.5 w-3.5" />
                  รอชำระเงิน
                </div>
                <p className="mt-1 text-xl font-black text-amber-900">
                  {bookings.filter((b) => b.status === "PENDING_PAYMENT").length}
                </p>
              </Link>

              <Link
                href="/backoffice/booking?status=AWAITING_VERIFICATION"
                className="rounded-lg bg-sky-50/70 p-3 border border-sky-100 hover:bg-sky-100/70 transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800">
                  <Clock className="h-3.5 w-3.5" />
                  รอตรวจสอบ
                </div>
                <p className="mt-1 text-xl font-black text-sky-900">
                  {bookings.filter((b) => b.status === "AWAITING_VERIFICATION").length}
                </p>
              </Link>

              <Link
                href="/backoffice/booking?status=CANCELLED"
                className="rounded-lg bg-rose-50/70 p-3 border border-rose-100 hover:bg-rose-100/70 transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                  <XCircle className="h-3.5 w-3.5" />
                  ยกเลิกแล้ว
                </div>
                <p className="mt-1 text-xl font-black text-rose-900">
                  {kpis.cancelledCount}
                </p>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Operations / Recent Activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-950">
                การแจ้งเตือนและการทำงาน
              </h2>
              <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
            </div>

            <div className="mt-4 space-y-3.5">
              {kpis.pendingCount > 0 ? (
                <div className="rounded-lg bg-amber-50 p-3.5 border border-amber-200/70">
                  <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    มีรายการรอการตรวจสอบ {kpis.pendingCount} รายการ
                  </p>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    มีลูกค้าทำรายการจองและรอการยืนยันสถานะ กรุณาเข้าไปตรวจสอบยอดเงินและยืนยันการจอง
                  </p>
                  <Link
                    href="/backoffice/booking"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-900 underline hover:text-amber-950"
                  >
                    ไปที่หน้ารายการจอง <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-lg bg-emerald-50 p-3.5 border border-emerald-200/70">
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ไม่มีรายการค้างตรวจสอบ
                  </p>
                  <p className="mt-1 text-xs text-emerald-800">
                    รายการจองทั้งหมดได้รับการประมวลผลเรียบร้อย
                  </p>
                </div>
              )}

              {/* Quick links to system features */}
              <div className="pt-2 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  ทางลัดการทำงาน
                </p>
                <Link
                  href="/backoffice/package/create"
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <span className="flex items-center gap-2">
                    <PlaneTakeoff className="h-4 w-4 text-cyan-600" />
                    สร้างแพ็กเกจทัวร์ใหม่
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/backoffice/booking"
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <span className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-cyan-600" />
                    ตรวจสอบรายการจองทั้งหมด
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/backoffice/partner"
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <span className="flex items-center gap-2">
                    <UsersRound className="h-4 w-4 text-cyan-600" />
                    จัดการพาร์ทเนอร์ & โรงแรม
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-[11px] text-slate-400 text-center">
              Zentura Backoffice Management System v1.0
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Section: Recent Bookings Table */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-950">
              รายการจองล่าสุดในระบบ (Recent Bookings)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              คำสั่งจอง 6 รายการล่าสุดที่ลูกค้าส่งเข้ามาในระบบ
            </p>
          </div>

          <Link
            href="/backoffice/booking"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline"
          >
            ดูการจองทั้งหมด ({bookings.length} รายการ)
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">รหัสการจอง</th>
                <th className="py-3 px-4">แพ็กเกจ</th>
                <th className="py-3 px-4">ผู้ติดต่อ</th>
                <th className="py-3 px-4">วันเดินทาง</th>
                <th className="py-3 px-4">ยอดเงิน</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-center">ดูข้อมูล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-5 w-5 animate-spin text-cyan-600" />
                    <p className="mt-2 text-xs">กำลังโหลดข้อมูลการจอง...</p>
                  </td>
                </tr>
              ) : recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ยังไม่มีรายการจองในระบบ
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/60 transition cursor-pointer"
                    onClick={() => {
                      setSelectedBooking(b);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {b.booking_code}
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate">
                      <p className="font-semibold text-slate-800 truncate">
                        {b.package?.name || `Package #${b.package_id}`}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <p className="font-medium text-slate-900">{b.contact_name}</p>
                      <p className="text-[11px] text-slate-400">{b.contact_phone}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDate(b.travel_date)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ฿{formatPrice(b.total_price)}
                    </td>
                    <td className="py-3 px-4">
                      <BookingStatusBadge status={b.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(b);
                          setIsDetailModalOpen(true);
                        }}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 transition"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        updating={updatingStatus}
      />
    </div>
  );
}
