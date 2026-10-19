"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  TrendingUp,
  Flame,
  Tag,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import PackageCard from "@/components/package/PackageCard";
import VideoHeader from "@/components/layout/VideoHeader";

/**
 * Reusable Carousel Section for Packages (Limit 10 items per section)
 */
function PackageCarouselSection({
  title,
  subtitle,
  badgeText,
  badgeIcon: BadgeIcon,
  badgeColor = "text-blue-600 bg-blue-50 border-blue-200",
  packages = [],
  viewAllHref = "/package",
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
  }, [packages]);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 360 * 2;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!packages || packages.length === 0) return null;

  const displayList = packages.slice(0, 10);

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          {badgeText && (
            <div
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md px-2.5 py-0.5 border mb-1.5 ${badgeColor}`}
            >
              {BadgeIcon && <BadgeIcon className="h-3.5 w-3.5 shrink-0" />}
              <span>{badgeText}</span>
            </div>
          )}
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* View All & Carousel Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
          >
            <span>ดูทั้งหมด ({packages.length})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>

          {/* Previous / Next Arrow Buttons */}
          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              aria-label="เลื่อนซ้าย"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              aria-label="เลื่อนขวา"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Track */}
      <div className="relative group">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-5 overflow-x-auto scroll-smooth py-2 px-0.5 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {displayList.map((pkg) => (
            <div
              key={pkg.id}
              className="w-[280px] sm:w-[320px] lg:w-[350px] shrink-0 snap-start"
            >
              <PackageCard pkg={pkg} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CustomerHomePage() {
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Filter packages for customer visibility
  const visiblePackages = useMemo(() => {
    return packages.filter(
      (pkg) => pkg.status !== "Draft" && pkg.status !== "Archived"
    );
  }, [packages]);

  // 1. หัวข้อ: แนะนำยอดนิยม (Recommended / Popular - Limit 10)
  const recommendedPackages = useMemo(() => {
    return visiblePackages.slice(0, 10);
  }, [visiblePackages]);

  // 2. หัวข้อ: ขายดีตลอดกาล (All-Time Bestsellers - Limit 10)
  const bestsellerPackages = useMemo(() => {
    // If more than 10 packages, offset to give varied selection or reversed
    if (visiblePackages.length > 10) {
      return visiblePackages.slice(10, 20);
    }
    return [...visiblePackages].reverse().slice(0, 10);
  }, [visiblePackages]);

  // 3. หัวข้อ: ราคาพิเศษ (Special Deals - Sorted by lowest price first - Limit 10)
  const specialPricePackages = useMemo(() => {
    const listWithPrice = visiblePackages.filter((p) => (p.price || 0) > 0);
    return [...listWithPrice]
      .sort((a, b) => (a.price || 0) - (b.price || 0))
      .slice(0, 10);
  }, [visiblePackages]);

  const hasAnyResults =
    recommendedPackages.length > 0 ||
    bestsellerPackages.length > 0 ||
    specialPricePackages.length > 0;

  return (
    <div className="pb-16 space-y-12">
      {/* Hero Header Banner (Full Screen Edge-to-Edge) */}
      <VideoHeader videoSrc="/Tour_bus_driving_mountain_road_20261018232952.mp4" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-10">
            {[1, 2].map((s) => (
              <div key={s} className="space-y-4 animate-pulse">
                <div className="h-6 w-48 bg-slate-200 rounded-md" />
                <div className="flex gap-5 overflow-hidden">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-[320px] h-88 rounded-3xl bg-slate-100 shrink-0 border border-slate-200 p-3 space-y-3"
                    >
                      <div className="h-48 rounded-2xl bg-slate-200" />
                      <div className="h-4 w-3/4 rounded bg-slate-200" />
                      <div className="h-4 w-1/2 rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasAnyResults && (
          <div className="min-h-90 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-400">
              <Compass className="h-8 w-8 text-slate-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                ยังไม่มีรายการแพ็กเกจในขณะนี้
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                ขณะนี้ยังไม่มีแพ็กเกจเปิดให้บริการ กรุณากลับมาตรวจสอบใหม่อีกครั้ง
              </p>
            </div>
          </div>
        )}

        {/* 3 Categories / Carousel Sections (Limit 10 each) */}
        {!isLoading && hasAnyResults && (
          <div className="space-y-12">
            {/* 1. แนะนำยอดนิยม */}
            {recommendedPackages.length > 0 && (
              <PackageCarouselSection
                title="แพ็กเกจทัวร์แนะนำยอดนิยม"
                subtitle="ทริปการเดินทางที่ได้รับความนิยมสูงสุด พร้อมรายละเอียดครบถ้วน"
                badgeText="RECOMMENDED"
                badgeIcon={TrendingUp}
                badgeColor="text-blue-600 bg-blue-50 border-blue-200"
                packages={recommendedPackages}
                viewAllHref="/package"
              />
            )}

            {/* 2. ขายดีตลอดกาล */}
            {bestsellerPackages.length > 0 && (
              <PackageCarouselSection
                title="ทัวร์ขายดีตลอดกาล"
                subtitle="ทริปยอดฮิตที่ได้รับความไว้วางใจ และมีผู้ร่วมเดินทางจองอย่างต่อเนื่อง"
                badgeText="BESTSELLERS"
                badgeIcon={Flame}
                badgeColor="text-rose-600 bg-rose-50 border-rose-200"
                packages={bestsellerPackages}
                viewAllHref="/package"
              />
            )}

            {/* 3. ราคาพิเศษ */}
            {specialPricePackages.length > 0 && (
              <PackageCarouselSection
                title="แพ็กเกจราคาพิเศษ & สุดคุ้ม"
                subtitle="เปิดประสบการณ์ท่องเที่ยวในราคาสุดประหยัด คุ้มค่าทุกการเดินทาง"
                badgeText="SPECIAL OFFERS"
                badgeIcon={Tag}
                badgeColor="text-amber-700 bg-amber-50 border-amber-200"
                packages={specialPricePackages}
                viewAllHref="/package?tab=promotion"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}