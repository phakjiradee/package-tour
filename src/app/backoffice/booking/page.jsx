"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BusFront,
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
  ReceiptText,
  Search,
  Target,
  Users,
  Wallet,
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
  { label: "ยืนยันแล้ว", value: "CONFIRMED" },
  { label: "ยกเลิกแล้ว", value: "CANCELLED" },
];

export default function BackofficeBookingPage() {
  const [packages, setPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [packageSearch, setPackageSearch] = useState("");
  const [packageStatus, setPackageStatus] = useState("ALL");
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
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

  const fetchOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);
      const response = await bookingService.getPackageOverview();
      setPackages(response.data || []);
    } catch (error) {
      console.error("Fetch booking packages error:", error);
      showToast("ไม่สามารถโหลดรายชื่อแพ็กเกจได้", "error");
    } finally { setOverviewLoading(false); }
  }, []);

  useEffect(() => {
    const readSelection = () => setSelectedPackageId(new URLSearchParams(window.location.search).get("packageId"));
    readSelection();
    window.addEventListener("popstate", readSelection);
    const load = async () => { await fetchOverview(); };
    load();
    return () => window.removeEventListener("popstate", readSelection);
  }, [fetchOverview]);

  const selectPackage = (id) => {
    const url = id ? `/backoffice/booking?packageId=${id}` : "/backoffice/booking";
    window.history.pushState({}, "", url);
    setSelectedPackageId(id ? String(id) : null);
    setSearch("");
    setStatusFilter("ALL");
    setBookings([]);
    setLoading(true);
    setPagination({ page: 1, limit: 100, total: 0, totalPages: 1 });
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Fetch bookings from backend
  const fetchBookings = useCallback(
    async (page = 1, currentSearch = "", currentStatus = "ALL") => {
      try {
        setRefreshing(true);
        const params = {
          page,
          limit: 100,
          package_id: selectedPackageId,
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
    [selectedPackageId],
  );

  useEffect(() => {
    const load = async () => { if (selectedPackageId) await fetchBookings(1, "", "ALL"); };
    load();
  }, [fetchBookings, selectedPackageId]);

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
      await Promise.all([fetchBookings(pagination.page, search, statusFilter), fetchOverview()]);
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

  const selectedPackage = packages.find((pkg) => String(pkg.id) === String(selectedPackageId));
  const summary = selectedPackage?.summary;
  const travelerGap = summary?.travelerGap;
  const afterDepositSatang = !summary?.costConfigured || summary.totalDepositSatang == null ? null : summary.confirmedBookingTotalSatang - summary.totalDepositSatang;
  const visiblePackages = packages.filter((pkg) =>
    (packageStatus === "ALL" || pkg.status === packageStatus) &&
    `${pkg.name} ${pkg.location?.name || ""}`.toLowerCase().includes(packageSearch.toLowerCase().trim()));

  if (!selectedPackageId) return (
    <div className="space-y-6">
      <PageHeader title="จัดการการจอง" titleEn="Bookings" description="เลือกแพ็กเกจเพื่อดูจำนวนผู้เดินทาง รายรับ และจุดคุ้มทุน" actions={<button type="button" onClick={fetchOverview} className="btn-secondary h-8 rounded-lg px-3 text-xs"><RefreshCw size={13} /> รีเฟรช</button>} />
      {toastMessage && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{toastMessage.message}</p>}
      <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap gap-1 border-b border-zinc-100 pb-2.5">
          {[["ALL", "ทั้งหมด"], ["Published", "เปิดขาย"], ["Draft", "ฉบับร่าง"], ["Closed", "ปิดรับจอง"], ["Archived", "เก็บถาวร"]].map(([value, label]) =>
            <button key={value} type="button" onClick={() => setPackageStatus(value)} className={`rounded-md px-3 py-1 text-xs font-semibold ${packageStatus === value ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}>{label} <span className="opacity-70">{value === "ALL" ? packages.length : packages.filter((pkg) => pkg.status === value).length}</span></button>)}
        </div>
        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input value={packageSearch} onChange={(e) => setPackageSearch(e.target.value)} placeholder="ค้นหาชื่อแพ็กเกจหรือจุดหมาย..." className="h-9 w-full rounded-md border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs outline-none focus:border-blue-500" /></div>
        <p className="border-t border-zinc-100 pt-2 text-xs text-zinc-500">แสดง {visiblePackages.length} จากทั้งหมด {packages.length} แพ็กเกจ</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-2xs">
        <table className="w-full min-w-205 text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold text-zinc-500"><tr><th className="px-5 py-3">แพ็กเกจท่องเที่ยว</th><th className="px-5 py-3">จุดหมายปลายทาง</th><th className="px-5 py-3">วันเดินทาง</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3">การจอง</th><th className="px-5 py-3 text-right">จัดการ</th></tr></thead>
          <tbody className="divide-y divide-zinc-100">
            {overviewLoading ? <tr><td colSpan={6} className="p-12 text-center text-zinc-500">กำลังโหลดแพ็กเกจ...</td></tr> : visiblePackages.length === 0 ? <tr><td colSpan={6} className="p-12 text-center text-zinc-500">ไม่พบแพ็กเกจ</td></tr> : visiblePackages.map((pkg) =>
              <tr key={pkg.id} className="hover:bg-zinc-50"><td className="px-5 py-3"><div className="flex items-center gap-3">{pkg.image ? <Image src={pkg.image} alt="" width={40} height={40} className="size-10 rounded-lg object-cover" /> : <div className="size-10 rounded-lg bg-zinc-100" />}<span className="font-semibold text-zinc-900">{pkg.name}</span></div></td><td className="px-5 py-3 text-zinc-600">{pkg.location?.name || "-"}</td><td className="px-5 py-3 text-zinc-600">{formatDate(pkg.start_date)}</td><td className="px-5 py-3"><StatusChip status={pkg.status} label={{ Published: "เปิดขาย", Draft: "ฉบับร่าง", Closed: "ปิดรับจอง", Archived: "เก็บถาวร" }[pkg.status] || pkg.status} tone={{ Published: "success", Draft: "warning", Closed: "danger" }[pkg.status] || "neutral"} /></td><td className="px-5 py-3 font-semibold text-zinc-800">{pkg.summary.bookingCount} รายการ · {pkg.summary.reservedTravelers} คน</td><td className="px-5 py-3 text-right"><button type="button" onClick={() => selectPackage(pkg.id)} className="btn-secondary rounded-md px-3 py-1.5 text-xs"><Eye size={13} /> ดูการจอง</button></td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );

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
        title={selectedPackage?.name || "กำลังโหลดแพ็กเกจ..."}
        titleEn="Bookings"
        description="ข้อมูลการจองและจุดคุ้มทุนเฉพาะแพ็กเกจนี้"
        actions={
          <div className="flex gap-2"><button type="button" onClick={() => selectPackage(null)} className="btn-secondary h-8 rounded-lg px-3 text-xs"><ChevronLeft size={13} /> แพ็กเกจทั้งหมด</button><button type="button" onClick={() => { fetchBookings(pagination.page, search, statusFilter); fetchOverview(); }} disabled={refreshing} className="btn-secondary h-8 rounded-lg px-3 text-xs"><RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> รีเฟรช</button></div>
        }
      />

      {selectedPackageId && !overviewLoading && !selectedPackage && <p role="alert" className="rounded-lg bg-rose-50 p-4 text-rose-700">ไม่พบแพ็กเกจนี้</p>}

      {/* Package summary across all bookings for this package */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="ยังไม่ยืนยัน" value={summary ? `${summary.unconfirmedBookingCount} รายการ` : "-"} icon={CalendarCheck} tone="warning" subtitle={summary ? `รวมผู้เดินทาง ${summary.unconfirmedTravelers} คน` : "กำลังโหลด"} />
        <StatCard title="ยืนยันแล้ว" value={summary ? `${summary.confirmedBookingCount} รายการ` : "-"} icon={Users} tone="success" subtitle={summary ? `รวมผู้เดินทาง ${summary.confirmedTravelers} คน` : "กำลังโหลด"} />
        <StatCard title="เป้าผู้เดินทาง" value={summary?.minimumTravelers != null ? `${summary.minimumTravelers} คน` : "ยังไม่ตั้ง"} icon={Target} tone="blue" subtitle="ตั้งขั้นต่ำในหน้าแก้ไขแพ็กเกจ" />
        <StatCard title="ส่วนต่างจากเป้า" value={travelerGap != null ? `${travelerGap > 0 ? "+" : travelerGap < 0 ? "−" : ""}${Math.abs(travelerGap)} คน` : "-"} icon={Users} tone={travelerGap < 0 ? "danger" : travelerGap >= 0 ? "success" : undefined} subtitle="ผู้เดินทางที่ยืนยันแล้ว − เป้าผู้เดินทาง" />
        <StatCard title="ที่นั่งรถที่เลือก" value={summary?.targetTravelers != null ? `${summary.targetTravelers} ที่นั่ง` : "-"} icon={BusFront} tone="blue" subtitle="ความจุรวมของรถในแพ็กเกจ" />
        <StatCard title="ยอดจองที่ยืนยัน" value={summary ? `฿${formatPrice(summary.confirmedBookingTotalSatang / 100)}` : "-"} icon={DollarSign} tone="blue" subtitle="มูลค่าการจอง ไม่ใช่ยอดเงินเข้าธนาคาร" />
        <StatCard title="มัดจำที่ตกลง" value={summary?.costConfigured && summary.totalDepositSatang != null ? `฿${formatPrice(summary.totalDepositSatang / 100)}` : "ยังไม่ตั้ง"} icon={Wallet} tone="blue" subtitle="รวมมัดจำผู้ให้บริการตามแผน" />
        <StatCard title="ต้นทุนรวม(ค่าใช้จ่ายสถานที่)" value={summary?.costConfigured && summary.costAtMinimumSatang != null ? `฿${formatPrice(summary.costAtMinimumSatang / 100)}` : "ยังไม่ตั้ง"} icon={ReceiptText} tone="blue" subtitle="คำนวณตามเป้าหมายขั้นต่ำ" />
        <StatCard title="ส่วนต่างยอดจอง–มัดจำ" value={afterDepositSatang != null ? `${afterDepositSatang < 0 ? "−" : ""}฿${formatPrice(Math.abs(afterDepositSatang) / 100)}` : "-"} icon={DollarSign} tone={afterDepositSatang < 0 ? "danger" : afterDepositSatang > 0 ? "success" : undefined} subtitle="ยอดจองที่ยืนยัน − มัดจำที่ตกลง" />
      </div>

      {summary && <div className="space-y-2">
        {(summary.unverifiedBookingCount > 0 || summary.exceptionCount > 0) && <div role="status" className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><AlertTriangle size={17} className="mt-0.5 shrink-0" /><div>{summary.unverifiedBookingCount > 0 && <p>มี {summary.unverifiedBookingCount} รายการชำระแบบทดสอบหรือข้อมูลเก่าที่ยังยืนยันแหล่งเงินไม่ได้ ยอดจองที่ยืนยันและส่วนต่างกับมัดจำเป็นมูลค่าการจองตามระบบ ไม่ใช่เงินรับที่ตรวจสอบแล้ว</p>}{summary.exceptionCount > 0 && <p>มีข้อมูลเก่า {summary.exceptionCount} รายการในสถานะรอตรวจสอบ โปรดตรวจสอบการชำระเงินจริงก่อนเปลี่ยนสถานะ</p>}</div></div>}
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500">ยอดชำระในระบบยังไม่ใช่รายงานกระทบยอดธนาคาร</p>
      </div>}

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
                onClick={() => { setStatusFilter(tab.value); fetchBookings(1, search, tab.value); }}
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
        updating={updatingStatus}
      />
    </div>
  );
}
