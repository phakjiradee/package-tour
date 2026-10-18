"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Eye,
  PlaneTakeoff,
  RefreshCw,
  TrendingUp,
  UsersRound,
  XCircle,
} from "lucide-react";
import { bookingService } from "@/service/booking";
import BookingDetailModal from "@/components/booking/BookingDetailModal";
import { api } from "@/lib/axios";
import PageHeader from "@/components/backoffice/PageHeader";
import StatCard from "@/components/backoffice/StatCard";
import TwoToneCard from "@/components/backoffice/TwoToneCard";
import StatusChip from "@/components/backoffice/StatusChip";
import BookingTrendsChart from "@/components/backoffice/BookingTrendsChart";

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
    let ignore = false;
    const run = async () => {
      await fetchData();
    };
    run();
    return () => {
      ignore = true;
    };
  }, [fetchData]);

  // Update status
  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      setUpdatingStatus(true);
      await bookingService.updateStatus(bookingId, newStatus);
      // Refresh local bookings state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)),
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

    const confirmedRevenue = bookings
      .filter((b) => b.status === "CONFIRMED")
      .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

    const pendingCount = bookings.filter(
      (b) =>
        b.status === "PENDING_PAYMENT" || b.status === "AWAITING_VERIFICATION",
    ).length;

    const confirmedCount = bookings.filter(
      (b) => b.status === "CONFIRMED",
    ).length;
    const cancelledCount = bookings.filter(
      (b) => b.status === "CANCELLED",
    ).length;

    const activePackagesCount = packages.filter(
      (p) => p.status === "Published" || !p.status,
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
      const fullDate = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });

      const dayBookings = bookings.filter((b) => {
        if (!b.createdAt) return false;
        return new Date(b.createdAt).toISOString().slice(0, 10) === dateStr;
      });

      const count = dayBookings.length;
      const confirmedCount = dayBookings.filter((b) => b.status === "CONFIRMED").length;

      days.push({
        label,
        fullDate,
        dateStr,
        count,
        confirmedCount,
      });
    }

    return days;
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
      {/* Top Welcome Bar */}
      <PageHeader
        title="แดชบอร์ด"
        titleEn="Dashboard"
        description="ภาพรวมสถิติยอดจอง รายรับ และการดำเนินงานทั้งหมดของ Zentura Tour"
        showDate
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={refreshing}
              className="btn-secondary h-8 px-3 text-xs rounded-lg cursor-pointer"
            >
              <RefreshCw
                size={13}
                className={
                  refreshing ? "animate-spin text-zinc-500" : "text-zinc-500"
                }
              />
              <span>รีเฟรชข้อมูล</span>
            </button>

            <Link
              href="/backoffice/booking"
              className="btn-primary h-8 px-3 text-xs rounded-lg cursor-pointer"
            >
              <CalendarCheck size={13} />
              <span>จัดการรายการจอง</span>
            </Link>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Bookings */}
        <StatCard
          title="ยอดการจองทั้งหมด"
          label="ยอดการจองทั้งหมด"
          value={loading ? "-" : kpis.totalBookings}
          icon={CalendarDays}
          trendBadge={{
            text: `ยืนยันแล้ว ${kpis.confirmedCount}`,
            tone: "success",
          }}
          meterSegments={[
            {
              percent: kpis.totalBookings
                ? Math.round((kpis.confirmedCount / kpis.totalBookings) * 100)
                : 0,
              color: "bg-emerald-500",
            },
            {
              percent: kpis.totalBookings
                ? Math.round((kpis.pendingCount / kpis.totalBookings) * 100)
                : 0,
              color: "bg-amber-500",
            },
            {
              percent: kpis.totalBookings
                ? Math.round((kpis.cancelledCount / kpis.totalBookings) * 100)
                : 0,
              color: "bg-rose-400",
            },
          ]}
          footer={
            <Link
              href="/backoffice/booking"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0051c8] hover:underline"
            >
              ดูรายการจองทั้งหมด <ArrowRight size={11} />
            </Link>
          }
        />

        {/* Confirmed Revenue */}
        <StatCard
          title="รายได้ที่ยืนยันแล้ว"
          label="รายได้ที่ยืนยันแล้ว"
          value={loading ? "-" : `฿${formatPrice(kpis.confirmedRevenue)}`}
          icon={CircleDollarSign}
          badgeText="CONFIRMED"
          trendBadge={{
            text: `${kpis.confirmedCount} ใบเสร็จ`,
            tone: "neutral",
          }}
          footer={
            <span className="text-[11px] text-zinc-400">
              คำนวณเฉพาะคำสั่งซื้อสถานะ Confirmed
            </span>
          }
        />

        {/* Pending Actions */}
        <StatCard
          title="รอชำระ / รอตรวจสอบ"
          label="รอชำระ / รอตรวจสอบ"
          value={loading ? "-" : kpis.pendingCount}
          icon={Clock}
          tone="warning"
          trendBadge={{
            text: kpis.pendingCount > 0 ? "ต้องดำเนินการ" : "ปกติ",
            tone: kpis.pendingCount > 0 ? "warning" : "success",
          }}
          footer={
            <Link
              href="/backoffice/booking?status=AWAITING_VERIFICATION"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline"
            >
              ตรวจสอบเลย <ArrowRight size={11} />
            </Link>
          }
        />

        {/* Active Packages */}
        <StatCard
          title="แพ็กเกจทัวร์ในระบบ"
          label="แพ็กเกจทัวร์ในระบบ"
          value={loading ? "-" : kpis.activePackagesCount}
          icon={PlaneTakeoff}
          trendBadge={{
            text: "เปิดบริการ",
            tone: "neutral",
          }}
          footer={
            <Link
              href="/backoffice/package"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0051c8] hover:underline"
            >
              จัดการแพ็กเกจ <ArrowRight size={11} />
            </Link>
          }
        />
      </section>

      {/* Middle Section: Booking Trends & Operations Overview */}
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        {/* Activity Chart & Trends */}
        <TwoToneCard
          title="สถิติการทำรายการจอง (7 วันล่าสุด)"
          titleEn="7-Day Trends"
          action={
            <Link
              href="/backoffice/booking"
              className="btn-secondary h-7 px-2.5 text-[11px] rounded-md"
            >
              <span>ดูข้อมูลทั้งหมด</span>
            </Link>
          }
        >
          {/* Recharts Area Chart */}
          <BookingTrendsChart data={activityDays} />

          {/* Status Breakdown Bar */}
          <div className="mt-5 pt-4 border-t border-zinc-100">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
              สัดส่วนสถานะการจองในระบบ
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Link
                href="/backoffice/booking?status=CONFIRMED"
                className="rounded-lg bg-emerald-50/60 p-2.5 border border-emerald-100 hover:bg-emerald-100/60 transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 size={13} />
                  <span>ยืนยันแล้ว</span>
                </div>
                <p className="mt-1 text-lg font-bold text-emerald-900 tabular-nums">
                  {kpis.confirmedCount}
                </p>
              </Link>

              <Link
                href="/backoffice/booking?status=PENDING_PAYMENT"
                className="rounded-lg bg-amber-50/60 p-2.5 border border-amber-100 hover:bg-amber-100/60 transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <Clock size={13} />
                  <span>รอชำระเงิน</span>
                </div>
                <p className="mt-1 text-lg font-bold text-amber-900 tabular-nums">
                  {
                    bookings.filter((b) => b.status === "PENDING_PAYMENT")
                      .length
                  }
                </p>
              </Link>

              <Link
                href="/backoffice/booking?status=AWAITING_VERIFICATION"
                className="rounded-lg bg-sky-50/60 p-2.5 border border-sky-100 hover:bg-sky-100/60 transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800">
                  <Clock size={13} />
                  <span>รอตรวจสอบ</span>
                </div>
                <p className="mt-1 text-lg font-bold text-sky-900 tabular-nums">
                  {
                    bookings.filter((b) => b.status === "AWAITING_VERIFICATION")
                      .length
                  }
                </p>
              </Link>

              <Link
                href="/backoffice/booking?status=CANCELLED"
                className="rounded-lg bg-rose-50/60 p-2.5 border border-rose-100 hover:bg-rose-100/60 transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                  <XCircle size={13} />
                  <span>ยกเลิกแล้ว</span>
                </div>
                <p className="mt-1 text-lg font-bold text-rose-900 tabular-nums">
                  {kpis.cancelledCount}
                </p>
              </Link>
            </div>
          </div>
        </TwoToneCard>

        {/* Quick Operations / Activity */}
        <TwoToneCard title="การแจ้งเตือน & ทางลัด" titleEn="Quick Actions">
          <div className="space-y-3.5">
            {kpis.pendingCount > 0 ? (
              <div className="rounded-lg bg-amber-50/80 p-3 border border-amber-200/70">
                <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-600 shrink-0" />
                  <span>รอการตรวจสอบ {kpis.pendingCount} รายการ</span>
                </p>
                <p className="mt-1 text-[11px] text-amber-800/50 leading-relaxed">
                  มีรายการจองรอการยืนยันสถานะ
                  กรุณาเข้าไปตรวจสอบยอดเงินและยืนยันการจอง
                </p>
                <Link
                  href="/backoffice/booking"
                  className="mt-2 inline-flex w-full justify-end items-center gap-1 text-[11px] font-semibold text-amber-900 hover:underline"
                >
                  ไปที่หน้ารายการจอง <ArrowRight size={11} />
                </Link>
              </div>
            ) : (
              <div className="rounded-lg bg-emerald-50/80 p-3 border border-emerald-200/70">
                <p className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2
                    size={13}
                    className="text-emerald-600 shrink-0"
                  />
                  <span>ไม่มีรายการค้างตรวจสอบ</span>
                </p>
                <p className="mt-1 text-[11px] text-emerald-800">
                  รายการจองทั้งหมดได้รับการประมวลผลเรียบร้อย
                </p>
              </div>
            )}

            {/* Quick links to system features */}
            <div className="pt-1 space-y-1.5">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                ทางลัดระบบ
              </p>
              <Link
                href="/backoffice/package/create"
                className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-zinc-50/60 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition"
              >
                <span className="flex items-center gap-2">
                  <PlaneTakeoff size={14} className="text-[#0051c8]" />
                  <span>สร้างแพ็กเกจทัวร์ใหม่</span>
                </span>
                <ArrowRight size={12} className="text-zinc-400" />
              </Link>

              <Link
                href="/backoffice/booking"
                className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-zinc-50/60 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition"
              >
                <span className="flex items-center gap-2">
                  <CalendarCheck size={14} className="text-[#0051c8]" />
                  <span>ตรวจสอบรายการจองทั้งหมด</span>
                </span>
                <ArrowRight size={12} className="text-zinc-400" />
              </Link>

              <Link
                href="/backoffice/partner"
                className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-zinc-50/60 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition"
              >
                <span className="flex items-center gap-2">
                  <UsersRound size={14} className="text-[#0051c8]" />
                  <span>จัดการพาร์ทเนอร์ & โรงแรม</span>
                </span>
                <ArrowRight size={12} className="text-zinc-400" />
              </Link>
            </div>
          </div>
        </TwoToneCard>
      </section>

      {/* Bottom Section: Recent Bookings Table */}
      <TwoToneCard
        title="รายการจองล่าสุดในระบบ"
        titleEn="Recent Bookings"
        action={
          <Link
            href="/backoffice/booking"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0051c8] hover:underline"
          >
            ดูการจองทั้งหมด ({bookings.length} รายการ)
            <ArrowRight size={12} />
          </Link>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/90 bg-zinc-50/70 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">แพ็กเกจ</th>
                <th className="py-2.5 px-4">ผู้ติดต่อ</th>
                <th className="py-2.5 px-4">วันเดินทาง</th>
                <th className="py-2.5 px-4">ยอดเงิน</th>
                <th className="py-2.5 px-4">สถานะ</th>
                <th className="py-2.5 px-4 text-center">ดูข้อมูล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-400">
                    <RefreshCw className="mx-auto size-5 animate-spin text-[#0051c8]" />
                    <p className="mt-2 text-xs text-zinc-500">
                      กำลังโหลดข้อมูลการจอง...
                    </p>
                  </td>
                </tr>
              ) : recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400">
                    ยังไม่มีรายการจองในระบบ
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-zinc-50/70 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedBooking(b);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <td className="py-3 px-4 max-w-50 truncate">
                      <p className="font-medium text-zinc-900 truncate">
                        {b.package?.name || "แพ็กเกจทัวร์"}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        จองเมื่อ {formatDate(b.createdAt)}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-zinc-700">
                      <p className="font-medium text-zinc-900">
                        {b.contact_name}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {b.contact_phone}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-zinc-600">
                      {formatDate(b.travel_date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-900 tabular-nums">
                      ฿{formatPrice(b.total_price)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusChip status={b.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(b);
                          setIsDetailModalOpen(true);
                        }}
                        className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TwoToneCard>

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
