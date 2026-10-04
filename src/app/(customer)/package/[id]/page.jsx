"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  Heart,
  Hotel,
  MapPin,
  Share,
  Utensils,
  Image as ImageIcon,
  Compass,
  Users,
  Handshake,
  Building2,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Ban,
  EyeOff,
  Archive
} from "lucide-react";
import PackageGallery from "@/components/package/PackageGallery";

export default function CustomerPackageViewPage({ params }) {
  const [packageData, setPackageData] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [adults, setAdults] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState({});

  // Unwrap params using React.use() in Next.js 15
  const unwrappedParams = React.use(params);
  const id = unwrappedParams?.id || "1";

  useEffect(() => {
    let ignore = false;
    async function loadPackage() {
      try {
        const res = await fetch(`http://localhost:4000/api/packages/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setPackageData(data);
            const expanded = {};
            data.dayplans?.forEach((_, idx) => {
              expanded[idx] = true;
            });
            setExpandedDays(expanded);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadPackage();
    return () => {
      ignore = true;
    };
  }, [id]);

  const toggleDay = (index) => {
    setExpandedDays(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-sm font-medium">กำลังโหลดข้อมูลแพ็กเกจ...</p>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Compass className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">ไม่พบข้อมูลแพ็กเกจ</h2>
          <p className="text-sm text-slate-500 mt-1">แพ็กเกจนี้อาจถูกลบหรือไม่มีอยู่ในระบบ</p>
        </div>
        <Link
          href="/package"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          กลับหน้ารายการแพ็กเกจ
        </Link>
      </div>
    );
  }

  const handleToggleAddon = (addon) => {
    if (addon.status === 0) return;
    setSelectedAddons((prev) => {
      const current = prev[addon.id];
      if (current) {
        const next = { ...prev };
        delete next[addon.id];
        return next;
      }
      return {
        ...prev,
        [addon.id]: {
          name: addon.addon_name,
          price: addon.price || 0,
        },
      };
    });
  };

  // Calculate actual statistics from stored database records
  const dayplans = packageData.dayplans || [];
  const totalDays = dayplans.length;
  const totalActivities = dayplans.reduce((sum, d) => sum + (d.activities?.length || 0), 0);
  const totalMeals = dayplans.reduce((sum, d) => sum + (d.meals?.length || 0), 0);
  const hotels = Array.from(new Set(dayplans.map(d => d.hotel).filter(Boolean)));
  const unitPrice = packageData.price || 0;
  const basePrice = unitPrice * adults;
  const addonsTotal = Object.values(selectedAddons).reduce((sum, item) => sum + (item.price || 0), 0);
  const totalPrice = basePrice + addonsTotal;
  const isBookingOpen = packageData.status === "Published" || !packageData.status;

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-12">
      
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between py-4 border-b border-slate-100 mb-6">
        <Link 
          href="/package" 
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>ย้อนกลับหน้ารายการ</span>
        </Link>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShare}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="แชร์ลิงก์"
          >
            <Share className="h-4 w-4" />
            {copied && (
              <span className="absolute -bottom-8 right-0 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-md whitespace-nowrap">
                คัดลอกลิงก์แล้ว!
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              isLiked 
                ? "border-rose-200 bg-rose-50 text-rose-500" 
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="บันทึกที่ชอบ"
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-500" : ""}`} />
          </button>
        </div>
      </div>

      <main>
        {/* Status Notice Banner (Draft / Closed / Archived) */}
        {packageData.status === "Draft" && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-900">แพ็กเกจนี้อยู่ในสถานะฉบับร่าง (Draft Preview)</h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                ทัวร์นี้ยังไม่เปิดเผยแพร่ให้ลูกค้าทั่วไปเข้าชมหรือค้นหาบนเว็บไซต์ ระบบการจองจึงถูกระงับไว้ชั่วคราว ข้อมูลและราคาอาจมีการเปลี่ยนแปลง
              </p>
            </div>
          </div>
        )}

        {packageData.status === "Closed" && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-950 shadow-sm">
            <Ban className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-rose-900">ปิดรับจองแล้ว / ที่นั่งเต็ม (Closed)</h4>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                ขออภัยในความไม่สะดวก แพ็กเกจท่องเที่ยวนี้ปิดรับการจองแล้ว หรือมีผู้เดินทางครบจำนวนที่กำหนดแล้ว ท่านสามารถเลือกดูทริปอื่นๆ ที่เปิดให้จองได้
              </p>
            </div>
          </div>
        )}

        {packageData.status === "Archived" && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-slate-300 bg-slate-100 p-4 text-slate-800 shadow-sm">
            <Archive className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-slate-900">แพ็กเกจนี้ถูกเก็บถาวร (Archived)</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                ทัวร์นี้ยุติการให้บริการหรือสิ้นสุดฤดูกาลแล้ว ไม่สามารถทำการจองได้
              </p>
            </div>
          </div>
        )}

        {/* Title & Real Stored Metadata */}
        <div className="mb-6">
          {packageData.location?.name && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 mb-2">
              <MapPin className="h-4 w-4" />
              <span>{packageData.location.name}</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            {packageData.name}
          </h1>

          {/* Stored Metadata Tags (Only real data from DB) */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            {totalDays > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>{totalDays} วัน</span>
              </div>
            )}
            {totalActivities > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
                <Compass className="h-3.5 w-3.5 text-indigo-500" />
                <span>{totalActivities} กิจกรรม</span>
              </div>
            )}
            {totalMeals > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 font-medium text-orange-700">
                <Utensils className="h-3.5 w-3.5 text-orange-500" />
                <span>{totalMeals} มื้ออาหาร</span>
              </div>
            )}
            {packageData.status === "Published" && (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>เปิดให้จอง (Available)</span>
              </div>
            )}
            {packageData.status === "Draft" && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                <span>ฉบับร่าง (ยังไม่เปิดเผยแพร่)</span>
              </div>
            )}
            {packageData.status === "Closed" && (
              <div className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                <Ban className="h-3.5 w-3.5 text-rose-600" />
                <span>ปิดรับจองแล้ว / ที่นั่งเต็ม</span>
              </div>
            )}
            {packageData.status === "Archived" && (
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                <Archive className="h-3.5 w-3.5 text-slate-500" />
                <span>เก็บถาวร</span>
              </div>
            )}
          </div>

          {/* Stored Partners Information */}
          {((packageData.partners && packageData.partners.length > 0) || packageData.partner) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Handshake className="h-3.5 w-3.5 text-indigo-600" /> พาร์ทเนอร์ร่วมบริการ:
              </span>
              {packageData.partners && packageData.partners.length > 0 ? (
                packageData.partners.map((p) => (
                  <span
                    key={p.partner_id}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-800 border border-indigo-100 shadow-2xs"
                  >
                    <Building2 className="h-3 w-3 text-indigo-600" />
                    <span>{p.partner?.name}</span>
                    {p.partner?.pt_type?.name && (
                      <span className="text-[10px] text-indigo-500 font-normal">
                        ({p.partner.pt_type.name})
                      </span>
                    )}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-800 border border-indigo-100 shadow-2xs">
                  <Building2 className="h-3 w-3 text-indigo-600" />
                  <span>{packageData.partner.name}</span>
                  {packageData.partner.pt_type?.name && (
                    <span className="text-[10px] text-indigo-500 font-normal">
                      ({packageData.partner.pt_type.name})
                    </span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Photo Gallery (Airbnb / Agoda Mosaic + Fullscreen Lightbox) */}
        <div className="mb-8">
          <PackageGallery
            images={packageData.images}
            fallbackImage={packageData.image}
            packageName={packageData.name}
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-10">
          
          {/* Left Content */}
          <div className="flex-1 lg:max-w-[65%]">
            
            {/* Overview Section */}
            {packageData.description && (
              <section className="mb-10">
                <h2 className="text-xl font-bold text-slate-900 mb-3">รายละเอียดแพ็กเกจ</h2>
                <div className="text-slate-600 leading-relaxed text-base whitespace-pre-line bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                  {packageData.description}
                </div>
              </section>
            )}

            {/* Accommodation summary if stored in DB */}
            {hotels.length > 0 && (
              <section className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">ที่พัก / โรงแรม</h3>
                <div className="flex flex-wrap gap-2">
                  {hotels.map((hotel, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2 text-sm font-medium text-blue-800">
                      <Hotel className="h-4 w-4 text-blue-600" />
                      <span>{hotel}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Itinerary Section */}
            <section className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">กำหนดการเดินทาง</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">รวมทั้งสิ้น {totalDays} วัน {totalActivities} กิจกรรม</p>
                </div>
              </div>
              
              {dayplans.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                  ยังไม่มีกำหนดการเดินทางสำหรับแพ็กเกจนี้
                </div>
              ) : (
                <div className="space-y-4">
                  {dayplans.map((day, index) => (
                    <div 
                      key={day.id || index} 
                      className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all hover:border-slate-300"
                    >
                      {/* Day Header */}
                      <div 
                        className="flex items-center justify-between p-4 sm:p-5 cursor-pointer select-none bg-slate-50/60 hover:bg-slate-50 transition-colors"
                        onClick={() => toggleDay(index)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-sm shadow-indigo-200">
                            D{day.day_num}
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">
                              {day.title || `วันที่ ${day.day_num}`}
                            </h3>
                            {day.dt && (
                              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span>{day.dt}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-slate-400 pl-2">
                          {expandedDays[index] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </div>

                      {/* Day Details */}
                      {expandedDays[index] && (
                        <div className="p-4 sm:p-6 border-t border-slate-100 space-y-5">
                          {/* Day description */}
                          {day.description && (
                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                              {day.description}
                            </p>
                          )}

                          {/* Day Logistics: Location, Hotel & Meals (From DB) */}
                          {(day.location?.name || day.hotel || (day.meals && day.meals.length > 0)) && (
                            <div className="flex flex-wrap gap-2.5 pt-1">
                              {day.location?.name && (
                                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-700 border border-emerald-100">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{day.location.name}</span>
                                </div>
                              )}
                              {day.hotel && (
                                <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-700 border border-blue-100">
                                  <Hotel className="h-3.5 w-3.5" />
                                  <span>{day.hotel}</span>
                                </div>
                              )}
                              {day.meals && day.meals.length > 0 && (
                                <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-1.5 text-xs sm:text-sm font-medium text-orange-700 border border-orange-100">
                                  <Utensils className="h-3.5 w-3.5" />
                                  <span>
                                    {day.meals.map(m => m.meal?.type_name).filter(Boolean).join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Activities Timeline (From DB) */}
                          {day.activities && day.activities.length > 0 && (
                            <div className="pt-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                                กิจกรรมในวัน ({day.activities.length})
                              </h4>
                              <div className="relative space-y-4">
                                {/* Perfectly centered connecting line */}
                                <div className="absolute left-3 -translate-x-1/2 top-4 bottom-4 w-0.5 bg-slate-200"></div>
                                
                                {day.activities.map((act) => (
                                  <div key={act.id} className="relative flex items-start gap-2.5">
                                    {/* Fixed 24px column with dot centered horizontally at 12px */}
                                    <div className="flex w-6 shrink-0 justify-center pt-3.5">
                                      <div className={`relative z-10 h-3 w-3 rounded-full border-2 ring-4 ring-white ${
                                        act.status === "optional" 
                                          ? "border-amber-400 bg-white" 
                                          : "border-indigo-600 bg-indigo-600"
                                      }`}></div>
                                    </div>
                                    
                                    <div className="flex-1 rounded-xl bg-slate-50/70 p-3 sm:p-3.5 border border-slate-100">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold text-slate-900 text-sm sm:text-base">
                                          {act.activity}
                                        </span>
                                        {act.status === "optional" && (
                                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-200">
                                            ตัวเลือกเสริม (Optional)
                                          </span>
                                        )}
                                      </div>
                                      
                                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                        {act.time && (
                                          <span className="flex items-center gap-1 font-medium text-slate-700">
                                            <Clock className="h-3 w-3 text-slate-400" /> {act.time}
                                          </span>
                                        )}
                                        {act.landmark && (
                                          <span className="flex items-center gap-1 text-slate-600">
                                            <MapPin className="h-3 w-3 text-indigo-500" /> {act.landmark}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Add-on Packages Section */}
            {packageData.addons && packageData.addons.length > 0 && (
              <section className="mt-12">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    บริการเสริมพิเศษ (Add-on Services)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    เลือกบริการเสริมที่ต้องการเพื่อความสะดวกสบายและประสบการณ์ที่พิเศษยิ่งขึ้น
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {packageData.addons.map((addon) => {
                    const isSelected = Boolean(selectedAddons[addon.id]);
                    const isAvailable = addon.status === 1;

                    return (
                      <div
                        key={addon.id}
                        onClick={() => isAvailable && handleToggleAddon(addon)}
                        className={`p-4 rounded-2xl border transition-all select-none ${
                          !isAvailable
                            ? "border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600 cursor-pointer"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs cursor-pointer"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm sm:text-base">
                                {addon.addon_name}
                              </span>
                              {!isAvailable && (
                                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                  ซื้อไม่ได้
                                </span>
                              )}
                            </div>
                            {addon.max_limit && isAvailable && (
                              <span className="text-[11px] text-slate-500 mt-0.5 block">
                                จำกัดสูงสุด {addon.max_limit} ชุด
                              </span>
                            )}
                            <p className="text-sm font-extrabold text-indigo-600 mt-2">
                              +฿{addon.price?.toLocaleString()}
                            </p>
                          </div>

                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all mt-0.5 ${
                              !isAvailable
                                ? "border-slate-200 bg-slate-100"
                                : isSelected
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            
          </div>

          {/* Right Content: Stored Details & Booking Widget (Desktop) */}
          <div className="hidden lg:block lg:w-[35%] relative">
            <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
              
              {/* Stored Price */}
              <div className="mb-6 pb-5 border-b border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">ราคาเริ่มต้น</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold text-slate-900">
                    ฿{unitPrice.toLocaleString()}
                  </p>
                  <span className="text-sm font-medium text-slate-500">/ ท่าน</span>
                </div>
              </div>

              {/* Package Summary based on stored DB fields */}
              <div className="space-y-3 mb-6 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Clock className="h-4 w-4 text-slate-400" /> ระยะเวลา
                  </span>
                  <span className="font-semibold text-slate-900">{totalDays} วัน</span>
                </div>
                {packageData.location?.name && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-2 text-slate-500">
                      <MapPin className="h-4 w-4 text-indigo-500" /> สถานที่
                    </span>
                    <span className="font-semibold text-slate-900 truncate max-w-37.5">{packageData.location.name}</span>
                  </div>
                )}
                {totalActivities > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Compass className="h-4 w-4 text-slate-400" /> กิจกรรมทั้งหมด
                    </span>
                    <span className="font-semibold text-slate-900">{totalActivities} จุด</span>
                  </div>
                )}
                {totalMeals > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Utensils className="h-4 w-4 text-slate-400" /> มื้ออาหาร
                    </span>
                    <span className="font-semibold text-slate-900">{totalMeals} มื้อ</span>
                  </div>
                )}
                {((packageData.partners && packageData.partners.length > 0) || packageData.partner) && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Handshake className="h-4 w-4 text-indigo-500" /> พาร์ทเนอร์
                    </span>
                    <span className="font-semibold text-slate-900 truncate max-w-37.5">
                      {packageData.partners?.map((p) => p.partner?.name).filter(Boolean).join(", ") || packageData.partner?.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Number of Travelers Counter */}
              <div className="mb-6">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                  จำนวนผู้เดินทาง
                </label>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 px-3 bg-white">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold">{adults} คน</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAdults(prev => Math.max(1, prev - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-colors"
                      disabled={adults <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-slate-900">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults(prev => prev + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Itemized Price Breakdown */}
              {addonsTotal > 0 && (
                <div className="pt-3 pb-1 space-y-1.5 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>ราคาหลัก ({adults} ท่าน):</span>
                    <span>฿{basePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-indigo-600 font-medium">
                    <span>บริการเสริม ({Object.keys(selectedAddons).length} รายการ):</span>
                    <span>+฿{addonsTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Total Calculation */}
              <div className="flex justify-between items-baseline mb-6 pt-3 border-t border-slate-100">
                <span className="text-sm font-medium text-slate-600">ยอดรวมทั้งสิ้น:</span>
                <span className="text-2xl font-extrabold text-indigo-600">
                  ฿{totalPrice.toLocaleString()}
                </span>
              </div>

              {/* Booking CTA Button */}
              {isBookingOpen ? (
                <button className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-lg focus:ring-4 focus:ring-indigo-100 active:scale-[0.99]">
                  จองแพ็กเกจนี้
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    disabled
                    className="w-full rounded-xl bg-slate-100 py-3.5 text-sm sm:text-base font-bold text-slate-400 cursor-not-allowed border border-slate-200"
                  >
                    {packageData.status === "Closed"
                      ? "ปิดรับจองแล้ว / ที่นั่งเต็ม"
                      : packageData.status === "Draft"
                      ? "ยังไม่เปิดให้จอง (ฉบับร่าง)"
                      : "ปิดรับจองแล้ว"}
                  </button>
                  <Link
                    href="/package"
                    className="block text-center text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    ← เลือกดูแพ็กเกจทัวร์อื่นๆ ที่เปิดให้จอง
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Mobile Sticky Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3.5 shadow-[0_-10px_20px_rgba(0,0,0,0.06)] lg:hidden">
        <div>
          <p className="text-xs font-medium text-slate-500">ราคารวม ({adults} ท่าน)</p>
          <p className="text-xl font-bold text-indigo-600">฿{totalPrice.toLocaleString()}</p>
        </div>
        {isBookingOpen ? (
          <button className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700">
            จองแพ็กเกจ
          </button>
        ) : (
          <button
            disabled
            className="rounded-xl bg-slate-200 px-5 py-2.5 text-xs font-bold text-slate-400 cursor-not-allowed"
          >
            {packageData.status === "Closed" ? "ปิดรับจอง" : "ไม่เปิดให้จอง"}
          </button>
        )}
      </div>

    </div>
  );
}
