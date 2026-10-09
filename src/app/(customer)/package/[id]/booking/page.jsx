"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  Users,
  User,
  Phone,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Loader2,
  Compass
} from "lucide-react";
import bookingService from "@/service/booking";

export default function PackageBookingPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Unwrap dynamic params
  const unwrappedParams = React.use(params);
  const packageId = unwrappedParams?.id || "1";

  // Pre-filled from query string if available
  const initialAdults = parseInt(searchParams.get("adults")) || 1;
  const initialAddonIds = searchParams.get("addons")
    ? searchParams.get("addons").split(",").map(id => parseInt(id)).filter(Boolean)
    : [];

  // State
  const [packageData, setPackageData] = useState(null);
  const [isLoadingPackage, setIsLoadingPackage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form State
  const [travelDate, setTravelDate] = useState("");
  const [adultCount, setAdultCount] = useState(initialAdults);
  const [childCount, setChildCount] = useState(0);

  // Contact Info
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactLineId, setContactLineId] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // Selected Addons: { [addonId]: true }
  const [selectedAddons, setSelectedAddons] = useState(() => {
    const init = {};
    initialAddonIds.forEach(id => { init[id] = true; });
    return init;
  });

  // Travelers array (dynamically sync with adultCount + childCount)
  const [travelers, setTravelers] = useState([
    { title: "นาย", full_name: "", id_card_or_passport: "", phone: "" }
  ]);

  // Load Package Details
  useEffect(() => {
    async function fetchPackage() {
      try {
        const res = await fetch(`http://localhost:4000/api/packages/${packageId}`);
        if (res.ok) {
          const data = await res.json();
          setPackageData(data);
        }
      } catch (err) {
        console.error("Fetch package error:", err);
      } finally {
        setIsLoadingPackage(false);
      }
    }
    fetchPackage();
  }, [packageId]);

  // Set minimum travel date to tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split("T")[0];

  // Sync travelers count with total people
  const totalPeople = adultCount + childCount;
  useEffect(() => {
    setTravelers(prev => {
      const next = [...prev];
      if (next.length < totalPeople) {
        while (next.length < totalPeople) {
          next.push({
            title: next.length >= adultCount ? "เด็กชาย" : "นาย",
            full_name: "",
            id_card_or_passport: "",
            phone: ""
          });
        }
      } else if (next.length > totalPeople) {
        return next.slice(0, totalPeople);
      }
      return next;
    });
  }, [adultCount, childCount, totalPeople]);

  // If first traveler name is empty, sync with contactName
  const handleTravelerChange = (index, field, value) => {
    setTravelers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleAddon = (addonId) => {
    setSelectedAddons(prev => ({
      ...prev,
      [addonId]: !prev[addonId]
    }));
  };

  // Calculations (1 set per booking for addons)
  const unitPrice = packageData?.price || 0;
  const baseTotal = unitPrice * adultCount;
  
  const activeAddons = (packageData?.addons || []).filter(
    addon => selectedAddons[addon.id] && addon.status === 1
  );
  const addonsTotal = activeAddons.reduce((sum, item) => sum + (item.price || 0), 0);
  const grandTotal = baseTotal + addonsTotal;

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Validate Required Fields
    if (!travelDate) {
      setErrorMessage("กรุณาเลือกวันออกเดินทาง");
      return;
    }
    if (!contactName.trim() || !contactPhone.trim() || !contactEmail.trim()) {
      setErrorMessage("กรุณากรอกข้อมูลผู้ติดต่อให้ครบถ้วน (ชื่อ, เบอร์โทร, อีเมล)");
      return;
    }

    // Format selected addons payload
    const formattedAddons = activeAddons.map(item => ({
      addon_id: item.id,
      quantity: 1
    }));

    // Ensure lead traveler has name
    const finalTravelers = travelers.map((t, idx) => ({
      ...t,
      full_name: t.full_name?.trim() || (idx === 0 ? contactName.trim() : `ผู้ร่วมเดินทางท่านที่ ${idx + 1}`)
    }));

    const payload = {
      package_id: parseInt(packageId),
      travel_date: new Date(travelDate).toISOString(),
      adult_count: adultCount,
      child_count: childCount,
      contact_name: contactName.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      contact_line_id: contactLineId.trim() || null,
      special_requests: specialRequests.trim() || null,
      travelers: finalTravelers,
      selected_addons: formattedAddons
    };

    try {
      setIsSubmitting(true);
      const res = await bookingService.create(payload);
      if (res?.success && res?.data?.booking_code) {
        router.push(`/booking/success/${res.data.booking_code}`);
      } else {
        setErrorMessage(res?.message || "ไม่สามารถทำรายการได้ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      console.error("Booking error:", err);
      const msg = err.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPackage) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium">กำลังเตรียมข้อมูลการจอง...</p>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Compass className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">ไม่พบแพ็กเกจนี้</h2>
        <Link
          href="/package"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          กลับสู่หน้ารายการแพ็กเกจ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Top Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/package/${packageId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>กลับหน้ารายละเอียดแพ็กเกจ</span>
          </Link>

          {/* Stepper Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-indigo-600">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">1</span>
              กรอกข้อมูลการจอง
            </span>
            <span className="text-slate-300">→</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-500">2</span>
              ยืนยัน & ชำระเงิน
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ยืนยันการจองแพ็กเกจท่องเที่ยว
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            กรุณากรอกข้อมูลผู้เดินทางเพื่อสำรองที่นั่งและรับใบยืนยันการจองทัวร์
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Form Details (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Card 1: วันที่และจำนวนคน */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">กำหนดการเดินทาง</h2>
                    <p className="text-xs text-slate-500">เลือกวันที่และจำนวนผู้ร่วมเดินทาง</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      วันที่ออกเดินทาง <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={minDateString}
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      จำนวนผู้เดินทาง
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 rounded-xl border border-slate-200 px-3 py-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">ผู้ใหญ่</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAdultCount(Math.max(1, adultCount - 1))}
                            className="h-6 w-6 rounded-md bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold text-slate-800 w-4 text-center">{adultCount}</span>
                          <button
                            type="button"
                            onClick={() => setAdultCount(adultCount + 1)}
                            className="h-6 w-6 rounded-md bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 rounded-xl border border-slate-200 px-3 py-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">เด็ก</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setChildCount(Math.max(0, childCount - 1))}
                            className="h-6 w-6 rounded-md bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold text-slate-800 w-4 text-center">{childCount}</span>
                          <button
                            type="button"
                            onClick={() => setChildCount(childCount + 1)}
                            className="h-6 w-6 rounded-md bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: ข้อมูลผู้ติดต่อหลัก */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">ข้อมูลผู้ติดต่อหลัก</h2>
                    <p className="text-xs text-slate-500">สำหรับรับเอกสารยืนยันและติดต่อในวันเดินทาง</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      ชื่อ-นามสกุล ผู้ติดต่อ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="เช่น สมชาย ใจดี"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="0812345678"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      อีเมล <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="example@mail.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      LINE ID (ถ้ามี)
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="เช่น somchai_line"
                        value={contactLineId}
                        onChange={(e) => setContactLineId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: ข้อมูลผู้ร่วมเดินทาง (Travelers) */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      รายชื่อผู้ร่วมเดินทาง ({travelers.length} ท่าน)
                    </h2>
                    <p className="text-xs text-slate-500">ข้อมูลสำหรับทำประกันอุบัติเหตุและรายชื่อขึ้นยานพาหนะ</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {travelers.map((traveler, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          ผู้เดินทางท่านที่ {index + 1} {index === 0 && "(ผู้ติดต่อหลัก)"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-3">
                          <select
                            value={traveler.title}
                            onChange={(e) => handleTravelerChange(index, "title", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="นาย">นาย</option>
                            <option value="นาง">นาง</option>
                            <option value="นางสาว">นางสาว</option>
                            <option value="เด็กชาย">เด็กชาย</option>
                            <option value="เด็กหญิง">เด็กหญิง</option>
                          </select>
                        </div>

                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            placeholder="ชื่อ - นามสกุล"
                            value={traveler.full_name}
                            onChange={(e) => handleTravelerChange(index, "full_name", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            placeholder="เลขบัตร ปชช. / Passport"
                            value={traveler.id_card_or_passport}
                            onChange={(e) => handleTravelerChange(index, "id_card_or_passport", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: บริการเสริม (Addon Packages) */}
              {packageData.addons && packageData.addons.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">บริการเสริมพิเศษ (Add-on)</h2>
                      <p className="text-xs text-slate-500">คิดราคาเหมา 1 ชุดต่อการจองนี้</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {packageData.addons.map((addon) => {
                      const isSelected = !!selectedAddons[addon.id];
                      return (
                        <div
                          key={addon.id}
                          onClick={() => toggleAddon(addon.id)}
                          className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50/40 shadow-sm"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent onClick
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{addon.addon_name}</p>
                              <p className="text-xs text-slate-500">บริการเหมาต่อ 1 ทริปการจอง</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-indigo-600">
                            +฿{addon.price?.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Card 5: คำขอพิเศษ */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">คำขอพิเศษเพิ่มเติม</h2>
                    <p className="text-xs text-slate-500">เช่น อาหารมังสวิรัติ, แพ้อาหาร, รถเข็นวีลแชร์</p>
                  </div>
                </div>

                <textarea
                  rows={3}
                  placeholder="ระบุข้อความหรือคำขอพิเศษถึงเจ้าหน้าที่..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

            </div>

            {/* Right Column: Order Summary (4 Cols Sticky) */}
            <div className="lg:col-span-4 sticky top-24 space-y-4">
              
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
                <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                  สรุปรายละเอียดการจอง
                </h3>

                {/* Package Thumbnail & Name */}
                <div className="flex gap-3.5 mb-5 pb-5 border-b border-slate-100">
                  {packageData.image ? (
                    <img
                      src={packageData.image}
                      alt={packageData.name}
                      className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <Compass className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed">
                      {packageData.name}
                    </h4>
                    {travelDate && (
                      <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-indigo-500" />
                        {new Date(travelDate).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 text-xs text-slate-600 mb-5">
                  <div className="flex justify-between">
                    <span>ค่าแพ็กเกจ ({adultCount} ท่าน)</span>
                    <span className="font-semibold text-slate-900">
                      ฿{baseTotal.toLocaleString()}
                    </span>
                  </div>

                  {activeAddons.length > 0 && (
                    <div className="pt-2 border-t border-dashed border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">บริการเสริมที่เลือก:</span>
                      {activeAddons.map(a => (
                        <div key={a.id} className="flex justify-between text-slate-600 pl-2">
                          <span className="truncate max-w-[180px]">{a.addon_name}</span>
                          <span>+฿{a.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between pt-3 border-t border-slate-100 text-sm font-medium">
                    <span className="text-slate-700">ยอดรวมทั้งสิ้น:</span>
                    <span className="text-xl font-extrabold text-indigo-600">
                      ฿{grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Submit CTA Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>กำลังดำเนินการจอง...</span>
                    </>
                  ) : (
                    <span>ยืนยันการจองแพ็กเกจ</span>
                  )}
                </button>

                {/* Trust Badge */}
                <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>ระบบบันทึกข้อมูลปลอดภัยตามมาตรฐาน</span>
                </div>
              </div>

            </div>

          </div>
        </form>

      </div>
    </div>
  );
}
