"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
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
  Compass,
  Crown,
  UserCheck,
  Lock,
  Plane,
  Pencil,
  UserPlus,
  Bus,
  Check,
  X,
} from "lucide-react";
import bookingService from "@/service/booking";
import busService from "@/service/bus";
import authService from "@/service/auth";
import SeatMap from "@/components/bus/SeatMap";
import TravelerModal from "@/components/booking/TravelerModal";
import AddParticipantModal from "@/components/booking/AddParticipantModal";
import { UserAvatar } from "@/components/package/CollaboratorBox";
import { formatThaiDateRange } from "@/lib/date";
import {
  getAuth,
  subscribeAuth,
  getAuthServerSnapshot,
} from "@/lib/auth-client";
import Image from "next/image";

// Helper ฟังก์ชันจัดรูปแบบเบอร์โทรศัพท์ (0xx-xxx-xxxx) และจำกัดเฉพาะตัวเลข 10 หลัก
const formatPhoneNumber = (value) => {
  if (!value) return "";
  // 1. ตัดตัวอักษรที่ไม่ใช่ตัวเลขออกทั้งหมด และจำกัดสูงสุด 10 หลัก
  const cleaned = value.replace(/\D/g, "").slice(0, 10);

  // 2. เติมเครื่องหมายขีด (-) ตามตำแหน่ง
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  } else {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
};

// Fallback avatars for travelers: /adult-man.png, /adult-woman.png, /boy.png, /girl.png
function getTravelerFallbackAvatar(traveler) {
  const isChild = traveler?.passenger_type === "child";
  const title = (traveler?.title || "").trim();

  if (isChild) {
    if (title === "เด็กหญิง" || title === "ด.ญ." || title === "Miss") {
      return "/girl.png";
    }
    return "/boy.png";
  }

  // Adult
  if (
    title === "นาง" ||
    title === "นางสาว" ||
    title === "น.ส." ||
    title === "Mrs." ||
    title === "Ms." ||
    title === "Miss"
  ) {
    return "/adult-woman.png";
  }

  return "/adult-man.png";
}

function TravelerAvatar({ traveler, isFirst, displayName }) {
  const fallbackSrc = getTravelerFallbackAvatar(traveler);

  // If user is from collab and has an image, use it
  const collabUser = traveler?.collab_user;
  let customSrc = null;
  if (collabUser) {
    if (collabUser.avatar && collabUser.avatar !== "/no-image-user-v1.jpg") {
      customSrc = collabUser.avatar;
    } else if (collabUser.image) {
      customSrc = collabUser.image;
    } else if (collabUser.profile_image) {
      customSrc = collabUser.profile_image;
    } else {
      const nameKey = collabUser.name?.toLowerCase().trim();
      const presets = {
        muping: "/image 1.png",
        pooh01: "/image 3.png",
        pooh02: "/image 4.png",
        ormsin: "/image 5.png",
      };
      if (nameKey && presets[nameKey]) {
        customSrc = presets[nameKey];
      }
    }
  }

  const [hasError, setHasError] = useState(false);
  const src = !hasError && customSrc ? customSrc : fallbackSrc;

  return (
    <div className="relative shrink-0">
      <div className="relative h-11 w-10 sm:h-13 sm:w-12  bg-white shadow-2xs flex items-center justify-center">
        <Image
          src={src}
          alt={displayName || "ผู้เดินทาง"}
          width={44}
          height={44}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
        />
      </div>
      {isFirst && (
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs z-10">
          <Crown className="h-2.5 w-2.5" />
        </span>
      )}
    </div>
  );
}

export default function PackageBookingPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentUser = useSyncExternalStore(
    subscribeAuth,
    getAuth,
    getAuthServerSnapshot,
  );

  // Unwrap dynamic params
  const unwrappedParams = React.use(params);
  const packageId = unwrappedParams?.id || "1";

  // Pre-filled from query string if available
  const initialAdults = parseInt(searchParams.get("adults")) || 1;
  const initialAddonIds = searchParams.get("addons")
    ? searchParams
        .get("addons")
        .split(",")
        .map((id) => parseInt(id))
        .filter(Boolean)
    : [];
  const initialCollabIds = searchParams.get("collabs")
    ? searchParams
        .get("collabs")
        .split(",")
        .map((id) => parseInt(id))
        .filter(Boolean)
    : [];

  // State
  const [packageData, setPackageData] = useState(null);
  const [insurancePlan, setInsurancePlan] = useState(null);
  const [insuranceReady, setInsuranceReady] = useState(false);
  const [insuranceSelected, setInsuranceSelected] = useState(false);
  const [insuranceTermsAcknowledged, setInsuranceTermsAcknowledged] = useState(false);
  const [isLoadingPackage, setIsLoadingPackage] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ตรวจสอบสถานะการเข้าสู่ระบบ หากยังไม่ได้ล็อกอิน ให้พาไปหน้า sign-in ทันที
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("pt_token")
        : null;
    const auth = getAuth();
    if (!token && !auth && !currentUser) {
      const currentPath =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : `/package/${packageId}/booking`;
      router.replace(
        `/auth/sign-in?redirect=${encodeURIComponent(currentPath)}`,
      );
    } else {
      setIsCheckingAuth(false);
    }
  }, [currentUser, packageId, router]);

  // Collab & Participant Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTravelerIndex, setEditingTravelerIndex] = useState(null);

  // Form State
  const [travelDate, setTravelDate] = useState("");

  // Contact Info
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactLineId, setContactLineId] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // Selected Addons: { [addonId]: true }
  const [selectedAddons, setSelectedAddons] = useState(() => {
    const init = {};
    initialAddonIds.forEach((id) => {
      init[id] = true;
    });
    return init;
  });

  // Travelers array (Lead traveler is index 0)
  const [travelers, setTravelers] = useState(() => {
    const list = [
      {
        passenger_type: "adult",
        title: "นาย",
        full_name: "",
        id_card_or_passport: "",
        date_of_birth: "",
        phone: "",
        collab_user: null,
      },
    ];
    for (let i = 1; i < initialAdults; i++) {
      list.push({
        passenger_type: "adult",
        title: "นาย",
        full_name: "",
        id_card_or_passport: "",
        date_of_birth: "",
        phone: "",
        collab_user: null,
      });
    }
    return list;
  });

  // Bus Seating State
  const [buses, setBuses] = useState([]);
  const [takenSeats, setTakenSeats] = useState([]);
  const [isLoadingBuses, setIsLoadingBuses] = useState(false);
  const [seatAssignments, setSeatAssignments] = useState({}); // { [travelerIndex]: { bus_id: number, seat_code: string } }
  const [seatMapModal, setSeatMapModal] = useState({
    isOpen: false,
    travelerIndex: null,
    busId: null,
  });

  const handleTravelerBusChange = (travelerIndex, busId) => {
    setSeatAssignments((prev) => ({
      ...prev,
      [travelerIndex]: {
        bus_id: Number(busId),
        seat_code: "",
      },
    }));
  };

  const handleTravelerSeatChange = (travelerIndex, busId, seatCode) => {
    setSeatAssignments((prev) => ({
      ...prev,
      [travelerIndex]: {
        bus_id: Number(busId),
        seat_code: seatCode ? seatCode.trim().toLowerCase() : "",
      },
    }));
  };

  const handleClearTravelerSeat = (travelerIndex) => {
    setSeatAssignments((prev) => {
      const next = { ...prev };
      delete next[travelerIndex];
      return next;
    });
  };

  // Derived adult and child counts dynamically from travelers
  const adultCount = Math.max(
    1,
    travelers.filter((t) => t.passenger_type !== "child").length,
  );
  const childCount = travelers.filter(
    (t) => t.passenger_type === "child",
  ).length;
  const totalPeople = adultCount + childCount;

  // Derived collaborators from travelers list
  const collaborators = travelers
    .filter((t) => t.collab_user)
    .map((t) => t.collab_user);

  // Load Package Details
  useEffect(() => {
    async function fetchPackage() {
      try {
        const res = await fetch(
          `http://localhost:4000/api/packages/${packageId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setPackageData(data);
          const defaultDate = data.start_date || data.dayplans?.[0]?.dt;
          if (defaultDate) {
            setTravelDate(defaultDate);
          }
        }
      } catch (err) {
        console.error("Fetch package error:", err);
      } finally {
        setIsLoadingPackage(false);
      }
    }
    fetchPackage();
  }, [packageId]);

  useEffect(() => {
    let current = true;
    Promise.resolve().then(() => {
      setInsuranceReady(false);
      setInsurancePlan(null);
      setInsuranceSelected(false);
      setInsuranceTermsAcknowledged(false);
      return bookingService.getInsurancePlan(packageId);
    }).then((res) => { if (current) setInsurancePlan(res.data || null); })
      .catch(() => { if (current) setInsurancePlan(null); })
      .finally(() => { if (current) setInsuranceReady(true); });
    return () => { current = false; };
  }, [packageId]);

  // Load package buses and taken seats
  useEffect(() => {
    let ignore = false;
    async function loadPackageBuses() {
      if (!packageId) return;
      try {
        setIsLoadingBuses(true);
        const effectiveDate =
          travelDate || packageData?.start_date || packageData?.dayplans?.[0]?.dt;
        const res = await busService.getPackageBuses(packageId, effectiveDate);
        if (!ignore && res?.success) {
          setBuses(res.buses || []);
          setTakenSeats(res.taken || []);
        }
      } catch (err) {
        console.error("Load package buses error:", err);
      } finally {
        if (!ignore) setIsLoadingBuses(false);
      }
    }
    loadPackageBuses();
    return () => {
      ignore = true;
    };
  }, [packageId, travelDate, packageData?.start_date, packageData?.dayplans]);

  // Load initial collabs from query string if provided
  useEffect(() => {
    if (initialCollabIds.length > 0) {
      let ignore = false;
      async function loadCollabs() {
        try {
          const res = await authService.searchUsers(initialCollabIds.join(","));
          if (!ignore && res?.users) {
            const users = res.users.filter((u) =>
              initialCollabIds.includes(u.id),
            );
            if (users.length > 0) {
              const newTravelers = users.map((u) => ({
                passenger_type: "adult",
                title: "นาย",
                full_name: u.name,
                id_card_or_passport: "",
                date_of_birth: "",
                phone: u.phone || "",
                collab_user: u,
              }));
              setTravelers((prev) => [...prev, ...newTravelers]);
            }
          }
        } catch (err) {
          console.error("Error loading initial collabs:", err);
        }
      }
      loadCollabs();
      return () => {
        ignore = true;
      };
    }
  }, []);

  // Autofill contact info and lead traveler from logged in user if available
  useEffect(() => {
    if (currentUser) {
      if (!contactName && currentUser.name) setContactName(currentUser.name);
      if (!contactEmail && currentUser.email)
        setContactEmail(currentUser.email);
      if (!contactPhone && currentUser.phone)
        setContactPhone(formatPhoneNumber(currentUser.phone));

      setTravelers((prev) => {
        if (prev.length === 0) return prev;
        const first = prev[0];
        if (!first.full_name && currentUser.name) {
          const updated = [...prev];
          updated[0] = {
            ...first,
            full_name: currentUser.name,
            phone: first.phone || currentUser.phone || "",
          };
          return updated;
        }
        return prev;
      });
    }
  }, [currentUser]);

  // วันที่เดินทางของแพ็กเกจ และช่วงเวลาเปิดรับจอง
  const travelStartDate =
    packageData?.start_date || packageData?.dayplans?.[0]?.dt;
  const travelEndDate =
    packageData?.end_date ||
    packageData?.dayplans?.[packageData?.dayplans?.length - 1]?.dt;
  const travelDateRangeText = formatThaiDateRange(
    travelStartDate,
    travelEndDate,
    { shortMonth: true },
  );
  const bookingPeriodText = formatThaiDateRange(
    packageData?.booking_start_date,
    packageData?.booking_end_date,
    { shortMonth: true },
  );

  // Participant handlers
  const handleAddManual = (data) => {
    setTravelers((prev) => [
      ...prev,
      {
        ...data,
        passenger_type: data.passenger_type || "adult",
        collab_user: null,
      },
    ]);
  };

  const handleAddCollabs = (users) => {
    const newTravelers = users.map((u) => ({
      passenger_type: "adult",
      title: "นาย",
      full_name: u.name,
      id_card_or_passport: "",
      date_of_birth: "",
      phone: u.phone || "",
      collab_user: u,
    }));
    setTravelers((prev) => [...prev, ...newTravelers]);
  };

  const handleDeleteTraveler = (indexToDelete) => {
    if (indexToDelete === 0) return;
    setTravelers((prev) => prev.filter((_, idx) => idx !== indexToDelete));
  };

  // If traveler field is changed in manual mode
  const handleTravelerChange = (index, field, value) => {
    setTravelers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) => ({
      ...prev,
      [addonId]: !prev[addonId],
    }));
  };

  // Calculations (1 set per booking for addons)
  const unitPrice = packageData?.price || 0;
  const baseTotal = unitPrice * adultCount;

  const activeAddons = (packageData?.addons || []).filter(
    (addon) => selectedAddons[addon.id] && addon.status === 1,
  );
  const addonsTotal = activeAddons.reduce(
    (sum, item) => sum + (item.price || 0),
    0,
  );
  const insuranceCanPurchase = Boolean(
    insurancePlan?.active && !insurancePlan?.is_demo &&
    insurancePlan.id === packageData?.insurance_plan_id,
  );
  const insuranceTotal = insuranceSelected && insuranceCanPurchase ? insurancePlan.premium_satang * totalPeople / 100 : 0;
  const grandTotal = baseTotal + addonsTotal + insuranceTotal;

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Travel date กำหนดตามรอบเดินทางของแพ็กเกจ ไม่ต้องให้ผู้ใช้เลือกเอง
    const finalTravelDate =
      travelDate || travelStartDate || new Date().toISOString();

    const activeContactName = (contactName || currentUser?.name || "").trim();
    const activeContactPhone = (
      contactPhone ||
      currentUser?.phone ||
      ""
    ).trim();
    const activeContactEmail = (
      contactEmail ||
      currentUser?.email ||
      ""
    ).trim();
    const activeContactLineId = (
      contactLineId ||
      currentUser?.lineId ||
      ""
    ).trim();

    if (!activeContactName || !activeContactPhone || !activeContactEmail) {
      setErrorMessage(
        "กรุณากรอกข้อมูลผู้ติดต่อให้ครบถ้วนในบัญชีโปรไฟล์ (ชื่อ, เบอร์โทร, อีเมล)",
      );
      return;
    }

    const cleanPhoneDigits = activeContactPhone.replace(/\D/g, "");
    if (cleanPhoneDigits.length !== 10) {
      setErrorMessage(
        "กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก (เช่น 095-809-2434)",
      );
      return;
    }

    // ตรวจสอบความปลอดภัย: หากยังไม่ได้ล็อกอิน ให้เด้งไปหน้า sign-in ทันที
    if (!currentUser) {
      const currentPath =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : `/package/${packageId}/booking`;
      router.replace(
        `/auth/sign-in?redirect=${encodeURIComponent(currentPath)}`,
      );
      return;
    }

    if (insuranceSelected && !insuranceCanPurchase) {
      setErrorMessage("แผนประกันนี้เป็นแผนตัวอย่างหรือยังไม่เปิดขาย กรุณายกเลิกการเลือกประกันก่อนจอง");
      return;
    }
    if (insuranceSelected && !insuranceTermsAcknowledged) {
      setErrorMessage("กรุณาอ่านและรับทราบเงื่อนไขกรมธรรม์ก่อนจอง");
      return;
    }
    const incompleteIndex = travelers.findIndex((t, idx) =>
      !(t.full_name?.trim() || (idx === 0 && activeContactName)) ||
      !t.id_card_or_passport?.trim() || !t.date_of_birth
    );
    if (incompleteIndex !== -1) {
      setErrorMessage(`กรุณากรอกชื่อ เลขบัตร/Passport และวันเกิดของผู้เดินทางท่านที่ ${incompleteIndex + 1} ให้ครบ`);
      setEditingTravelerIndex(incompleteIndex);
      return;
    }

    // Format selected addons payload
    const formattedAddons = activeAddons.map((item) => ({
      addon_id: item.id,
      quantity: 1,
    }));

    const formattedSeatAssignments = Object.entries(seatAssignments)
      .filter(([_, item]) => item && item.bus_id && item.seat_code)
      .map(([idx, item]) => ({
        passenger_index: parseInt(idx, 10),
        bus_id: Number(item.bus_id),
        seat_code: item.seat_code.trim().toLowerCase(),
      }));

    // Lead traveler may use the account name; every other name must be explicit.
    const finalTravelers = travelers.map((t, idx) => ({
      ...t,
      full_name: t.full_name?.trim() || (idx === 0 ? activeContactName : ""),
      seat_code: seatAssignments[idx]?.seat_code
        ? seatAssignments[idx].seat_code.trim().toLowerCase()
        : null,
      bus_id: seatAssignments[idx]?.bus_id
        ? Number(seatAssignments[idx].bus_id)
        : null,
    }));

    const payload = {
      package_id: parseInt(packageId),
      travel_date: new Date(finalTravelDate).toISOString(),
      adult_count: adultCount,
      child_count: childCount,
      contact_name: activeContactName,
      contact_phone: activeContactPhone,
      contact_email: activeContactEmail,
      contact_line_id: activeContactLineId || null,
      special_requests: specialRequests.trim() || null,
      travelers: finalTravelers,
      selected_addons: formattedAddons,
      seat_assignments: formattedSeatAssignments,
      insurance_selected: insuranceSelected,
      insurance_plan_id: insuranceSelected ? insurancePlan.id : null,
      insurance_plan_updated_at: insuranceSelected ? insurancePlan.updatedAt : null,
      insurance_terms_acknowledged: insuranceSelected && insuranceTermsAcknowledged,
      collab_ids: collaborators.map((c) => c.id),
    };

    try {
      setIsSubmitting(true);
      const res = await bookingService.create(payload);
      if (res?.success && res?.data?.booking_code) {
        router.push(`/booking/success/${res.data.booking_code}`);
      } else {
        setErrorMessage(
          res?.message || "ไม่สามารถทำรายการได้ กรุณาลองใหม่อีกครั้ง",
        );
      }
    } catch (err) {
      console.error("Booking error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth && !currentUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium">
          กำลังตรวจสอบสิทธิ์การเข้าสู่ระบบ...
        </p>
      </div>
    );
  }

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
      <div className="container mx-auto px-4 sm:px-6">
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
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                1
              </span>
              กรอกข้อมูลการจอง
            </span>
            <span className="text-slate-300">→</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-500">
                2
              </span>
              ยืนยัน & ชำระเงิน
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form Details (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Card 1: ข้อมูลผู้ติดต่อหลัก (Profile Account Card) */}
              <div className="rounded-2xl border border-slate-200/90 bg-linear-to-br from-slate-50/70 via-white to-indigo-50/30 p-5 shadow-sm">
                {/* Profile Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
                  <div className="flex items-center gap-3.5">
                    <div className="relative shrink-0">
                      <UserAvatar
                        user={currentUser || { name: contactName || "คุณ" }}
                        size="lg"
                      />
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-2xs">
                        <Crown className="h-2.5 w-2.5" />
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-slate-900">
                          {currentUser?.name || contactName || "ผู้ใช้งาน"}
                        </h3>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 uppercase">
                          {currentUser?.role?.name ||
                            currentUser?.role ||
                            "ผู้จองหลัก"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        เจ้าของบัญชีผู้ทำรายการจอง (Lead Traveler)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    {currentUser?.points !== undefined && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs font-bold shadow-2xs">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>{currentUser.points.toLocaleString()} คะแนน</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => router.push("/profile")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>ยืนยันตัวตน</span>
                    </button>
                  </div>
                </div>

                {/* Contact Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
                  {/* เบอร์โทรศัพท์ */}
                  <div className="rounded-xl bg-white border border-slate-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] font-medium text-slate-400">
                        เบอร์โทรศัพท์
                      </span>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm truncate block">
                        {contactPhone || currentUser?.phone ? (
                          formatPhoneNumber(contactPhone || currentUser?.phone)
                        ) : (
                          <span className="text-amber-600 font-sans italic text-xs">
                            ยังไม่ได้ระบุ
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* อีเมล */}
                  <div className="rounded-xl bg-white border border-slate-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] font-medium text-slate-400">
                        อีเมล
                      </span>
                      <span className="font-bold text-slate-800 truncate block text-xs sm:text-sm">
                        {currentUser?.email || contactEmail || "-"}
                      </span>
                    </div>
                  </div>

                  {/* LINE ID */}
                  <div className="rounded-xl bg-white border border-slate-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] font-medium text-slate-400">
                        LINE ID
                      </span>
                      <span className="font-bold text-slate-800 truncate block text-xs sm:text-sm">
                        {currentUser?.lineId || contactLineId || (
                          <span className="text-slate-400 font-normal">
                            ไม่ได้ระบุ
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: ข้อมูลผู้ร่วมเดินทาง (Travelers) */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>รายชื่อผู้ร่วมเดินทาง</span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        ข้อมูลสำหรับรายชื่อขึ้นยานพาหนะ และใช้ทำประกันเมื่อเลือกซื้อ
                      </p>
                    </div>
                  </div>
                </div>

                {/* Travelers List */}
                <div className="space-y-3">
                  {travelers.map((traveler, index) => {
                    const isFirst = index === 0;
                    const isCollab = Boolean(traveler.collab_user);
                    const displayName = isFirst
                      ? currentUser?.name || contactName || traveler.full_name
                      : traveler.collab_user
                        ? traveler.collab_user.name
                        : traveler.full_name;

                    const isNameFilled = Boolean(displayName?.trim());
                    const isIdFilled = Boolean(
                      traveler.id_card_or_passport?.trim(),
                    );
                    const isComplete = isNameFilled && isIdFilled && Boolean(traveler.date_of_birth);

                    return (
                      <div
                        key={index}
                        onClick={() => {
                          setEditingTravelerIndex(index);
                        }}
                        className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border p-4 transition-all cursor-pointer ${
                          isComplete
                            ? "border-sky-200/90 bg-white hover:border-sky-400 hover:shadow-xs"
                            : "border-dashed border-sky-300 bg-sky-50/40 hover:border-sky-400 hover:bg-sky-50/60"
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          {/* Traveler Avatar (Fallback illustration or Collab user photo) */}
                          <TravelerAvatar
                            traveler={traveler}
                            isFirst={isFirst}
                            displayName={displayName}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  traveler.passenger_type === "child"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                }`}
                              >
                                {traveler.passenger_type === "child"
                                  ? "เด็ก (Child)"
                                  : "ผู้ใหญ่ (Adult)"}
                              </span>

                              {isFirst ? (
                                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1 shadow-2xs">
                                  <Crown className="h-3 w-3 text-slate-400" />
                                  <span>บัญชีผู้จอง</span>
                                </span>
                              ) : isCollab ? (
                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 shadow-2xs">
                                  <UserCheck className="h-3 w-3 text-emerald-600" />
                                  <span>
                                    Collab: @{traveler.collab_user.name}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                  ข้อมูลทั่วไป (Manual)
                                </span>
                              )}

                              {isComplete ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3" />
                                  ข้อมูลครบแล้ว
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200">
                                  รอกรอกข้อมูล
                                </span>
                              )}
                            </div>

                            {/* Details Row */}
                            {isNameFilled ? (
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                                <span className="font-bold text-slate-900 text-sm">
                                  {traveler.title} {displayName}
                                </span>
                                <span className="text-slate-300">|</span>
                                <span className="inline-flex items-center gap-1">
                                  <CreditCard className="h-3 w-3 text-slate-400" />
                                  <span className="font-medium text-slate-700">
                                    {traveler.id_card_or_passport || (
                                      <span className="text-slate-400 font-sans italic">
                                        ยังไม่ได้ระบุเลขบัตร / Passport
                                      </span>
                                    )}
                                  </span>
                                </span>
                                {traveler.phone && (
                                  <>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-slate-500">
                                      โทร: {traveler.phone}
                                    </span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">
                                ยังไม่ได้ระบุชื่อและเลขบัตร
                                คลิกที่นี่เพื่อกรอกข้อมูล
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action CTA Buttons */}
                        <div className="flex items-center gap-2 sm:self-center shrink-0">
                          {isComplete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTravelerIndex(index);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 group-hover:border-indigo-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-2xs cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span>แก้ไข</span>
                            </button>
                          )}

                          {!isFirst && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  window.confirm(
                                    `คุณต้องการลบผู้เดินทางท่านที่ ${
                                      index + 1
                                    } ออกจากทริปหรือไม่?`,
                                  )
                                ) {
                                  handleDeleteTraveler(index);
                                }
                              }}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-2xs"
                              title="ลบผู้เดินทางนี้"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dashed Add Participant Button */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-indigo-50/60 hover:border-indigo-300 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all cursor-pointer"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>
                      + เพิ่มผู้เข้าร่วมทัวร์ (เลือกแบบทั่วไป หรือ Collab)
                    </span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">ประกันการเดินทาง</h2>
                    <p className="text-xs text-slate-500">{insuranceCanPurchase ? "เลือกซื้อสำหรับผู้ร่วมเดินทางทุกคนในรายการจองนี้" : "แผนประกันที่กำหนดให้แพ็กเกจนี้"}</p>
                  </div>
                </div>
                <label className={`flex items-start gap-3 rounded-xl border p-4 ${insuranceSelected ? "border-indigo-500 bg-indigo-50/40" : "border-slate-200"}`}>
                  <input
                    type="checkbox"
                    checked={insuranceSelected}
                    disabled={!insuranceReady || !insurancePlan}
                    onChange={(event) => {
                      setInsuranceSelected(event.target.checked);
                      setInsuranceTermsAcknowledged(false);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-slate-700">
                    <span className="block font-semibold">{insurancePlan && !insuranceCanPurchase ? "ทดลองเลือกแผนประกัน" : "ซื้อประกันการเดินทาง"}</span>
                    {insurancePlan ? <span className="mt-1 block text-xs text-slate-500">{insurancePlan.insurer_name} · {insurancePlan.plan_name} · {insuranceCanPurchase ? "฿" : "ราคาอ้างอิง ฿"}{(insurancePlan.premium_satang / 100).toLocaleString("th-TH")} ต่อคน</span> : <span className="mt-1 block text-xs text-amber-700">{insuranceReady ? "แพ็กเกจนี้ยังไม่ได้เลือกแผนประกัน สามารถจองโดยไม่ซื้อประกันได้" : "กำลังโหลดแผนประกัน..."}</span>}
                  </span>
                </label>
                {insurancePlan && !insuranceCanPurchase && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{insurancePlan.is_demo ? "แผนนี้เป็นข้อมูลตัวอย่าง (DEMO)" : "แผนนี้เป็นข้อมูลจริงจากบริษัทประกัน แต่ยังไม่เปิดขายผ่าน Zentura"} ติ๊กเพื่อดูรายละเอียดได้ แต่ยังจองพร้อมประกันหรือชำระเบี้ยไม่ได้ กรุณายกเลิกการเลือกก่อนยืนยันการจอง{!insurancePlan.is_demo && <> · <a href={insurancePlan.terms_url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">ดูข้อมูลจากบริษัทประกัน</a></>}</p>}
                {insuranceSelected && insuranceCanPurchase && <label className="mt-4 flex items-start gap-2 text-xs text-slate-600">
                  <input type="checkbox" checked={insuranceTermsAcknowledged} onChange={(event) => setInsuranceTermsAcknowledged(event.target.checked)} className="mt-0.5" />
                  <span>ฉันอ่านและรับทราบ<a href={insurancePlan.terms_url} target="_blank" rel="noopener noreferrer" className="mx-1 font-semibold text-indigo-600 underline">เงื่อนไขกรมธรรม์</a>และการส่งข้อมูลผู้เดินทางให้บริษัทประกันแล้ว</span>
                </label>}
              </div>

              {/* Card 4: บริการเสริม (Addon Packages) */}
              {packageData.addons && packageData.addons.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        บริการเสริมพิเศษ (Add-on)
                      </h2>
                      <p className="text-xs text-slate-500">
                        คิดราคาเหมา 1 ชุดต่อการจองนี้
                      </p>
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
                              <p className="text-sm font-semibold text-slate-800">
                                {addon.addon_name}
                              </p>
                              <p className="text-xs text-slate-500">
                                บริการเหมาต่อ 1 ทริปการจอง
                              </p>
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

              {/* Card: ระบุที่นั่งบนรถบัส (Seat Selection) */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Bus className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>ระบุที่นั่งบนรถบัส</span>
                        <span className="text-[11px] font-medium text-slate-400 font-normal">
                          (อ้างอิงรถบัสประจำแพ็กเกจ)
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        เลือกหรือระบุที่นั่งล่วงหน้าสำหรับผู้เดินทางแต่ละท่านก่อนชำระเงิน
                      </p>
                    </div>
                  </div>
                  {buses.length > 0 && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      รถ {buses.length} คัน
                    </span>
                  )}
                </div>

                {isLoadingBuses ? (
                  <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    <span>กำลังโหลดข้อมูลรถบัสและที่นั่ง...</span>
                  </div>
                ) : buses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                    <p>แพ็กเกจนี้ยังไม่มีข้อมูลรถบัสประจำทริป</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      เจ้าหน้าที่จะทำการจัดที่นั่งให้หลังชำระเงินเรียบร้อยแล้ว
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {travelers.map((traveler, idx) => {
                      const currentAssignment = seatAssignments[idx];
                      const currentBusId =
                        currentAssignment?.bus_id || buses[0]?.id;
                      const selectedBus =
                        buses.find((b) => b.id === currentBusId) || buses[0];
                      const travelerName =
                        traveler.full_name?.trim() ||
                        (idx === 0
                          ? activeContactName || "ผู้จองหลัก"
                          : `ผู้เดินทางคนที่ ${idx + 1}`);

                      return (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all hover:border-slate-300"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              #{idx + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {travelerName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span>
                                  {traveler.passenger_type === "child"
                                    ? "เด็ก"
                                    : "ผู้ใหญ่"}
                                </span>
                                {currentAssignment?.seat_code ? (
                                  <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase">
                                    ที่นั่ง {currentAssignment.seat_code} ·{" "}
                                    {selectedBus?.name}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">
                                    ยังไม่ระบุที่นั่ง
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* เลือกรถบัส (กรณีมีมากกว่า 1 คัน) */}
                            {buses.length > 1 && (
                              <select
                                value={currentBusId}
                                onChange={(e) =>
                                  handleTravelerBusChange(idx, e.target.value)
                                }
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
                              >
                                {buses.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.name} ({b.plate || "ไม่ระบุทะเบียน"})
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* Input ระบุที่นั่ง */}
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="เช่น a1, b2"
                                value={
                                  currentAssignment?.seat_code?.toUpperCase() ||
                                  ""
                                }
                                onChange={(e) =>
                                  handleTravelerSeatChange(
                                    idx,
                                    currentBusId,
                                    e.target.value,
                                  )
                                }
                                className="w-24 uppercase rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 text-center outline-none focus:border-indigo-500 placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setSeatMapModal({
                                    isOpen: true,
                                    travelerIndex: idx,
                                    busId: currentBusId,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer"
                              >
                                <Bus className="h-3.5 w-3.5" />
                                <span>ผังที่นั่ง</span>
                              </button>

                              {currentAssignment?.seat_code && (
                                <button
                                  type="button"
                                  onClick={() => handleClearTravelerSeat(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                                  title="ล้างที่นั่ง"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Card 5: คำขอพิเศษ */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      คำขอพิเศษเพิ่มเติม
                    </h2>
                    <p className="text-xs text-slate-500">
                      เช่น อาหารมังสวิรัติ, แพ้อาหาร, รถเข็นวีลแชร์
                    </p>
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
              {/* การ์ดกำหนดการเดินทาง (มีภาพ Illustration พื้นหลัง) */}
              <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white p-4.5 shadow-2xs flex flex-col justify-between">
                {/* ภาพพื้นหลังสไตล์ Illustration พร้อม Gradient Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <Image
                    width={400}
                    height={600}
                    src="/travel-schedule-bg.jpg"
                    alt="Travel Schedule Illustration"
                    className="h-full w-full object-cover "
                  />
                  <div className="absolute inset-0 bg-linear-to-r from-white/95 via-white/55 to-transparent backdrop-blur-[0.5px]" />
                </div>

                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Plane className="h-4 w-4 text-indigo-600" />{" "}
                    วันเดินทางของแพ็กเกจ
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 tracking-tight drop-shadow-2xs">
                    {travelDateRangeText || "กำลังโหลดข้อมูลตารางเดินทาง..."}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                    ทริปนี้เดินทางตามวันที่กำหนดข้างต้น ไม่ต้องเลือกวันเดินทาง
                  </p>
                </div>

                {/* แสดงช่วงเวลาเปิดรับจอง */}
                {(packageData?.booking_start_date ||
                  packageData?.booking_end_date) && (
                  <div className="relative z-10 mt-3 pt-2.5 border-t border-indigo-50/80 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />{" "}
                      ช่วงเวลาเปิดรับจอง:
                    </span>
                    <span className=" text-black text-xs">
                      {bookingPeriodText || "เปิดรับจองตามรอบ"}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
                <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                  สรุปรายละเอียดการจอง
                </h3>

                {/* Package Thumbnail & Name */}
                <div className="flex gap-3.5 mb-5 pb-5 border-b border-slate-100">
                  {packageData.image ? (
                    <Image
                      width={100}
                      height={100}
                      src={packageData.image}
                      alt={packageData.name}
                      className="h-16 w-16 rounded-xl object-cover shrink-0"
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
                    {travelDateRangeText && (
                      <p className="text-[11px] font-bold text-indigo-700 mt-1 flex items-center gap-1.5">
                        <Plane className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span>วันเดินทาง: {travelDateRangeText}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 text-xs text-slate-600 mb-5">
                  <div className="flex justify-between">
                    <span>
                      ค่าแพ็กเกจ ({adultCount} ผู้ใหญ่
                      {childCount > 0 ? ` + ${childCount} เด็ก` : ""})
                    </span>
                    <span className="font-semibold text-slate-900">
                      ฿{baseTotal.toLocaleString()}
                    </span>
                  </div>

                  {activeAddons.length > 0 && (
                    <div className="pt-2 border-t border-dashed border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">
                        บริการเสริมที่เลือก:
                      </span>
                      {activeAddons.map((a) => (
                        <div
                          key={a.id}
                          className="flex justify-between text-slate-600 pl-2"
                        >
                          <span className="truncate max-w-[180px]">
                            {a.addon_name}
                          </span>
                          <span>+฿{a.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between gap-2 border-t border-dashed border-slate-200 pt-2 text-xs">
                    <span>ประกันการเดินทาง ({totalPeople} คน)</span>
                    <span className="font-semibold text-slate-900">{insuranceSelected ? insuranceCanPurchase ? `+฿${insuranceTotal.toLocaleString("th-TH")}` : "ตัวอย่าง · ยังไม่คิดเงิน" : "ไม่ได้เลือก"}</span>
                  </div>

                  {/* ที่นั่งบนรถบัส */}
                  {buses.length > 0 && (
                    <div className="pt-2 border-t border-dashed border-slate-200 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <Bus className="h-3.5 w-3.5 text-indigo-600" />
                          ที่นั่งบนรถบัส:
                        </span>
                        <span className="text-[11px] font-bold text-indigo-600">
                          {
                            Object.values(seatAssignments).filter(
                              (s) => s?.seat_code,
                            ).length
                          }{" "}
                          / {totalPeople} ที่นั่ง
                        </span>
                      </div>
                      <div className="space-y-1 pl-2 text-[11px] text-slate-600">
                        {travelers.map((t, idx) => {
                          const seat = seatAssignments[idx];
                          const bus = buses.find((b) => b.id === seat?.bus_id);
                          return (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate max-w-[140px]">
                                ท่านที่ {idx + 1} (
                                {t.full_name ||
                                  (idx === 0 ? activeContactName : "ไม่ระบุ")}
                                )
                              </span>
                              <span className="font-semibold text-slate-800">
                                {seat?.seat_code
                                  ? `${bus?.name || "บัส"} - ${seat.seat_code.toUpperCase()}`
                                  : "ยังไม่ระบุ"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {insurancePlan && (
                    <p className="text-[11px] text-slate-500">
                      {insurancePlan.insurer_name} · {insurancePlan.plan_name} · {insuranceCanPurchase ? "฿" : "ราคาอ้างอิง ฿"}{(insurancePlan.premium_satang / 100).toLocaleString("th-TH")} ต่อคน · อายุ {insurancePlan.min_age}–{insurancePlan.max_age} ปี{insurancePlan.min_trip_days && insurancePlan.max_trip_days ? ` · ทริป ${insurancePlan.min_trip_days}–${insurancePlan.max_trip_days} วัน` : ""}
                      {insuranceCanPurchase && <> · <a href={insurancePlan.terms_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">เงื่อนไขกรมธรรม์</a></>}
                    </p>
                  )}
                  {!insurancePlan && <p className="text-[11px] text-slate-500">ยังไม่ได้เลือกแผนประกันสำหรับแพ็กเกจนี้</p>}

                  <div className="flex justify-between pt-3 border-t border-slate-100 text-sm font-medium">
                    <span className="text-slate-700">ยอดรวมทั้งสิ้น:</span>
                    <span className="text-xl font-extrabold text-indigo-600">
                      ฿{grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Loyalty Reward Points Preview */}
                <div className="mb-5 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div>
                      <span className="font-bold text-slate-800">
                        รับแต้มสะสมสมาชิก
                      </span>
                      <p className="text-[10px] text-slate-400">
                        คำนวณ 100 บาท = 1 แต้ม
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-amber-600 text-sm">
                      +{Math.floor(grandTotal / 100)} แต้ม
                    </span>
                  </div>
                </div>

                {/* Submit CTA Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !insuranceReady || (insuranceSelected && (!insuranceCanPurchase || !insuranceTermsAcknowledged))}
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

      {/* Add Participant Modal (Choice between Manual & Collab Multi-select) */}
      <AddParticipantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddManual={handleAddManual}
        onAddCollabs={handleAddCollabs}
        existingTravelers={travelers}
        currentUser={currentUser}
      />

      {/* Traveler Info Modal Form */}
      <TravelerModal
        isOpen={editingTravelerIndex !== null}
        onClose={() => setEditingTravelerIndex(null)}
        travelerIndex={editingTravelerIndex}
        travelers={travelers}
        currentUser={currentUser}
        contactName={contactName}
        onSaveTraveler={(idx, updatedData) => {
          setTravelers((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], ...updatedData };
            return next;
          });
        }}
        onDeleteTraveler={handleDeleteTraveler}
        onSelectTravelerIndex={(idx) => setEditingTravelerIndex(idx)}
      />

      {/* Modal: ผังที่นั่งเลือกรถบัส */}
      {seatMapModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Bus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    ผังที่นั่ง -{" "}
                    {buses.find((b) => b.id === seatMapModal.busId)?.name ||
                      "รถบัส"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    เลือกที่นั่งสำหรับ ผู้เดินทางท่านที่{" "}
                    {seatMapModal.travelerIndex + 1}
                    {travelers[seatMapModal.travelerIndex]?.full_name
                      ? ` (${travelers[seatMapModal.travelerIndex].full_name})`
                      : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSeatMapModal({
                    isOpen: false,
                    travelerIndex: null,
                    busId: null,
                  })
                }
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Bus selector if multiple buses */}
            {buses.length > 1 && (
              <div className="px-5 pt-4 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">
                  เลือกรถบัส:
                </span>
                <div className="flex gap-2">
                  {buses.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() =>
                        setSeatMapModal((prev) => ({ ...prev, busId: b.id }))
                      }
                      className={`px-3 py-1 text-xs rounded-lg font-semibold border transition cursor-pointer ${
                        seatMapModal.busId === b.id
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {b.name} ({b.plate || "ไม่ระบุทะเบียน"})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SeatMap Legend */}
            <div className="px-5 pt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded border border-slate-300 bg-white" />
                <span>ที่นั่งว่าง (คลิกเลือกได้)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded border border-cyan-600 bg-cyan-500 text-white" />
                <span>ที่นั่งที่เลือก</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded border border-slate-300 bg-slate-300" />
                <span>มีผู้จองแล้ว</span>
              </div>
            </div>

            {/* SeatMap Canvas Body */}
            <div className="p-5 overflow-y-auto flex-1 flex justify-center">
              {(() => {
                const activeBus =
                  buses.find((b) => b.id === seatMapModal.busId) || buses[0];
                if (!activeBus)
                  return (
                    <p className="text-sm text-slate-400">ไม่พบผังที่นั่ง</p>
                  );

                // Taken seats for this bus from backend
                const dbTaken = takenSeats
                  .filter((t) => t.bus_id === activeBus.id)
                  .map((t) => t.seat_code.toLowerCase());

                // Seats taken by OTHER travelers in this booking on this bus
                const otherTravelersTaken = Object.entries(seatAssignments)
                  .filter(
                    ([idx, item]) =>
                      parseInt(idx, 10) !== seatMapModal.travelerIndex &&
                      item?.bus_id === activeBus.id &&
                      item?.seat_code,
                  )
                  .map(([_, item]) => item.seat_code.toLowerCase());

                const combinedTaken = [
                  ...new Set([...dbTaken, ...otherTravelersTaken]),
                ];
                const currentSeat =
                  seatAssignments[seatMapModal.travelerIndex]?.bus_id ===
                  activeBus.id
                    ? seatAssignments[
                        seatMapModal.travelerIndex
                      ]?.seat_code?.toLowerCase()
                    : null;

                return (
                  <SeatMap
                    layout={activeBus.layout}
                    taken={combinedTaken}
                    selected={currentSeat ? [currentSeat] : []}
                    onToggle={(code) => {
                      handleTravelerSeatChange(
                        seatMapModal.travelerIndex,
                        activeBus.id,
                        code,
                      );
                    }}
                  />
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setSeatMapModal({
                    isOpen: false,
                    travelerIndex: null,
                    busId: null,
                  })
                }
                className="rounded-xl px-4 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
              >
                บันทึกและปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
