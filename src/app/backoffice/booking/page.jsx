"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  DollarSign,
  Eye,
  Filter,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import { bookingService } from "@/service/booking";
import BookingDetailModal from "@/components/booking/BookingDetailModal";
import PageHeader from "@/components/backoffice/PageHeader";
import StatCard from "@/components/backoffice/StatCard";
import TwoToneCard from "@/components/backoffice/TwoToneCard";
import StatusChip from "@/components/backoffice/StatusChip";
import Image from "next/image";

const STATUS_TABS = [
  { label: "ทั้งหมด", value: "ALL" },
  { label: "รอชำระเงิน", value: "PENDING_PAYMENT" },
  { label: "รอตรวจสอบ", value: "AWAITING_VERIFICATION" },
  { label: "ยืนยันแล้ว", value: "CONFIRMED" },
  { label: "ยกเลิกแล้ว", value: "CANCELLED" },
];

export default function BackofficeBookingPage() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selected booking for Detail Modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Quick copy feedback
  const [copiedCode, setCopiedCode] = useState(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Fetch bookings from backend
  const fetchBookings = useCallback(
    async (page = 1, currentSearch = search, currentStatus = statusFilter) => {
      try {
        setRefreshing(true);
        const params = {
          page,
          limit: 10,
        };
        if (currentSearch.trim()) {
          params.search = currentSearch.trim();
        }
        if (currentStatus && currentStatus !== "ALL") {
          params.status = currentStatus;
        }

        const res = await bookingService.getAll(params);
        if (res && res.success) {
          setBookings(res.data || []);
          if (res.pagination) {
            setPagination(res.pagination);
          }
        }
      } catch (err) {
        console.error("Fetch bookings error:", err);
        showToast("ไม่สามารถดึงข้อมูลรายการจองได้", "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, statusFilter],
  );

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      await fetchBookings(1, search, statusFilter);
    };
    run();
    return () => {
      ignore = true;
    };
  }, [fetchBookings, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings(1, search, statusFilter);
  };

  // Update status handler
  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      setUpdatingStatus(true);
      await bookingService.updateStatus(bookingId, newStatus);
      showToast("อัปเดตสถานะการจองสำเร็จ");

      // Update in local state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)),
      );

      // If modal is open with this booking, update it too
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Update status error:", err);
      showToast(
        err.response?.data?.message || "ไม่สามารถอัปเดตสถานะได้",
        "error",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Mock payment handler for Backoffice
  const handleMockPay = async (bookingCode) => {
    try {
      setUpdatingStatus(true);
      const res = await bookingService.mockPay(bookingCode);
      showToast("จำลองการชำระเงินสำเร็จแล้ว");

      // Refetch table data
      fetchBookings(pagination.page, search, statusFilter);

      // Refresh currently open modal booking
      if (selectedBooking && selectedBooking.booking_code === bookingCode) {
        const fresh = await bookingService.getByCode(bookingCode);
        if (fresh?.data) {
          setSelectedBooking(fresh.data);
        }
      }
    } catch (err) {
      console.error("Backoffice mock pay error:", err);
      showToast(
        err.response?.data?.message || "ไม่สามารถจำลองการชำระเงินได้",
        "error",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Formatters
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (val) => {
    return Number(val || 0).toLocaleString("th-TH");
  };

  // Calculate high-level stats from current list & total
  const statsOverview = useMemo(() => {
    const totalCount = pagination.total || bookings.length;
    let pendingCount = 0;
    let awaitingCount = 0;
    let confirmedCount = 0;
    let totalRevenue = 0;

    bookings.forEach((b) => {
      if (b.status === "PENDING_PAYMENT") pendingCount++;
      if (b.status === "AWAITING_VERIFICATION") awaitingCount++;
      if (b.status === "CONFIRMED") {
        confirmedCount++;
        totalRevenue += Number(b.total_price || 0);
      }
    });

    return {
      total: totalCount,
      pending: pendingCount,
      awaiting: awaitingCount,
      confirmed: confirmedCount,
      revenue: totalRevenue,
    };
  }, [bookings, pagination.total]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-white shadow-xl transition-all ${
            toastMessage.type === "error" ? "bg-rose-600" : "bg-emerald-600"
          }`}
        >
          {toastMessage.type === "error" ? (
            <XCircle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="จัดการการจอง"
        titleEn="Bookings"
        description="ตรวจสอบคำสั่งจองแพ็กเกจทัวร์ ตรวจสอบยอดเงิน และบริหารจัดการสถานะการเดินทาง"
        actions={
          <button
            type="button"
            onClick={() => fetchBookings(pagination.page, search, statusFilter)}
            disabled={refreshing}
            className="btn-secondary h-8 px-3 text-xs rounded-lg cursor-pointer"
          >
            <RefreshCw
              size={13}
              className={
                refreshing ? "animate-spin text-zinc-500" : "text-zinc-500"
              }
            />
            <span>รีเฟรช</span>
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Bookings */}
        <StatCard
          title="การจองทั้งหมด"
          label="การจองทั้งหมด"
          value={statsOverview.total}
          icon={CalendarCheck}
          subtitle="รายการจองในระบบ"
        />

        {/* Pending Payment */}
        <StatCard
          title="รอชำระเงิน"
          label="รอชำระเงิน"
          value={statsOverview.pending}
          icon={Clock}
          tone="warning"
          subtitle="รอลูกค้าโอนเงิน"
        />

        {/* Confirmed */}
        <StatCard
          title="ยืนยันการจองแล้ว"
          label="ยืนยันการจองแล้ว"
          value={statsOverview.confirmed}
          icon={CheckCircle2}
          subtitle="พร้อมออกเดินทาง"
          trendBadge={{
            text: "สำเร็จ",
            tone: "success",
          }}
        />

        {/* Total Revenue */}
        <StatCard
          title="ยอดเงินที่ยืนยันแล้ว"
          label="ยอดเงินที่ยืนยันแล้ว"
          value={`฿${formatPrice(statsOverview.revenue)}`}
          icon={DollarSign}
          subtitle="จากรายการที่ยืนยันในหน้านี้"
        />
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg border border-zinc-200/90 bg-white p-3.5 shadow-2xs space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-zinc-100 pb-2.5">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition cursor-pointer select-none ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-2xs"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="ค้นหาตามรหัสการจอง, ชื่อลูกค้า, เบอร์โทร หรืออีเมล..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-zinc-200/90 bg-zinc-50/60 py-1.5 pl-8.5 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#0051c8] focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="btn-primary h-8 px-3.5 text-xs rounded-md cursor-pointer"
          >
            ค้นหา
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                fetchBookings(1, "", statusFilter);
              }}
              className="btn-secondary h-8 px-3 text-xs rounded-md cursor-pointer"
            >
              ล้าง
            </button>
          )}
        </form>
      </div>

      {/* Bookings Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-200/90 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200/90 bg-zinc-50/70 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">แพ็กเกจทัวร์</th>
                <th className="py-2.5 px-4">ผู้ติดต่อ</th>
                <th className="py-2.5 px-4">วันเดินทาง / ผู้โดยสาร</th>
                <th className="py-2.5 px-4">ยอดรวม</th>
                <th className="py-2.5 px-4">สถานะ</th>
                <th className="py-2.5 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <RefreshCw className="mx-auto size-5 animate-spin text-[#0051c8]" />
                    <p className="mt-2 text-xs text-zinc-500">
                      กำลังโหลดข้อมูลการจอง...
                    </p>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <CalendarCheck className="mx-auto size-8 text-zinc-300" />
                    <p className="mt-2 font-medium text-zinc-800">
                      ไม่พบรายการจองตามเงื่อนไข
                    </p>
                    <p className="text-xs text-zinc-400">
                      ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ
                    </p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-zinc-50/70 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    {/* Package */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-2.5">
                        {booking.package?.image ? (
                          <Image
                            width={32}
                            height={32}
                            src={booking.package.image}
                            alt=""
                            className="size-9 shrink-0 rounded-md object-cover border border-zinc-200/70"
                          />
                        ) : (
                          <div className="grid size-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-400">
                            <MapPin size={14} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900 truncate text-xs">
                            {booking.package?.name || "แพ็กเกจทัวร์"}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            จองเมื่อ {formatDate(booking.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Person */}
                    <td className="py-3 px-4">
                      <p className="font-medium text-zinc-900 text-xs">
                        {booking.contact_name}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
                        <Phone size={11} className="text-zinc-400" />
                        <span>{booking.contact_phone}</span>
                      </p>
                    </td>

                    {/* Travel Date & Passengers */}
                    <td className="py-3 px-4">
                      <p className="text-xs font-medium text-zinc-800 flex items-center gap-1">
                        <Calendar size={12} className="text-[#0051c8]" />
                        <span>{formatDate(booking.travel_date)}</span>
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                        <Users size={11} className="text-zinc-400" />
                        <span>
                          ผู้ใหญ่ {booking.adult_count}
                          {booking.child_count > 0 &&
                            `, เด็ก ${booking.child_count}`}{" "}
                          ท่าน
                        </span>
                      </p>
                    </td>

                    {/* Total Price */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-zinc-900 tabular-nums">
                        ฿{formatPrice(booking.total_price)}
                      </p>
                      {booking.addon_total > 0 && (
                        <p className="text-[10px] text-zinc-400">
                          รวม Add-ons ฿{formatPrice(booking.addon_total)}
                        </p>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <StatusChip status={booking.status} />
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsDetailModalOpen(true);
                          }}
                          className="btn-secondary h-7 px-2.5 text-xs rounded-md cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>ดูข้อมูล</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200/90 bg-zinc-50/60 px-4 py-2.5 text-xs">
            <p className="text-zinc-500">
              หน้า{" "}
              <span className="font-semibold text-zinc-900">
                {pagination.page}
              </span>{" "}
              จาก{" "}
              <span className="font-semibold text-zinc-900">
                {pagination.totalPages}
              </span>{" "}
              (ทั้งหมด {pagination.total} รายการ)
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!pagination.hasPrevPage}
                onClick={() =>
                  fetchBookings(pagination.page - 1, search, statusFilter)
                }
                className="btn-secondary size-7 p-0 flex items-center justify-center rounded-md cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() =>
                  fetchBookings(pagination.page + 1, search, statusFilter)
                }
                className="btn-secondary size-7 p-0 flex items-center justify-center rounded-md cursor-pointer disabled:opacity-40"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onMockPay={handleMockPay}
        updating={updatingStatus}
      />
    </div>
  );
}
