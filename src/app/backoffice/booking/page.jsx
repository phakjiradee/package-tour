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
  Layers,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Tag,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { bookingService } from "@/service/booking";
import { BookingStatusBadge } from "@/components/ui/Badges";
import BookingDetailModal from "@/components/booking/BookingDetailModal";

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
    [search, statusFilter]
  );

  useEffect(() => {
    fetchBookings(1, search, statusFilter);
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
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );

      // If modal is open with this booking, update it too
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Update status error:", err);
      showToast(err.response?.data?.message || "ไม่สามารถอัปเดตสถานะได้", "error");
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
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all ${
            toastMessage.type === "error" ? "bg-rose-600" : "bg-emerald-600"
          }`}
        >
          {toastMessage.type === "error" ? (
            <XCircle className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ระบบจัดการการจองทัวร์
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            ตรวจสอบรายการจอง ตรวจสอบข้อมูลผู้เดินทาง และจัดการสถานะการจองทั้งหมดในระบบ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchBookings(pagination.page, search, statusFilter)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-500 ${refreshing ? "animate-spin" : ""}`}
            />
            รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Bookings */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              การจองทั้งหมด
            </p>
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-950">
            {statsOverview.total}
          </p>
          <p className="mt-1 text-xs text-slate-400">รายการจองในระบบ</p>
        </div>

        {/* Pending Payment */}
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/20 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              รอชำระเงิน
            </p>
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-800">
            {statsOverview.pending}
          </p>
          <p className="mt-1 text-xs text-amber-600/80">รอลูกค้าโอนเงิน</p>
        </div>

        {/* Confirmed */}
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/20 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              ยืนยันการจองแล้ว
            </p>
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-emerald-800">
            {statsOverview.confirmed}
          </p>
          <p className="mt-1 text-xs text-emerald-600/80">พร้อมออกเดินทาง</p>
        </div>

        {/* Total Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              ยอดเงินที่ยืนยันแล้ว
            </p>
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-950">
            ฿{formatPrice(statsOverview.revenue)}
          </p>
          <p className="mt-1 text-xs text-slate-400">จากรายการที่ยืนยันแล้วในหน้านี้</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาตามรหัสการจอง (ZT-...), ชื่อลูกค้า, เบอร์โทร หรืออีเมล..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
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
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              ล้าง
            </button>
          )}
        </form>
      </div>

      {/* Bookings Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">รหัสการจอง</th>
                <th className="py-3.5 px-4">แพ็กเกจทัวร์</th>
                <th className="py-3.5 px-4">ผู้ติดต่อ</th>
                <th className="py-3.5 px-4">วันเดินทาง / ผู้โดยสาร</th>
                <th className="py-3.5 px-4">ยอดรวม</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-cyan-600" />
                    <p className="mt-2 text-xs">กำลังโหลดข้อมูลการจอง...</p>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <CalendarCheck className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-2 font-medium">ไม่พบรายการจองตามเงื่อนไข</p>
                    <p className="text-xs text-slate-400">
                      ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ
                    </p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-slate-50/60 transition group cursor-pointer"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    {/* Booking Code */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {booking.booking_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(booking.booking_code)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                          title="คัดลอกรหัส"
                        >
                          {copiedCode === booking.booking_code ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(booking.createdAt)}
                      </p>
                    </td>

                    {/* Package */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        {booking.package?.image ? (
                          <img
                            src={booking.package.image}
                            alt=""
                            className="h-10 w-12 shrink-0 rounded-lg object-cover border border-slate-100"
                          />
                        ) : (
                          <div className="grid h-10 w-12 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400">
                            <MapPin className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate text-xs sm:text-sm">
                            {booking.package?.name || `Package #${booking.package_id}`}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            ID: #{booking.package_id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Person */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {booking.contact_name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {booking.contact_phone}
                      </p>
                    </td>

                    {/* Travel Date & Passengers */}
                    <td className="py-3.5 px-4">
                      <p className="text-xs font-medium text-slate-800 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-cyan-600" />
                        {formatDate(booking.travel_date)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Users className="h-3 w-3 text-slate-400" />
                        ผู้ใหญ่ {booking.adult_count}
                        {booking.child_count > 0 && `, เด็ก ${booking.child_count}`} ท่าน
                      </p>
                    </td>

                    {/* Total Price */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">
                        ฿{formatPrice(booking.total_price)}
                      </p>
                      {booking.addon_total > 0 && (
                        <p className="text-[10px] text-slate-400">
                          รวม Add-ons ฿{formatPrice(booking.addon_total)}
                        </p>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <BookingStatusBadge status={booking.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsDetailModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-cyan-600 transition shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          ดูรายละเอียด
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
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 sm:px-6">
            <p className="text-xs text-slate-500">
              หน้า <span className="font-bold text-slate-700">{pagination.page}</span> จาก{" "}
              <span className="font-bold text-slate-700">{pagination.totalPages}</span> (ทั้งหมด{" "}
              {pagination.total} รายการ)
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!pagination.hasPrevPage}
                onClick={() => fetchBookings(pagination.page - 1, search, statusFilter)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => fetchBookings(pagination.page + 1, search, statusFilter)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="h-4 w-4" />
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
        updating={updatingStatus}
      />
    </div>
  );
}
