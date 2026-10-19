"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Compass, MapPin, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function PackageCard({ pkg, className = "" }) {
  const [imgError, setImgError] = useState(false);

  if (!pkg) return null;

  const dayplans = pkg.dayplans || [];
  const daysCount = dayplans.length;
  const nightsCount = daysCount > 1 ? daysCount - 1 : 0;
  const durationLabel =
    daysCount > 0
      ? `${daysCount} วัน ${nightsCount > 0 ? `${nightsCount} คืน` : ""}`
      : "ทริปพิเศษ";

  const now = new Date();
  const isBeforeStart =
    pkg.booking_start_date && new Date(pkg.booking_start_date) > now;
  const isAfterEnd =
    pkg.booking_end_date &&
    new Date(new Date(pkg.booking_end_date).setHours(23, 59, 59, 999)) < now;
  const isClosed = pkg.status === "Closed" || isAfterEnd;
  const isUpcoming = isBeforeStart && !isClosed;

  return (
    <div
      className={`group relative overflow-hidden flex flex-col justify-between rounded-3xl p-2 border border-slate-200/80 shadow-sm  ${className}`}
    >
      {/* Location Tag floating on image */}
      <div className="flex items-center justify-between px-1.5 pb-2 ">
        {pkg.location?.name && (
          <div className=" inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 ">
            <MapPin className="h-3 w-3 text-red-500 shrink-0" />
            {pkg.location.name}
          </div>
        )}

        {daysCount > 0 && (
          <div className="rounded-full bg-blue-100 border border-blue-500/30 text-blue-500 px-2.5 py-1 text-[10px] font-bold shadow-xs">
            {durationLabel}
          </div>
        )}
      </div>

      {/* 1. Top Section: Image (rounded-2xl) */}
      <div className="relative h-48 sm:h-64 w-full shrink-0">
        {pkg.image && !imgError ? (
          <div className="absolute inset-0">
            <Image
              width={1200}
              height={900}
              src={pkg.image}
              alt={pkg.name || "Package Tour"}
              unoptimized
              className="h-full w-full object-cover blur-2xl opacity-50 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <Image
                width={1200}
                height={900}
                src={pkg.image}
                alt={pkg.name || "Package Tour"}
                unoptimized
                className="h-full w-full object-cover transition-transform duration-500"
                onError={() => setImgError(true)}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 text-blue-300">
            <Compass className="h-12 w-12 stroke-[1.5]" />
          </div>
        )}
      </div>

      {/* 2. Bottom Section: Content */}
      <div className="flex flex-1 flex-col justify-between px-2 pt-1.5 pb-1 space-y-4">
        {/* Price & Action */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
              ราคาเริ่มต้น
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">
                ฿{(pkg.price || 0).toLocaleString()}
              </span>
              <span className="text-[11px] font-normal text-slate-400">
                / ท่าน
              </span>
            </div>
          </div>

          {isAfterEnd ? (
            <Link
              href={`/package/${pkg.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-semibold text-slate-500 transition-all hover:bg-slate-200"
            >
              <span>ดูข้อมูล (หมดเขต)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : pkg.status === "Closed" ? (
            <Link
              href={`/package/${pkg.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-semibold text-slate-500 transition-all hover:bg-slate-200"
            >
              <span>ดูข้อมูล (ปิดรับจอง)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : isUpcoming ? (
            <Link
              href={`/package/${pkg.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs font-semibold text-amber-800 transition-all hover:bg-amber-100"
            >
              <span>ดูข้อมูล (เปิดจองเร็วๆ นี้)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href={`/package/${pkg.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 transition-all hover:bg-blue-700 hover:gap-2 active:scale-95"
            >
              <span>ดูรายละเอียด & จอง</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
