"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Heart,
  Hotel,
  MapPin,
  Share,
  Copy,
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
  Archive,
  X,
  UserCheck,
  Crown,
  Search,
  Plane,
  Coins,
} from "lucide-react";
import PackageGallery from "@/components/package/PackageGallery";
import { UserAvatar } from "@/components/package/CollaboratorBox";
import { formatThaiDateRange } from "@/lib/date";
import {
  getAuth,
  subscribeAuth,
  getAuthServerSnapshot,
} from "@/lib/auth-client";

export default function CustomerPackageViewPage({ params }) {
  const currentUser = useSyncExternalStore(
    subscribeAuth,
    getAuth,
    getAuthServerSnapshot,
  );
  const [packageData, setPackageData] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [adults, setAdults] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState({});
  const [collaborators, setCollaborators] = useState([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleAddCollaborator = (user) => {
    setCollaborators((prev) => {
      if (prev.some((c) => c.id === user.id)) return prev;
      const next = [...prev, user];
      setAdults((cur) => Math.max(cur, 1 + next.length));
      return next;
    });
  };

  const handleRemoveCollaborator = (user) => {
    setCollaborators((prev) => {
      const next = prev.filter((c) => c.id !== user.id);
      setAdults((cur) => Math.max(1 + next.length, Math.max(1, cur - 1)));
      return next;
    });
  };

  // Unwrap params using React.use() in Next.js 15
  const unwrappedParams = React.use(params);
  const id = unwrappedParams?.id || "1";
  const router = useRouter();

  const handleBookingClick = () => {
    const addonIds = Object.keys(selectedAddons).join(",");
    const collabParam =
      collaborators.length > 0
        ? `&collabs=${collaborators.map((c) => c.id).join(",")}`
        : "";
    const bookingPath = `/package/${id}/booking?adults=${adults}${addonIds ? `&addons=${addonIds}` : ""}${collabParam}`;

    // ถ้ายังไม่ได้เข้าสู่ระบบ ให้พาไปหน้า login / register ทันที
    if (!currentUser) {
      router.push(`/auth/sign-in?redirect=${encodeURIComponent(bookingPath)}`);
      return;
    }

    router.push(bookingPath);
  };

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
    setExpandedDays((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopyLink = () => {
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
          <h2 className="text-xl font-bold text-slate-800">
            ไม่พบข้อมูลแพ็กเกจ
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            แพ็กเกจนี้อาจถูกลบหรือไม่มีอยู่ในระบบ
          </p>
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
  const totalActivities = dayplans.reduce(
    (sum, d) => sum + (d.activities?.length || 0),
    0,
  );
  const totalMeals = dayplans.reduce(
    (sum, d) => sum + (d.meals?.length || 0),
    0,
  );
  const hotels = Array.from(
    new Set(
      dayplans
        .map((d) => d.hotel?.trim())
        .filter(
          (h) =>
            Boolean(h) &&
            !h.includes("สิ้นสุดโปรแกรม") &&
            !h.includes("สิ้นสุดการเดินทาง") &&
            !h.includes("สิ้นสุดทริป") &&
            !h.toLowerCase().includes("end of tour"),
        ),
    ),
  );
  const unitPrice = packageData.price || 0;
  const basePrice = unitPrice * adults;
  const addonsTotal = Object.values(selectedAddons).reduce(
    (sum, item) => sum + (item.price || 0),
    0,
  );
  const totalPrice = basePrice + addonsTotal;

  const travelStartDate =
    packageData.start_date || packageData.dayplans?.[0]?.dt;
  const travelEndDate =
    packageData.end_date ||
    packageData.dayplans?.[packageData.dayplans.length - 1]?.dt;
  const travelDateText = formatThaiDateRange(travelStartDate, travelEndDate, {
    shortMonth: true,
  });
  const bookingPeriodText = formatThaiDateRange(
    packageData.booking_start_date,
    packageData.booking_end_date,
    { shortMonth: true },
  );

  const now = new Date();
  const isBeforeBookingStart =
    packageData.booking_start_date &&
    new Date(packageData.booking_start_date) > now;
  const isAfterBookingEnd =
    packageData.booking_end_date &&
    new Date(new Date(packageData.booking_end_date).setHours(23, 59, 59, 999)) <
      now;
  const isBookingPeriodValid = !isBeforeBookingStart && !isAfterBookingEnd;
  const isBookingOpen =
    (packageData.status === "Published" || !packageData.status) &&
    isBookingPeriodValid;

  const closedReason = !isBookingPeriodValid
    ? isBeforeBookingStart
      ? `ยังไม่เปิดรับจอง (เปิด ${new Date(packageData.booking_start_date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })})`
      : `หมดเขตรับจองแล้ว (สิ้นสุด ${new Date(packageData.booking_end_date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })})`
    : packageData.status === "Closed"
      ? "ปิดรับจองแล้ว / ที่นั่งเต็ม"
      : packageData.status === "Draft"
        ? "ยังไม่เปิดให้จอง (ฉบับร่าง)"
        : "ปิดรับจองแล้ว";

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 min-h-screen bg-white pb-36 lg:pb-12">
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
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-pointer"
            title="แชร์แพ็กเกจนี้"
          >
            <Share className="h-4 w-4" />
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
              <h4 className="font-bold text-sm text-amber-900">
                แพ็กเกจนี้อยู่ในสถานะฉบับร่าง (Draft Preview)
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                ทัวร์นี้ยังไม่เปิดเผยแพร่ให้ลูกค้าทั่วไปเข้าชมหรือค้นหาบนเว็บไซต์
                ระบบการจองจึงถูกระงับไว้ชั่วคราว
                ข้อมูลและราคาอาจมีการเปลี่ยนแปลง
              </p>
            </div>
          </div>
        )}

        {packageData.status === "Closed" && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-950 shadow-sm">
            <Ban className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-rose-900">
                ปิดรับจองแล้ว / ที่นั่งเต็ม (Closed)
              </h4>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                ขออภัยในความไม่สะดวก แพ็กเกจท่องเที่ยวนี้ปิดรับการจองแล้ว
                หรือมีผู้เดินทางครบจำนวนที่กำหนดแล้ว ท่านสามารถเลือกดูทริปอื่นๆ
                ที่เปิดให้จองได้
              </p>
            </div>
          </div>
        )}

        {packageData.status === "Archived" && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-slate-300 bg-slate-100 p-4 text-slate-800 shadow-sm">
            <Archive className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                แพ็กเกจนี้ถูกเก็บถาวร (Archived)
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                ทัวร์นี้ยุติการให้บริการหรือสิ้นสุดฤดูกาลแล้ว
                ไม่สามารถทำการจองได้
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
            {/* Stored Metadata Tags & Partners (Placed above Description) */}
            <div className="mb-6 space-y-3">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2.5 text-sm">
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
              </div>

              {/* Partners Information */}
              {((packageData.partners && packageData.partners.length > 0) ||
                packageData.partner) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Handshake className="h-3.5 w-3.5 text-indigo-600" />{" "}
                    พาร์ทเนอร์ร่วมบริการ:
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

            {/* Overview Section */}
            {packageData.description && (
              <section className="mb-10">
                <h2 className="text-xl font-bold text-slate-900 mb-3">
                  รายละเอียดแพ็กเกจ
                </h2>
                <div className="text-slate-600 leading-relaxed text-base whitespace-pre-line bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                  {packageData.description}
                </div>
              </section>
            )}

            {/* Itinerary Section */}
            <section className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    กำหนดการเดินทาง
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    รวมทั้งสิ้น {totalDays} วัน {totalActivities} กิจกรรม
                  </p>
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
                          {expandedDays[index] ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
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
                          {(day.location?.name ||
                            day.hotel ||
                            (day.meals && day.meals.length > 0)) && (
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
                                    {day.meals
                                      .map((m) => m.meal?.type_name)
                                      .filter(Boolean)
                                      .join(", ")}
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
                                  <div
                                    key={act.id}
                                    className="relative flex items-start gap-2.5"
                                  >
                                    {/* Fixed 24px column with dot centered horizontally at 12px */}
                                    <div className="flex w-6 shrink-0 justify-center pt-3.5">
                                      <div
                                        className={`relative z-1 h-3 w-3 rounded-full border-2 ring-4 ring-white ${
                                          act.status === "optional"
                                            ? "border-amber-400 bg-white"
                                            : "border-indigo-600 bg-indigo-600"
                                        }`}
                                      ></div>
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
                                            <Clock className="h-3 w-3 text-slate-400" />{" "}
                                            {act.time}
                                          </span>
                                        )}
                                        {act.landmark && (
                                          <span className="flex items-center gap-1 text-slate-600">
                                            <MapPin className="h-3 w-3 text-indigo-500" />{" "}
                                            {act.landmark}
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

            {/* Tour Guides & Staff Section */}
            {packageData.packageGuides &&
              packageData.packageGuides.length > 0 && (
                <section className="mt-12">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-indigo-600" />
                      ไกด์และทีมงานประจำทริป (Tour Guides & Staff)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      ทีมงานมืออาชีพที่จะคอยดูแล อำนวยความสะดวก
                      และมอบความประทับใจตลอดการเดินทาง
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {packageData.packageGuides.map((guide) => {
                      const isLead = guide.role === "LEAD_GUIDE";
                      return (
                        <div
                          key={guide.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isLead
                              ? "bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 border-amber-200 shadow-xs"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${
                                isLead
                                  ? "bg-amber-100 text-amber-800 border-2 border-amber-300 shadow-xs"
                                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              }`}
                            >
                              {guide.emp?.name
                                ? guide.emp.name.slice(0, 2)
                                : "ไกด์"}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm sm:text-base truncate">
                                  {guide.emp?.name || "ไกด์นำเที่ยว"}
                                </span>
                                {isLead && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                    <Crown className="h-3 w-3 text-amber-600 shrink-0" />
                                    <span>ไกด์หลัก</span>
                                  </span>
                                )}
                                {guide.role === "ASSISTANT_GUIDE" && (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                    ไกด์ผู้ช่วย
                                  </span>
                                )}
                                {guide.role === "COORDINATOR" && (
                                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                    ผู้ประสานงาน
                                  </span>
                                )}
                              </div>

                              {guide.note && (
                                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                  {guide.note}
                                </p>
                              )}

                              {guide.emp?.phone && (
                                <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                                  <span>ติดต่อผู้ประสานงาน:</span>
                                  <span className="font-semibold text-slate-700">
                                    {guide.emp.phone}
                                  </span>
                                </p>
                              )}
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
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  ราคาเริ่มต้น
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold text-slate-900">
                    ฿{unitPrice.toLocaleString()}
                  </p>
                  <span className="text-sm font-medium text-slate-500">
                    / ท่าน
                  </span>
                </div>

                {/* Accommodation Badges under Price */}
                {hotels.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {hotels.map((hotel, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50/70 px-2.5 py-1 text-xs font-semibold text-blue-800 shadow-2xs"
                      >
                        <Hotel className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span>{hotel}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Package Summary based on stored DB fields */}
              <div className="space-y-3 mb-6 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Clock className="h-4 w-4 text-slate-400" /> ระยะเวลา
                  </span>
                  <span className="font-semibold text-slate-900">
                    {totalDays} วัน
                  </span>
                </div>
                {packageData.location?.name && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-2 text-slate-500">
                      <MapPin className="h-4 w-4 text-slate-400" /> สถานที่
                    </span>
                    <span className="font-semibold text-slate-900 truncate max-w-37.5">
                      {packageData.location.name}
                    </span>
                  </div>
                )}
                {totalActivities > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Compass className="h-4 w-4 text-slate-400" />{" "}
                      กิจกรรมทั้งหมด
                    </span>
                    <span className="font-semibold text-slate-900">
                      {totalActivities} จุด
                    </span>
                  </div>
                )}
                {totalMeals > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Utensils className="h-4 w-4 text-slate-400" /> มื้ออาหาร
                    </span>
                    <span className="font-semibold text-slate-900">
                      {totalMeals} มื้อ
                    </span>
                  </div>
                )}
                {/* Fixed Travel Dates from DB */}
                {travelDateText && (
                  <div className="flex justify-between items-start text-slate-600 pt-1">
                    <span className="flex items-center gap-2 text-slate-500 shrink-0">
                      <Plane className="h-4 w-4 text-slate-400" /> วันเดินทาง
                    </span>
                    <span className="font-bold text-indigo-950 text-xs text-right">
                      {travelDateText}
                    </span>
                  </div>
                )}
                {/* Booking Open Period */}
                {(packageData.booking_start_date ||
                  packageData.booking_end_date) && (
                  <div className="flex justify-between items-start text-slate-600 pt-1">
                    <span className="flex items-center gap-2 text-slate-500 shrink-0">
                      <Calendar className="h-4 w-4 text-slate-400" />{" "}
                      ช่วงเวลาเปิดจอง
                    </span>
                    <span className="font-semibold text-slate-900 text-xs text-right">
                      {bookingPeriodText || "เปิดรับจองตลอด"}
                    </span>
                  </div>
                )}
              </div>

              {/* Itemized Price Breakdown */}
              {addonsTotal > 0 && (
                <div className="pt-3 pb-3 mb-5 space-y-1.5 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>ราคาหลัก:</span>
                    <span>฿{basePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-indigo-600 font-medium">
                    <span>
                      บริการเสริม ({Object.keys(selectedAddons).length} รายการ):
                    </span>
                    <span>+฿{addonsTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 font-bold text-slate-800">
                    <span>ยอดรวมสุทธิ:</span>
                    <span className="text-base text-indigo-600">
                      ฿{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Booking CTA Button */}
              {isBookingOpen ? (
                <button
                  type="button"
                  onClick={handleBookingClick}
                  className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-lg focus:ring-4 focus:ring-indigo-100 active:scale-[0.99] cursor-pointer"
                >
                  จองแพ็กเกจนี้
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    disabled
                    className="w-full rounded-xl bg-slate-100 py-3.5 text-sm sm:text-base font-bold text-slate-400 cursor-not-allowed border border-slate-200"
                  >
                    {closedReason}
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
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/90 bg-white shadow-[0_-10px_25px_rgba(0,0,0,0.08)] lg:hidden">
        {/* Price & Action Row */}
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <p className="text-xs font-medium text-slate-500">
              ราคารวม ({adults} ท่าน
              {collaborators.length > 0
                ? ` • ${collaborators.length} Collab`
                : ""}
              )
            </p>
            <p className="text-xl font-bold text-indigo-600">
              ฿{totalPrice.toLocaleString()}
            </p>
          </div>
          {isBookingOpen ? (
            <button
              type="button"
              onClick={handleBookingClick}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
            >
              จองแพ็กเกจ
            </button>
          ) : (
            <button
              disabled
              className="rounded-xl bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed max-w-[200px] truncate"
              title={closedReason}
            >
              {closedReason}
            </button>
          )}
        </div>
      </div>

      {/* Booking Confirmation Modal with Collab Summary */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {bookingSuccess ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4 animate-bounce">
                  <UserCheck className="h-9 w-9" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  จองแพ็กเกจและส่งคำเชิญสำเร็จ!
                </h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                  ระบบได้บันทึกคำขอจองแพ็กเกจ {packageData.name}{" "}
                  และส่งคำเชิญไปยังผู้ร่วมทริปทุกคนแล้ว
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBookingModalOpen(false);
                      setBookingSuccess(false);
                    }}
                    className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      ยืนยันข้อมูลการจองทริป
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Tour details summary */}
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      แพ็กเกจทัวร์
                    </p>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">
                      {packageData.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" /> ระยะเวลา {totalDays} วัน
                      {packageData.location?.name && (
                        <>
                          <span>•</span>
                          <MapPin className="h-3.5 w-3.5" />{" "}
                          {packageData.location.name}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Participants Breakdown (Owner + Collaborators) */}
                  <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        ผู้ร่วมเดินทางทั้งหมด ({adults} ท่าน)
                      </span>
                      <span className="text-xs font-medium text-indigo-600">
                        {collaborators.length > 0
                          ? `ผู้จอง 1 + Collab ${collaborators.length} คน`
                          : "ผู้จอง 1 คน"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Overlapping Avatars */}
                      <div className="flex items-center -space-x-2 shrink-0 py-0.5">
                        <UserAvatar
                          user={currentUser || { name: "คุณ" }}
                          size="sm"
                          showCrown
                        />
                        {collaborators.map((c) => (
                          <UserAvatar key={c.id} user={c} size="sm" />
                        ))}
                      </div>

                      {/* Member Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 flex-1">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                          <span>{currentUser?.name || "คุณ"}</span>
                          <span
                            title="Owner"
                            className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-white"
                          >
                            <Crown className="h-2 w-2" />
                          </span>
                        </span>
                        {collaborators.map((c) => (
                          <span
                            key={c.id}
                            className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200"
                          >
                            @{c.name}
                          </span>
                        ))}
                        {adults > 1 + collaborators.length && (
                          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500 border border-slate-200/60">
                            +{adults - (1 + collaborators.length)} ผู้ติดตาม
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing summary */}
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>
                        ค่าแพ็กเกจ ({adults} ท่าน × ฿
                        {unitPrice.toLocaleString()}):
                      </span>
                      <span className="font-semibold text-slate-900">
                        ฿{basePrice.toLocaleString()}
                      </span>
                    </div>
                    {addonsTotal > 0 && (
                      <div className="flex justify-between text-indigo-600">
                        <span>
                          บริการเสริม ({Object.keys(selectedAddons).length}{" "}
                          รายการ):
                        </span>
                        <span className="font-semibold">
                          +฿{addonsTotal.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm font-bold">
                      <span className="text-slate-800">ยอดชำระสุทธิ:</span>
                      <span className="text-xl font-extrabold text-indigo-600">
                        ฿{totalPrice.toLocaleString()}
                      </span>
                    </div>

                    {/* Loyalty Reward Points Preview */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                      <div>
                        <span className="font-bold text-slate-800">
                          รับแต้มสะสมสมาชิก
                        </span>
                        <p className="text-[10px] text-slate-400">
                          คำนวณ 100 บาท = 1 แต้ม
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-amber-600 text-sm">
                          +{Math.floor(totalPrice / 100)} แต้ม
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleBookingClick}
                    className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    ไปกรอกข้อมูลการจอง
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social Share & Copy Link Modal */}
      {isShareModalOpen && (
        <div
          onClick={() => setIsShareModalOpen(false)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-2xs">
                  <Share className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    แชร์แพ็กเกจทัวร์
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ส่งต่อทริปนี้ให้เพื่อนหรือคนในครอบครัว
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Package Mini Preview */}
            <div className="my-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-100">
              {packageData.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={packageData.image}
                  alt={packageData.name}
                  className="h-14 w-14 rounded-xl object-cover shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://images.unsplash.com/photo-1589394815804-964ce0fa2556?auto=format&fit=crop&w=400&q=80";
                  }}
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shrink-0">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 line-clamp-2">
                  {packageData.name}
                </p>
                <p className="text-xs font-extrabold text-indigo-600 mt-0.5">
                  ฿{unitPrice.toLocaleString()}{" "}
                  <span className="text-[10px] font-normal text-slate-400">
                    / ท่าน
                  </span>
                </p>
              </div>
            </div>

            {/* Social Share Buttons Grid */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 mb-3">
                แชร์ไปยังโซเชียลมีเดีย
              </p>
              <div className="grid grid-cols-4 gap-2.5">
                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== "undefined" ? window.location.href : "";
                    window.open(
                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                      "_blank",
                      "width=600,height=500"
                    );
                  }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition cursor-pointer group"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">Facebook</span>
                </button>

                {/* LINE */}
                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== "undefined" ? window.location.href : "";
                    window.open(
                      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
                      "_blank",
                      "width=600,height=500"
                    );
                  }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition cursor-pointer group"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#06C755] text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19.365 9.864c0-4.043-4.195-7.332-9.365-7.332C4.83 2.532.635 5.821.635 9.864c0 3.623 3.322 6.666 7.808 7.218.304.066.718.201.823.46.094.236.062.605.03.844l-.133.805c-.04.24-.188.94.825.513 1.013-.427 5.465-3.218 7.457-5.509 1.365-1.523 1.92-3.075 1.92-4.332z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">LINE</span>
                </button>

                {/* X (Twitter) */}
                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== "undefined" ? window.location.href : "";
                    const text = `เที่ยวทริป ${packageData.name} กับ Zentura!`;
                    window.open(
                      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
                      "_blank",
                      "width=600,height=500"
                    );
                  }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">X</span>
                </button>

                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== "undefined" ? window.location.href : "";
                    const text = `เที่ยวทริป ${packageData.name}: ${url}`;
                    window.open(
                      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
                      "_blank"
                    );
                  }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition cursor-pointer group"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 0C5.396 0 .029 5.367.029 11.987c0 2.108.549 4.165 1.595 5.97L.004 24l6.196-1.625a11.94 11.94 0 0 0 5.831 1.505h.005c6.635 0 12.002-5.367 12.002-11.992C24.038 5.367 18.666 0 12.031 0zm0 21.883h-.004a9.92 9.92 0 0 1-5.06-1.385l-.363-.215-3.763.987 1.005-3.668-.236-.375a9.96 9.96 0 0 1-1.528-5.239c0-5.503 4.478-9.98 9.989-9.98 2.666 0 5.172 1.039 7.057 2.925a9.92 9.92 0 0 1 2.924 7.058c0 5.505-4.477 9.982-9.981 9.982z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Copy Link Input Box */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-2 block">
                หรือคัดลอกลิงก์
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 pl-3 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <span className="text-xs text-slate-500 truncate flex-1 select-all font-mono">
                  {typeof window !== "undefined" ? window.location.href : ""}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    copied
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs active:scale-95"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>คัดลอกลิงก์</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
