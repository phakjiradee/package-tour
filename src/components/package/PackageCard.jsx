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

  // Partner name
  const partnerName =
    pkg.partner?.name || pkg.partners?.[0]?.partner?.name || null;

  const hasAddons = pkg.addons && pkg.addons.length > 0;

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
      className={`group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl min-h-62.5 sm:min-h-[380px] ${className}`}
    >
      {/* Background Image (Expanded height with bottom bright white transparent gradient) */}
      <div className="absolute inset-x-0 top-0 h-80 sm:h-96 w-full overflow-hidden bg-slate-100">
        {pkg.image && !imgError ? (
          <Image
            width={1200}
            height={900}
            src={pkg.image}
            alt={pkg.name || "Package Tour"}
            unoptimized
            className="h-full w-full object-cover transition-transform duration-700"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 text-blue-300">
            <Compass className="h-12 w-12 stroke-[1.5]" />
          </div>
        )}

        {/* Bottom bright white transparent gradient overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 sm:h-64 bg-linear-to-t from-white via-white/85 to-transparent" />
      </div>

      {/* Content Container (Overlapping the image) */}
      <div className="relative z-10 flex flex-1 flex-col justify-between p-5 pt-48 sm:pt-62">
        <div className="space-y-2.5">
          {/* Destination / Location Tag */}
          {pkg.location?.name && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-800 shadow-sm ring-1 ring-black/5 backdrop-blur-md w-fit">
              <MapPin className="h-3 w-3 text-red-500" />
              <span className="truncate max-w-56">{pkg.location.name}</span>
            </div>
          )}

          {/* Title */}
          <Link href={`/package/${pkg.id}`} className="block">
            <h3 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {pkg.name}
            </h3>
          </Link>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between gap-3">
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
