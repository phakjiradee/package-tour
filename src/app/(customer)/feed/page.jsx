"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Compass,
  Search,
  Sparkles,
  MapPin,
  Calendar,
  ShieldCheck,
  Utensils,
  Hotel,
  TrendingUp,
  ChevronRight,
  Filter,
} from "lucide-react";
import PackageCard from "@/components/package/PackageCard";
import VideoHeader from "@/components/layout/VideoHeader";

export default function CustomerHomePage() {
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    let isMounted = true;
    async function fetchPackages() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
        let res = await fetch(`${apiUrl}/packages`).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch("http://localhost:4000/api/packages").catch(() => null);
        }
        if (res && res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPackages(Array.isArray(data) ? data : []);
          }
        }
      } catch (err) {
        console.error("Failed to load packages on home page:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchPackages();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter packages for customer visibility & selected category / search
  const visiblePackages = useMemo(() => {
    return packages.filter(
      (pkg) => pkg.status !== "Draft" && pkg.status !== "Archived"
    );
  }, [packages]);

  const filteredPackages = useMemo(() => {
    return visiblePackages.filter((pkg) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = pkg.name?.toLowerCase().includes(q);
        const matchDesc = pkg.description?.toLowerCase().includes(q);
        const matchLoc = pkg.location?.name?.toLowerCase().includes(q);
        const matchPartner =
          pkg.partner?.name?.toLowerCase().includes(q) ||
          pkg.partners?.some((p) => p.partner?.name?.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchLoc && !matchPartner) return false;
      }

      // Category tab filter
      const daysCount = pkg.dayplans?.length || 0;
      if (selectedCategory === "1day" && daysCount !== 1) return false;
      if (selectedCategory === "multi_day" && daysCount < 2) return false;
      if (selectedCategory === "addon" && (!pkg.addons || pkg.addons.length === 0))
        return false;

      return true;
    });
  }, [visiblePackages, searchQuery, selectedCategory]);

  return (
    <div className="pb-16 space-y-12">
      {/* Hero Header Banner (Full Screen Edge-to-Edge) */}
      <VideoHeader videoSrc="/header-airplane.mp4" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Featured Packages Section */}
        <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Featured Trips</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              แพ็กเกจทัวร์แนะนำยอดนิยม
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ทริปการเดินทางที่ได้รับความนิยมสูงสุด พร้อมรายละเอียดครบถ้วน
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาแพ็กเกจ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-7 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <Link
              href="/package"
              className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition hover:gap-1.5"
            >
              <span>ดูทั้งหมด ({visiblePackages.length})</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Filter Category Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ทริปทั้งหมด ({visiblePackages.length})
          </button>
          <button
            onClick={() => setSelectedCategory("1day")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              selectedCategory === "1day"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ทริป 1 วัน (ไปเช้า-เย็นกลับ)
          </button>
          <button
            onClick={() => setSelectedCategory("multi_day")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              selectedCategory === "multi_day"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ทริป 2 วันขึ้นไป (ค้างคืน)
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-108 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm animate-pulse flex flex-col justify-between"
              >
                <div className="h-52 w-full rounded-2xl bg-slate-200" />
                <div className="space-y-3 py-4">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                  <div className="h-3 w-5/6 rounded bg-slate-100" />
                </div>
                <div className="h-10 w-full rounded-xl bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPackages.length === 0 && (
          <div className="min-h-90 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-400">
              <Compass className="h-8 w-8 text-slate-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                ไม่พบแพ็กเกจที่ตรงตามเงื่อนไข
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                ลองค้นหาด้วยคำอื่น หรือกดล้างตัวกรองเพื่อดูแพ็กเกจทั้งหมดที่มีให้บริการ
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}

        {/* Package Card Grid */}
        {!isLoading && filteredPackages.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}