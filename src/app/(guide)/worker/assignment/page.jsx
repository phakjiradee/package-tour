"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Compass,
  FileSpreadsheet,
  Filter,
  Info,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Users,
  Utensils,
  X,
  AlertTriangle,
  BadgeCheck,
  Layers,
  Check,
  Building,
} from "lucide-react";
import { guideService } from "@/service/guide";
import { employeeService } from "@/service/employee";
import { getBackofficeAuth } from "@/lib/backoffice-auth";
import { formatThaiDate } from "@/lib/date";
import PageHeader from "@/components/backoffice/PageHeader";
import StatCard from "@/components/backoffice/StatCard";
import TwoToneCard from "@/components/backoffice/TwoToneCard";
import { PositionBadge } from "@/components/ui/Badges";

export default function GuideAssignmentPage() {
  // Authentication & Guide selection
  const [currentUser] = useState(() =>
    typeof window !== "undefined" ? getBackofficeAuth() : null
  );
  const [allGuides, setAllGuides] = useState([]);
  const [selectedGuideId, setSelectedGuideId] = useState(null);

  // Package assignments data from backend
  const [guideProfile, setGuideProfile] = useState(null);
  const [packageIds, setPackageIds] = useState({ all: [], ongoing: [], past: [] });
  const [packageCounts, setPackageCounts] = useState({ total: 0, ongoing: 0, past: 0 });
  const [packagesData, setPackagesData] = useState({ ongoing: [], past: [], all: [] });

  // Filters & State
  const [activeTab, setActiveTab] = useState("all"); // "all" | "ongoing" | "past"
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal for Package Details & Customer Manifest
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [packageDetail, setPackageDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("manifest"); // "manifest" | "bookings" | "itinerary" | "team"
  const [manifestSearch, setManifestSearch] = useState("");

  // Check-in tracking state (local state for guide during check-in session)
  const [checkIns, setCheckIns] = useState({});

  // 1. Initial Load: Load all guides list
  useEffect(() => {
    let isMounted = true;
    const auth = getBackofficeAuth();

    const loadGuidesList = async () => {
      try {
        const emps = await employeeService.getAll();
        if (!isMounted) return;

        // กรองเฉพาะพนักงานที่เป็น Guide / ไกด์ หรือทั้งหมด
        const guides = (emps || []).filter((e) => {
          const roleName = (e.role || e.position || "").toLowerCase();
          return roleName.includes("guide") || roleName.includes("ไกด์");
        });

        const list = guides.length > 0 ? guides : emps;
        setAllGuides(list);

        // ถ้า user ที่ล็อกอินเป็นไกด์อยู่แล้ว ให้เลือก user นั้น
        if (auth && auth.id) {
          const isGuide = list.some((g) => g.id === auth.id);
          if (isGuide) {
            setSelectedGuideId(auth.id);
            return;
          }
        }

        // หากไม่ใช่ หรือรัน dev ให้เลือกไกด์คนแรกในระบบ (เช่น id: 7)
        if (list.length > 0) {
          setSelectedGuideId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load guides list:", err);
      }
    };

    loadGuidesList();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch guide packages whenever selectedGuideId changes
  const fetchGuidePackages = useCallback(async (guideId = selectedGuideId) => {
    if (!guideId) return;

    setRefreshing(true);
    try {
      const res = await guideService.getPackages({ guide_id: guideId });

      if (res && res.success) {
        setGuideProfile(res.guide || null);
        setPackageIds(res.package_ids || { all: [], ongoing: [], past: [] });
        setPackageCounts(res.counts || { total: 0, ongoing: 0, past: 0 });
        setPackagesData(res.packages || { ongoing: [], past: [], all: [] });
      }
    } catch (err) {
      console.error("Failed to fetch guide packages:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedGuideId]);

  useEffect(() => {
    if (selectedGuideId) {
      const timer = setTimeout(() => {
        fetchGuidePackages(selectedGuideId);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedGuideId, fetchGuidePackages]);

  // 3. Open Detail Modal & Fetch Package + Customer Details
  const handleOpenDetailModal = async (pkgId, initialTab = "manifest") => {
    setSelectedPackageId(pkgId);
    setModalTab(initialTab);
    setIsDetailModalOpen(true);
    setDetailLoading(true);

    try {
      const res = await guideService.getPackageDetail(pkgId, {
        guide_id: selectedGuideId,
      });

      if (res && res.success) {
        setPackageDetail(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch package details for guide:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setPackageDetail(null);
    setSelectedPackageId(null);
    setManifestSearch("");
  };

  // 4. Toggle Passenger Check-in
  const toggleCheckIn = (passengerKey) => {
    setCheckIns((prev) => ({
      ...prev,
      [passengerKey]: !prev[passengerKey],
    }));
  };

  // 5. Filter packages based on activeTab and searchQuery
  const displayedPackages = useMemo(() => {
    let list = [];
    if (activeTab === "ongoing") {
      list = packagesData.ongoing || [];
    } else if (activeTab === "past") {
      list = packagesData.past || [];
    } else {
      list = packagesData.all || [];
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter((pkg) => {
      const nameMatch = (pkg.name || "").toLowerCase().includes(query);
      const locMatch = (pkg.location?.name || "").toLowerCase().includes(query);
      const idMatch = String(pkg.id).includes(query);
      const roleMatch = (pkg.guide_assignment?.role || "")
        .toLowerCase()
        .includes(query);
      return nameMatch || locMatch || idMatch || roleMatch;
    });
  }, [activeTab, packagesData, searchQuery]);

  // 6. Filter manifest in modal
  const filteredManifest = useMemo(() => {
    if (!packageDetail?.passenger_manifest) return [];
    if (!manifestSearch.trim()) return packageDetail.passenger_manifest;

    const q = manifestSearch.toLowerCase().trim();
    return packageDetail.passenger_manifest.filter((p) => {
      const nameMatch = (p.full_name || "").toLowerCase().includes(q);
      const codeMatch = (p.booking_code || "").toLowerCase().includes(q);
      const phoneMatch = (p.phone || "").toLowerCase().includes(q);
      const reqMatch = (p.special_request || "").toLowerCase().includes(q);
      return nameMatch || codeMatch || phoneMatch || reqMatch;
    });
  }, [packageDetail, manifestSearch]);

  // Check-in calculation
  const totalManifestCount = packageDetail?.passenger_manifest?.length || 0;
  const checkedInCount = useMemo(() => {
    if (!packageDetail?.passenger_manifest) return 0;
    return packageDetail.passenger_manifest.filter((_, idx) => checkIns[idx])
      .length;
  }, [packageDetail, checkIns]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="งานที่ได้รับมอบหมาย (Guide Assignments)"
        subtitle="ตรวจสอบแพ็กเกจทัวร์ที่เคยดูแลและกำลังดูแลอยู่ พร้อมข้อมูลรายชื่อและรายละเอียดลูกทัวร์"
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
            <Compass className="h-3.5 w-3.5 text-amber-600" />
            ระบบไกด์นำเที่ยว
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5">
            {/* Refresh Button */}
            <button
              onClick={() => fetchGuidePackages()}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-slate-500 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
          </div>
        }
      />

      {/* Guide Identity Card */}
      {guideProfile && (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white font-bold text-lg shadow-sm">
                {guideProfile.name ? guideProfile.name.charAt(0) : "G"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {guideProfile.name}
                  </h2>
                  <PositionBadge position={guideProfile.role || "Guide"} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                  {guideProfile.email && (
                    <span>อีเมล: {guideProfile.email}</span>
                  )}
                  {guideProfile.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {guideProfile.phone}
                    </span>
                  )}
                  <span>รหัสพนักงาน: #{guideProfile.id}</span>
                </div>
              </div>
            </div>

            {/* Quick ID Pills */}
            <div className="flex flex-col sm:items-end gap-1.5">
              <span className="text-[11px] font-medium text-slate-400">
                รหัสแพ็กเกจที่มอบหมายให้ดูแล:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {packageIds.all && packageIds.all.length > 0 ? (
                  packageIds.all.map((id) => {
                    const isOngoing = packageIds.ongoing?.includes(id);
                    return (
                      <span
                        key={id}
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold font-mono ${
                          isOngoing
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        #{id} {isOngoing ? "(ดูแลอยู่)" : ""}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    ยังไม่มีแพ็กเกจที่ได้รับมอบหมาย
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="กำลังดูแลอยู่ (Ongoing)"
          value={packageCounts.ongoing || 0}
          subtitle="ทริปที่กำลังดำเนินงานหรือกำลังจะถึง"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="เคยดูแลแล้ว (Past)"
          value={packageCounts.past || 0}
          subtitle="ทริปในอดีตที่เสร็จสิ้นภารกิจแล้ว"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="ทริปที่ดูแลทั้งหมด (Total)"
          value={packageCounts.total || 0}
          subtitle="รวมทุกแพ็กเกจตลอดการทำงาน"
          icon={Layers}
          color="indigo"
        />
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ทั้งหมด ({packageCounts.total || 0})
          </button>
          <button
            onClick={() => setActiveTab("ongoing")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "ongoing"
                ? "bg-amber-500 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ดูแลอยู่ ({packageCounts.ongoing || 0})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "past"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            เคยดูแลแล้ว ({packageCounts.past || 0})
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อแพ็กเกจ, สถานที่, รหัส..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
            <span className="text-xs text-slate-400">กำลังโหลดข้อมูลแพ็กเกจ...</span>
          </div>
        </div>
      ) : displayedPackages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Compass className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-700">ไม่พบแพ็กเกจที่ตรงกับเงื่อนไข</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {searchQuery
              ? `ไม่พบแพ็กเกจที่ตรงกับการค้นหา "${searchQuery}"`
              : "ยังไม่มีประวัติหรือแพ็กเกจทัวร์ที่ได้รับมอบหมายในหมวดหมู่นี้"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayedPackages.map((pkg) => {
            const isOngoing = pkg.category === "ongoing";
            const roleBadgeColor =
              pkg.guide_assignment?.role === "LEAD_GUIDE"
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : "bg-blue-100 text-blue-800 border-blue-200";

            return (
              <div
                key={pkg.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:border-amber-400/80 hover:shadow-md transition-all duration-200"
              >
                <div>
                  {/* Image Cover & Badges */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    {pkg.image ? (
                      <Image
                        src={pkg.image}
                        alt={pkg.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 text-xs">
                        ไม่มีภาพประกอบ
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

                    {/* Top Status Tags */}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-xs ${
                          isOngoing
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {isOngoing ? (
                          <>
                            <Clock className="h-3 w-3" />
                            ดูแลอยู่
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            เคยดูแลแล้ว
                          </>
                        )}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-white/95 text-slate-800 shadow-2xs`}
                      >
                        {pkg.guide_assignment?.role === "LEAD_GUIDE"
                          ? "หัวหน้าทริป (Lead)"
                          : "ไกด์ร่วม (Assistant)"}
                      </span>
                    </div>

                    {/* Bottom overlay: Location & ID */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <div className="flex items-center gap-1 text-xs font-medium truncate drop-shadow-sm">
                        <MapPin className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                        <span className="truncate">
                          {pkg.location?.name || "ไม่ระบุสถานที่"}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                        #{pkg.id}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-slate-900 text-base line-clamp-2 group-hover:text-amber-600 transition-colors">
                      {pkg.name}
                    </h3>

                    {/* Date Schedule */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                      <div>
                        <span className="font-medium">
                          {pkg.start_date
                            ? `${formatThaiDate(pkg.start_date)} - ${formatThaiDate(
                                pkg.end_date || pkg.start_date
                              )}`
                            : "ยังไม่กำหนดช่วงวันเดินทาง"}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stats: Bookings Count */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        ยอดการจองทั้งหมด:
                      </span>
                      <span className="font-bold text-slate-800">
                        {pkg.total_bookings} กลุ่ม
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleOpenDetailModal(pkg.id, "manifest")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 px-3 text-xs font-bold text-white shadow-xs hover:bg-amber-600 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <ClipboardList className="h-4 w-4 text-amber-300" />
                    ดูรายละเอียด & เช็กชื่อลูกทัวร์
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: รายละเอียดแพ็กเกจสำหรับไกด์ และรายชื่อลูกทัวร์ (Manifest & Bookings) */}
      {/* ========================================================================= */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-2xs">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 font-mono">
                      แพ็กเกจรหัส #{selectedPackageId}
                    </span>
                    {packageDetail?.package?.category === "ongoing" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        กำลังดูแลอยู่
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        เคยดูแลแล้ว
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">
                    {packageDetail?.package?.name || "รายละเอียดแพ็กเกจสำหรับไกด์"}
                  </h2>
                </div>
              </div>

              <button
                onClick={handleCloseDetailModal}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/70 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            {detailLoading ? (
              <div className="flex h-96 items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
                  <span className="text-xs text-slate-500 font-medium">
                    กำลังดึงข้อมูลรายละเอียดและรายชื่อผู้เข้าร่วม...
                  </span>
                </div>
              </div>
            ) : packageDetail ? (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Highlights Banner & Summary Counts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-6 py-3 bg-white border-b border-slate-100 shrink-0">
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[11px] text-slate-500">จำนวนลูกทัวร์</span>
                    <p className="text-lg font-extrabold text-slate-900">
                      {packageDetail.customers_summary?.total_passengers || 0} คน
                    </p>
                    <span className="text-[10px] text-slate-400">
                      ผู้ใหญ่ {packageDetail.customers_summary?.total_adults || 0} / เด็ก{" "}
                      {packageDetail.customers_summary?.total_children || 0}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[11px] text-slate-500">กลุ่มการจอง</span>
                    <p className="text-lg font-extrabold text-indigo-600">
                      {packageDetail.customers_summary?.total_bookings || 0} คณะ
                    </p>
                    <span className="text-[10px] text-slate-400">
                      ยืนยันแล้ว{" "}
                      {packageDetail.customers_summary?.status_breakdown?.CONFIRMED ||
                        0}
                    </span>
                  </div>

                  <div className="rounded-xl bg-amber-50/70 p-2.5 border border-amber-200/60">
                    <span className="text-[11px] text-amber-700 font-medium">
                      คำขอพิเศษ/แพ้อาหาร
                    </span>
                    <p className="text-lg font-extrabold text-amber-800">
                      {packageDetail.customers_summary?.special_requests_count || 0}{" "}
                      รายการ
                    </p>
                    <span className="text-[10px] text-amber-600">
                      {packageDetail.customers_summary?.special_requests_count > 0
                        ? "ต้องดูแลเป็นพิเศษ"
                        : "ไม่มีข้อเรียกร้อง"}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 flex flex-col justify-between">
                    <span className="text-[11px] text-slate-500">การเช็กชื่อขึ้นรถ</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-extrabold text-emerald-600">
                        {checkedInCount} / {totalManifestCount}
                      </span>
                      <span className="text-xs text-slate-400">คน</span>
                    </div>
                  </div>
                </div>

                {/* Sub Navigation Tabs inside Modal */}
                <div className="flex items-center justify-between px-6 pt-3 pb-1 border-b border-slate-100 shrink-0">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalTab("manifest")}
                      className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        modalTab === "manifest"
                          ? "border-amber-500 text-amber-600"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <UserCheck className="h-4 w-4" />
                      ใบเช็กชื่อลูกทัวร์ ({totalManifestCount})
                    </button>
                    <button
                      onClick={() => setModalTab("bookings")}
                      className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        modalTab === "bookings"
                          ? "border-amber-500 text-amber-600"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      ข้อมูลกลุ่มการจอง ({packageDetail.bookings?.length || 0})
                    </button>
                    <button
                      onClick={() => setModalTab("itinerary")}
                      className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        modalTab === "itinerary"
                          ? "border-amber-500 text-amber-600"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Calendar className="h-4 w-4" />
                      แผนการเดินทางรายวัน ({packageDetail.package?.dayplans?.length || 0} วัน)
                    </button>
                  </div>

                  {/* Print Button */}
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <Printer className="h-3 w-3" />
                    พิมพ์ใบรายชื่อ
                  </button>
                </div>

                {/* Modal Tab Content Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* TAB 1: PASSENGER MANIFEST */}
                  {modalTab === "manifest" && (
                    <div className="space-y-4">
                      {/* Search Bar for Passengers */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={manifestSearch}
                            onChange={(e) => setManifestSearch(e.target.value)}
                            placeholder="ค้นหาชื่อผู้เดินทาง, รหัสจอง, เบอร์โทร..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          เช็กชื่อแล้ว {checkedInCount} จาก {totalManifestCount} ท่าน
                        </span>
                      </div>

                      {/* Manifest Table */}
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="px-3.5 py-3 w-12 text-center">เช็กชื่อ</th>
                              <th className="px-3 py-3 w-10 text-center">ลำดับ</th>
                              <th className="px-3.5 py-3">ชื่อ-นามสกุลผู้เดินทาง</th>
                              <th className="px-3 py-3">เบอร์โทรศัพท์</th>
                              <th className="px-3 py-3">เลขประจำตัว/พาสปอร์ต</th>
                              <th className="px-3 py-3">รหัสการจอง</th>
                              <th className="px-3 py-3">บริการเสริม</th>
                              <th className="px-3.5 py-3">คำขอพิเศษ/แพ้อาหาร</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredManifest.length === 0 ? (
                              <tr>
                                <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                                  ไม่พบข้อมูลผู้ร่วมเดินทาง
                                </td>
                              </tr>
                            ) : (
                              filteredManifest.map((p, idx) => {
                                const isChecked = !!checkIns[idx];
                                return (
                                  <tr
                                    key={idx}
                                    className={`transition-colors ${
                                      isChecked
                                        ? "bg-emerald-50/40"
                                        : "hover:bg-slate-50/70"
                                    }`}
                                  >
                                    {/* Check-in checkbox button */}
                                    <td className="px-3.5 py-2.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => toggleCheckIn(idx)}
                                        className={`flex h-6 w-6 mx-auto items-center justify-center rounded-lg border transition-all cursor-pointer ${
                                          isChecked
                                            ? "bg-emerald-500 border-emerald-600 text-white"
                                            : "border-slate-300 bg-white hover:border-amber-500"
                                        }`}
                                      >
                                        {isChecked && <Check className="h-3.5 w-3.5 stroke-3" />}
                                      </button>
                                    </td>

                                    <td className="px-3 py-2.5 text-center font-mono text-slate-400 text-[11px]">
                                      {idx + 1}
                                    </td>

                                    <td className="px-3.5 py-2.5 font-bold text-slate-900">
                                      <div className="flex items-center gap-1.5">
                                        <span>
                                          {p.title ? `${p.title} ` : ""}
                                          {p.full_name}
                                        </span>
                                      </div>
                                    </td>

                                    <td className="px-3 py-2.5 text-slate-600 font-mono">
                                      {p.phone ? (
                                        <a
                                          href={`tel:${p.phone}`}
                                          className="text-indigo-600 hover:underline"
                                        >
                                          {p.phone}
                                        </a>
                                      ) : (
                                        "-"
                                      )}
                                    </td>

                                    <td className="px-3 py-2.5 font-mono text-slate-500">
                                      {p.id_card_or_passport || "-"}
                                    </td>

                                    <td className="px-3 py-2.5 font-mono text-indigo-700 font-semibold">
                                      {p.booking_code}
                                    </td>

                                    <td className="px-3 py-2.5 text-slate-600">
                                      {p.addons && p.addons.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {p.addons.map((a, i) => (
                                            <span
                                              key={i}
                                              className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-700 font-medium"
                                            >
                                              {a}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        "-"
                                      )}
                                    </td>

                                    <td className="px-3.5 py-2.5">
                                      {p.special_request ? (
                                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                                          <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
                                          {p.special_request}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: BOOKING GROUPS */}
                  {modalTab === "bookings" && (
                    <div className="space-y-4">
                      {packageDetail.bookings?.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          ยังไม่มีการจองในแพ็กเกจนี้
                        </div>
                      ) : (
                        packageDetail.bookings?.map((b) => (
                          <div
                            key={b.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg text-xs">
                                  {b.booking_code}
                                </span>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    b.status === "CONFIRMED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {b.status}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500">
                                วันที่จอง: {formatThaiDate(b.created_at)}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              {/* Contact Person */}
                              <div className="bg-slate-50 p-3 rounded-xl">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                  ผู้ติดต่อหลัก
                                </span>
                                <p className="font-bold text-slate-900 mt-0.5">
                                  {b.contact_info?.name}
                                </p>
                                <p className="text-slate-600 mt-0.5">
                                  โทร: {b.contact_info?.phone}
                                </p>
                                {b.contact_info?.line_id && (
                                  <p className="text-slate-600">
                                    Line: {b.contact_info.line_id}
                                  </p>
                                )}
                              </div>

                              {/* Headcount */}
                              <div className="bg-slate-50 p-3 rounded-xl">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                  จำนวนผู้เดินทาง
                                </span>
                                <p className="font-bold text-slate-900 mt-0.5">
                                  รวม {b.headcount?.total} ท่าน
                                </p>
                                <p className="text-slate-600 mt-0.5">
                                  ผู้ใหญ่ {b.headcount?.adults} • เด็ก{" "}
                                  {b.headcount?.children}
                                </p>
                              </div>

                              {/* Special request */}
                              <div className="bg-slate-50 p-3 rounded-xl">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                  ข้อเรียกร้องพิเศษ
                                </span>
                                <p
                                  className={`mt-0.5 font-medium ${
                                    b.special_request
                                      ? "text-amber-800 font-bold"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {b.special_request || "ไม่มี"}
                                </p>
                              </div>
                            </div>

                            {/* Travelers list in this booking */}
                            {b.travelers && b.travelers.length > 0 && (
                              <div className="pt-2">
                                <span className="text-[11px] font-bold text-slate-700">
                                  สมาชิกในคณะ ({b.travelers.length} คน):
                                </span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {b.travelers.map((t) => (
                                    <span
                                      key={t.id}
                                      className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700"
                                    >
                                      {t.title ? `${t.title} ` : ""}
                                      {t.full_name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 3: ITINERARY */}
                  {modalTab === "itinerary" && (
                    <div className="space-y-4">
                      {packageDetail.package?.dayplans?.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          ยังไม่มีกำหนดการเดินทางรายวันสำหรับแพ็กเกจนี้
                        </div>
                      ) : (
                        packageDetail.package?.dayplans?.map((day) => (
                          <div
                            key={day.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="font-bold text-slate-900 text-sm">
                                วันที่ {day.day_num}: {day.title || "กำหนดการประจำวัน"}
                              </span>
                              {day.dt && (
                                <span className="text-xs text-indigo-600 font-medium">
                                  {formatThaiDate(day.dt)}
                                </span>
                              )}
                            </div>

                            {day.description && (
                              <p className="text-xs text-slate-600">
                                {day.description}
                              </p>
                            )}

                            {/* Activities Timeline */}
                            {day.activities && day.activities.length > 0 && (
                              <div className="space-y-2 pt-1">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                  กิจกรรม:
                                </span>
                                <div className="space-y-1.5">
                                  {day.activities.map((act) => (
                                    <div
                                      key={act.id}
                                      className="flex items-start gap-2.5 text-xs text-slate-700 pl-2 border-l-2 border-amber-400"
                                    >
                                      {act.time && (
                                        <span className="font-mono text-slate-500 shrink-0">
                                          {act.time}
                                        </span>
                                      )}
                                      <span>{act.activity}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Meals */}
                            {day.meals && day.meals.length > 0 && (
                              <div className="flex items-center gap-2 pt-2 text-xs text-slate-600">
                                <Utensils className="h-3.5 w-3.5 text-amber-500" />
                                <span>มื้ออาหาร:</span>
                                <div className="flex gap-1.5">
                                  {day.meals.map((m, i) => (
                                    <span
                                      key={i}
                                      className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800"
                                    >
                                      {m.meal?.type_name || "อาหาร"}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                onClick={handleCloseDetailModal}
                className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
