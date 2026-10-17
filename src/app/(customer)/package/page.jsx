"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import PackageCard from "@/components/package/PackageCard";
import {
  Search,
  MapPin,
  Calendar,
  Utensils,
  ArrowRight,
  Handshake,
  Compass,
  SlidersHorizontal,
  Hotel,
  ShieldCheck,
  Tag,
  Clock,
  ChevronRight,
  Filter,
  Camera,
  Ban
} from "lucide-react";

export default function CustomerPackageListPage() {
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [filterDuration, setFilterDuration] = useState("all");
  const [filterAddonOnly, setFilterAddonOnly] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchPackages() {
      try {
        const res = await fetch("http://localhost:4000/api/packages");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPackages(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch packages:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchPackages();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter and sort packages
  const filteredPackages = useMemo(() => {
    return packages
      .filter((pkg) => {
        // Customer visibility rule: Draft and Archived are hidden from customer catalog
        if (pkg.status === "Draft" || pkg.status === "Archived") {
          return false;
        }

        // Search filter
        const query = searchQuery.trim().toLowerCase();
        if (query) {
          const matchName = pkg.name?.toLowerCase().includes(query);
          const matchDesc = pkg.description?.toLowerCase().includes(query);
          const matchLocation = pkg.location?.name?.toLowerCase().includes(query);
          const matchPartner = pkg.partner?.name?.toLowerCase().includes(query) ||
            pkg.partners?.some((p) => p.partner?.name?.toLowerCase().includes(query));
          if (!matchName && !matchDesc && !matchLocation && !matchPartner) {
            return false;
          }
        }

        // Duration filter
        const daysCount = pkg.dayplans?.length || 0;
        if (filterDuration === "1day" && daysCount !== 1) return false;
        if (filterDuration === "2days" && daysCount !== 2) return false;
        if (filterDuration === "3plus" && daysCount < 3) return false;

        // Addon filter
        if (filterAddonOnly && (!pkg.addons || pkg.addons.length === 0)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const now = new Date();
        const aAfterEnd = a.booking_end_date && new Date(new Date(a.booking_end_date).setHours(23, 59, 59, 999)) < now;
        const bAfterEnd = b.booking_end_date && new Date(new Date(b.booking_end_date).setHours(23, 59, 59, 999)) < now;
        const aClosed = a.status === "Closed" || aAfterEnd;
        const bClosed = b.status === "Closed" || bAfterEnd;

        // Push expired or closed packages to the bottom
        if (!aClosed && bClosed) return -1;
        if (aClosed && !bClosed) return 1;

        // Otherwise sort by user selection
        if (sortBy === "price_asc") return (a.price || 0) - (b.price || 0);
        if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
        if (sortBy === "duration_desc") return (b.dayplans?.length || 0) - (a.dayplans?.length || 0);
        return b.id - a.id; // default newest
      });
  }, [packages, searchQuery, sortBy, filterDuration, filterAddonOnly]);

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-16 space-y-8">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl min-h-[380px] sm:min-h-[420px] px-6 py-12 text-white shadow-xl shadow-slate-900/10 sm:px-12 sm:py-16 flex flex-col justify-center">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/package-hero-bg.jpg"
            alt="Zentura Travel Destinations"
            fill
            priority
            className="object-cover object-center sm:object-[center_35%]"
          />
          {/* Gradient Overlay so text and search bar are perfectly readable while letting the tropical scene shine through */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-transparent sm:w-4/5" />
          <div className="absolute inset-0 bg-blue-950/20 mix-blend-multiply" />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
            <Compass className="h-3.5 w-3.5 text-sky-200" />
            <span>แพ็กเกจทัวร์คุณภาพ ครบจบทุกการเดินทาง</span>
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-tight">
            เปิดประสบการณ์ใหม่ <br className="hidden sm:inline" />
            ไปกับทริปที่คุณเลือกได้
          </h1>
          
          <p className="text-sm sm:text-base text-blue-100 font-light leading-relaxed">
            สัมผัสการเดินทางสุดพิเศษพร้อมแผนกิจกรรม มื้ออาหาร ที่พัก และบริการเสริม Add-on ที่ออกแบบมาเพื่อคุณโดยเฉพาะ
          </p>

          {/* Quick Search Bar inside Hero */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl">
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อแพ็กเกจ สถานที่ท่องเที่ยว พาร์ทเนอร์..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-transparent py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mr-2 text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-md"
                  >
                    ล้าง
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none"
                >
                  <option value="recommended">แนะนำ / ล่าสุด</option>
                  <option value="price_asc">ราคา: ต่ำ - สูง</option>
                  <option value="price_desc">ราคา: สูง - ต่ำ</option>
                  <option value="duration_desc">ระยะเวลา: มากที่สุด</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Chips Bar */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        {/* Duration filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1">
            <Filter className="h-3.5 w-3.5" /> ตัวกรอง:
          </span>

          <button
            onClick={() => setFilterDuration("all")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              filterDuration === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ทั้งหมด ({packages.length})
          </button>

          <button
            onClick={() => setFilterDuration("1day")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              filterDuration === "1day"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ทริป 1 วัน
          </button>

          <button
            onClick={() => setFilterDuration("2days")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              filterDuration === "2days"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            2 วัน 1 คืน
          </button>

          <button
            onClick={() => setFilterDuration("3plus")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              filterDuration === "3plus"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            3 วันขึ้นไป
          </button>
        </div>

        {/* Counter */}
        <div className="text-xs font-medium text-slate-500">
          พบ <span className="font-bold text-slate-800">{filteredPackages.length}</span> แพ็กเกจ
        </div>
      </section>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-[430px] rounded-3xl border border-slate-100 bg-white p-4 shadow-sm animate-pulse flex flex-col justify-between"
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
        <div className="min-h-[360px] rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-400">
            <Compass className="h-8 w-8 text-slate-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">ไม่พบแพ็กเกจที่ตรงตามเงื่อนไข</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              ลองค้นหาด้วยคำอื่น หรือกดล้างตัวกรองเพื่อดูแพ็กเกจทั้งหมดที่มีให้บริการ
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterDuration("all");
              setFilterAddonOnly(false);
            }}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}

      {/* Package Grid */}
      {!isLoading && filteredPackages.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </div>
  );
}