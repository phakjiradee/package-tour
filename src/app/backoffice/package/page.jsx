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
  ImageIcon
} from "lucide-react";
import Link from "next/link";
import FeedbackModal from "@/components/ui/FeedbackModal";

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
    <div className="space-y-4">
      {/* Top Banner / Heading & Action */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Package2 className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                คลังแพ็กเกจท่องเที่ยว
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              จัดการรายการแพ็กเกจทัวร์ ตรวจสอบสถานะการขาย ราคาเริ่มต้น และผู้ให้บริการร่วม
            </p>
          </div>

          <Link
            href="/backoffice/package/create"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>สร้างแพ็กเกจใหม่</span>
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
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
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/70 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Toolbar */}
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Search input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อแพ็กเกจ, จุดหมาย, หรือพาร์ทเนอร์..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="ล้างข้อความค้นหา"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Right: Destination dropdown, Sort dropdown, and Reset */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Destination filter */}
            <div className="relative min-w-[170px]">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <select
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-8.5 pr-8 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
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
            <div className="relative min-w-[155px]">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <ArrowUpDown className="h-3.5 w-3.5" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-8.5 pr-8 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                title="ล้างตัวกรองทั้งหมด"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                <span>รีเซ็ต</span>
              </button>
            )}
          </div>
        </div>

        {/* Results summary bar */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <div>
            แสดง <span className="font-bold text-slate-800">{filteredPackages.length}</span> จากทั้งหมด{" "}
            <span className="font-bold text-slate-800">{packages.length}</span> รายการ
            {hasActiveFilters && (
              <span className="ml-2 text-indigo-600 font-medium">
                (ใช้ตัวกรองอยู่)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto min-h-[360px]">
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                            <span className="text-[11px] text-slate-400">
                              รหัส: #{item.id}
                            </span>
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
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
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
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Published (เปิดขาย)
                          </span>
                        )}
                        {item.status === "Draft" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                            Draft (ฉบับร่าง)
                          </span>
                        )}
                        {item.status === "Closed" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 border border-rose-200 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                            Closed (ปิดรับจอง)
                          </span>
                        )}
                        {item.status === "Archived" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                            Archived (เก็บถาวร)
                          </span>
                        )}
                        {!["Published", "Draft", "Closed", "Archived"].includes(
                          item.status
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
