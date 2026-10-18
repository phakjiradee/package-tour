"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  Filter,
  ArrowUpDown,
  MapPin,
  RotateCcw,
  Package2,
  ImageIcon,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  Archive,
  AlertCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import FeedbackModal from "@/components/ui/FeedbackModal";
import PageHeader from "@/components/backoffice/PageHeader";
import StatCard from "@/components/backoffice/StatCard";

export default function PackagePage() {
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    confirmText: "ตกลง",
    cancelText: null,
    onConfirm: null,
  });

  const fetchPackages = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/packages");
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Extract unique destinations for filter dropdown
  const uniqueDestinations = useMemo(() => {
    const map = new Map();
    packages.forEach((pkg) => {
      if (pkg.location?.name) {
        map.set(pkg.location.name, pkg.location.name);
      }
    });
    return Array.from(map.values()).sort();
  }, [packages]);

  // Compute status counts for filter tabs
  const statusCounts = useMemo(() => {
    return {
      all: packages.length,
      Published: packages.filter((p) => p.status === "Published").length,
      Draft: packages.filter((p) => p.status === "Draft").length,
      Closed: packages.filter((p) => p.status === "Closed").length,
      Archived: packages.filter((p) => p.status === "Archived").length,
    };
  }, [packages]);

  // Filtered & Sorted Packages
  const filteredPackages = useMemo(() => {
    return packages
      .filter((pkg) => {
        // 1. Search Query filter (matches Name, Destination, or Partner)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const nameMatch = pkg.name?.toLowerCase().includes(query);
          const locationMatch = pkg.location?.name?.toLowerCase().includes(query);
          const partnerMatch =
            (pkg.partners &&
              pkg.partners.some((p) =>
                p.partner?.name?.toLowerCase().includes(query)
              )) ||
            pkg.partner?.name?.toLowerCase().includes(query);

          if (!nameMatch && !locationMatch && !partnerMatch) {
            return false;
          }
        }

        // 2. Status filter
        if (statusFilter !== "all") {
          if (pkg.status !== statusFilter) {
            return false;
          }
        }

        // 3. Destination filter
        if (destinationFilter !== "all") {
          if (pkg.location?.name !== destinationFilter) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") {
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        }
        if (sortBy === "price_desc") {
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        }
        if (sortBy === "name_asc") {
          return (a.name || "").localeCompare(b.name || "", "th");
        }
        if (sortBy === "oldest") {
          return (Number(a.id) || 0) - (Number(b.id) || 0);
        }
        // default: newest first (by id descending or created_at)
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });
  }, [packages, searchQuery, statusFilter, destinationFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    destinationFilter !== "all" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDestinationFilter("all");
    setSortBy("newest");
  };

  const handleDeleteClick = (item) => {
    setFeedbackModal({
      isOpen: true,
      type: "error",
      title: "ยืนยันการลบแพ็กเกจ",
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบแพ็กเกจ "${item.name}"? การดำเนินการนี้จะลบข้อมูลที่เกี่ยวข้องและไม่สามารถกู้คืนได้`,
      confirmText: "ยืนยันลบข้อมูล",
      cancelText: "ยกเลิก",
      onConfirm: async () => {
        setFeedbackModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`http://localhost:4000/api/packages/${item.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            fetchPackages();
          }
        } catch (error) {
          console.error(error);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="คลังแพ็กเกจท่องเที่ยว"
        titleEn="Packages"
        description="จัดการรายการแพ็กเกจทัวร์ ตรวจสอบสถานะการขาย ราคาเริ่มต้น และผู้ให้บริการร่วม"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchPackages}
              disabled={isLoading}
              className="btn-secondary h-8 px-3 text-xs rounded-lg cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw
                size={13}
                className={isLoading ? "animate-spin text-zinc-500" : "text-zinc-500"}
              />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>

            <Link
              href="/backoffice/package/create"
              className="btn-primary h-8 px-3.5 text-xs rounded-lg cursor-pointer"
            >
              <Plus size={13} />
              <span>สร้างแพ็กเกจใหม่</span>
            </Link>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Packages */}
        <StatCard
          title="แพ็กเกจทั้งหมด"
          label="แพ็กเกจทั้งหมด"
          value={isLoading ? "-" : `${statusCounts.all} รายการ`}
          icon={Package2}
          subtitle={`เก็บถาวร ${statusCounts.Archived} รายการ`}
          onClick={() => setStatusFilter("all")}
          active={statusFilter === "all"}
        />

        {/* Published */}
        <StatCard
          title="เปิดขาย"
          label="เปิดขาย"
          value={isLoading ? "-" : `${statusCounts.Published} รายการ`}
          icon={CheckCircle2}
          tone="success"
          trendBadge={{
            text: "เปิดขาย",
            tone: "success",
          }}
          subtitle="เปิดขายและให้จองบนเว็บไซต์"
          onClick={() => setStatusFilter("Published")}
          active={statusFilter === "Published"}
        />

        {/* Draft */}
        <StatCard
          title="ฉบับร่าง"
          label="ฉบับร่าง"
          value={isLoading ? "-" : `${statusCounts.Draft} รายการ`}
          icon={FileText}
          tone="warning"
          trendBadge={{
            text: "ฉบับร่าง",
            tone: "warning",
          }}
          subtitle="ยังไม่เผยแพร่ต่อลูกค้า"
          onClick={() => setStatusFilter("Draft")}
          active={statusFilter === "Draft"}
        />

        {/* Closed */}
        <StatCard
          title="ปิดรับจอง"
          label="ปิดรับจอง"
          value={isLoading ? "-" : `${statusCounts.Closed} รายการ`}
          icon={XCircle}
          tone="danger"
          trendBadge={{
            text: "ปิดรับจอง",
            tone: "danger",
          }}
          subtitle="ปิดรับจองชั่วคราวหรือเต็ม"
          onClick={() => setStatusFilter("Closed")}
          active={statusFilter === "Closed"}
        />
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg border border-zinc-200/90 bg-white p-3.5 shadow-2xs space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-zinc-100 pb-2.5">
          {[
            { id: "all", label: "ทั้งหมด", count: statusCounts.all },
            { id: "Published", label: "เปิดขาย", count: statusCounts.Published },
            { id: "Draft", label: "ฉบับร่าง", count: statusCounts.Draft },
            { id: "Closed", label: "ปิดรับจอง", count: statusCounts.Closed },
            { id: "Archived", label: "เก็บถาวร", count: statusCounts.Archived },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition cursor-pointer select-none ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-2xs"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-zinc-200/70 text-zinc-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Search input */}
          <div className="relative flex-1 min-w-60 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อแพ็กเกจ, จุดหมาย, หรือพาร์ทเนอร์..."
              className="h-8.5 w-full rounded-md border border-zinc-200 bg-zinc-50/70 pl-8.5 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-[#0051c8] focus:bg-white focus:ring-2 focus:ring-[#0051c8]/10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                title="ล้างข้อความค้นหา"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right: Destination dropdown, Sort dropdown, and Reset */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Destination filter */}
            <div className="relative min-w-42.5">
              <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <select
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className="h-8.5 w-full appearance-none rounded-md border border-zinc-200 bg-white py-1 pl-7.5 pr-7 text-xs font-medium text-zinc-700 outline-none transition focus:border-[#0051c8] focus:ring-2 focus:ring-[#0051c8]/10 shadow-2xs"
              >
                <option value="all">ทุกจุดหมายปลายทาง</option>
                {uniqueDestinations.map((dest) => (
                  <option key={dest} value={dest}>
                    {dest}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort order dropdown */}
            <div className="relative min-w-38.75">
              <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
                <ArrowUpDown className="h-3.5 w-3.5" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-8.5 w-full appearance-none rounded-md border border-zinc-200 bg-white py-1 pl-7.5 pr-7 text-xs font-medium text-zinc-700 outline-none transition focus:border-[#0051c8] focus:ring-2 focus:ring-[#0051c8]/10 shadow-2xs"
              >
                <option value="newest">เพิ่มล่าสุด</option>
                <option value="oldest">เก่าที่สุด</option>
                <option value="price_asc">ราคา: ต่ำสุด - สูงสุด</option>
                <option value="price_desc">ราคา: สูงสุด - ต่ำสุด</option>
                <option value="name_asc">ชื่อ: ก - ฮ</option>
              </select>
            </div>

            {/* Reset button (visible when filters are active) */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-8.5 items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors shadow-2xs cursor-pointer"
                title="ล้างตัวกรองทั้งหมด"
              >
                <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
                <span>รีเซ็ต</span>
              </button>
            )}
          </div>
        </div>

        {/* Results summary bar */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
          <div>
            แสดง <span className="font-bold text-zinc-800">{filteredPackages.length}</span> จากทั้งหมด{" "}
            <span className="font-bold text-zinc-800">{packages.length}</span> รายการ
            {hasActiveFilters && (
              <span className="ml-2 text-[#0051c8] font-medium">
                (ใช้ตัวกรองอยู่)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-lg border border-zinc-200/90 bg-white shadow-2xs">
        <div className="overflow-x-auto min-h-90">
          <table className="w-full min-w-205 text-left">
            <thead className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3.5">แพ็กเกจท่องเที่ยว</th>
                <th className="px-5 py-3.5">จุดหมายปลายทาง</th>
                <th className="px-5 py-3.5">ผู้ให้บริการร่วม</th>
                <th className="px-5 py-3.5">ราคาเริ่มต้น</th>
                <th className="px-5 py-3.5">สถานะ</th>
                <th className="px-5 py-3.5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
                      <span className="text-xs font-medium">กำลังโหลดข้อมูลแพ็กเกจ...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                        <Search className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {hasActiveFilters
                          ? "ไม่พบแพ็กเกจที่ตรงกับเงื่อนไขการค้นหา"
                          : "ยังไม่มีรายการแพ็กเกจในระบบ"}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {hasActiveFilters
                          ? "ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูรายการทั้งหมด"
                          : "กดปุ่มสร้างแพ็กเกจใหม่เพื่อเริ่มต้นเพิ่มทริปท่องเที่ยวแรกของคุณ"}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>ล้างตัวกรองทั้งหมด</span>
                        </button>
                      ) : (
                        <Link
                          href="/backoffice/package/create"
                          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-2xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>สร้างแพ็กเกจใหม่</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((item) => {
                  const coverImage =
                    item.image ||
                    (item.images && item.images.length > 0
                      ? item.images[0].image_url
                      : null);

                  return (
                    <tr
                      key={item.id}
                      className="group transition-colors hover:bg-slate-50/80"
                    >
                      {/* Package Name + Image thumbnail */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            {coverImage ? (
                              <img
                                src={coverImage}
                                alt={item.name}
                                className="h-full w-full object-cover transition group-hover:scale-105"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=120&q=80";
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/backoffice/package/${item.id}/edit`}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2"
                              title={item.name}
                            >
                              {item.name}
                            </Link>
                            {(item.booking_start_date || item.booking_end_date) && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50/80 border border-indigo-100/80 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                                  <Calendar className="h-2.5 w-2.5 text-indigo-600" />
                                  <span>
                                    {item.booking_start_date ? new Date(item.booking_start_date).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : "เริ่มทันที"}
                                    {" - "}
                                    {item.booking_end_date ? new Date(item.booking_end_date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "ตลอดไป"}
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="px-5 py-4 text-xs font-medium text-slate-700">
                        {item.location?.name ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span>{item.location.name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Partner */}
                      <td className="px-5 py-4 text-xs text-slate-600">
                        {item.partners && item.partners.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-50">
                            {item.partners.map((p) => (
                              <span
                                key={p.partner_id}
                                className="rounded-md bg-indigo-50/80 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 border border-indigo-100"
                              >
                                {p.partner?.name}
                              </span>
                            ))}
                          </div>
                        ) : item.partner ? (
                          <span className="rounded-md bg-indigo-50/80 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 border border-indigo-100">
                            {item.partner.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 text-xs sm:text-sm font-bold text-slate-900">
                        ฿{Number(item.price || 0).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {item.status === "Published" && (
                          (() => {
                            const now = new Date();
                            const isAfterEnd =
                              item.booking_end_date &&
                              new Date(new Date(item.booking_end_date).setHours(23, 59, 59, 999)) < now;
                            const isBeforeStart =
                              item.booking_start_date && new Date(item.booking_start_date) > now;

                            if (isAfterEnd) {
                              return (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs">
                                  <AlertCircle size={12.5} className="text-slate-500 shrink-0" />
                                  <span>หมดเขตรับจอง</span>
                                </span>
                              );
                            }
                            if (isBeforeStart) {
                              return (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-800 border border-sky-200 shadow-2xs">
                                  <Clock size={12.5} className="text-sky-600 shrink-0" />
                                  <span>รอเปิดจอง</span>
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200 shadow-2xs">
                                <CheckCircle2 size={12.5} className="text-emerald-600 shrink-0" />
                                <span>เปิดขาย</span>
                              </span>
                            );
                          })()
                        )}
                        {item.status === "Draft" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200 shadow-2xs">
                            <FileText size={12.5} className="text-amber-600 shrink-0" />
                            <span>ฉบับร่าง</span>
                          </span>
                        )}
                        {item.status === "Closed" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200 shadow-2xs">
                            <XCircle size={12.5} className="text-rose-600 shrink-0" />
                            <span>ปิดรับจอง</span>
                          </span>
                        )}
                        {item.status === "Archived" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs">
                            <Archive size={12.5} className="text-slate-500 shrink-0" />
                            <span>เก็บถาวร</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/package/${item.id}`}
                            target="_blank"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                            title="ดูหน้ารายละเอียดฝั่งลูกค้า"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/backoffice/package/${item.id}/edit`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                            title="แก้ไขแพ็กเกจ"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(item)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                            title="ลบแพ็กเกจ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Feedback / Confirmation Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal((prev) => ({ ...prev, isOpen: false }))}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        confirmText={feedbackModal.confirmText}
        cancelText={feedbackModal.cancelText}
        onConfirm={feedbackModal.onConfirm}
        onCancel={() => setFeedbackModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
