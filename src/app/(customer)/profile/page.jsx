"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Ticket,
  LogOut,
  ArrowRight,
  Eye,
  EyeOff,
  Compass,
  Clock,
  Sparkles,
  Plane,
  BadgeCheck,
  Coins,
  Award,
  Gift,
  History,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Users,
  XCircle,
  CreditCard,
} from "lucide-react";
import {
  getAuth,
  setAuth,
  clearAuth,
  subscribeAuth,
  getAuthServerSnapshot,
} from "@/lib/auth-client";
import authService from "@/service/auth";
import bookingService from "@/service/booking";
import { formatThaiDate, formatThaiDateTime } from "@/lib/date";

// ฟังก์ชันจัดรูปแบบเบอร์โทรศัพท์ (0xx-xxx-xxxx)
const formatPhoneNumber = (value) => {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "").slice(0, 10);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

// ฟังก์ชันจัดรูปแบบเลขบัตร ปชช. (x-xxxx-xxxxx-xx-x) หรือ Passport
const formatIdCardOrPassport = (value) => {
  if (!value) return "";
  if (/[a-zA-Z]/.test(value)) {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  }
  const cleaned = value.replace(/\D/g, "").slice(0, 13);
  if (cleaned.length <= 1) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 1)}-${cleaned.slice(1)}`;
  if (cleaned.length <= 10) return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5)}`;
  if (cleaned.length <= 12) return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10)}`;
  return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned.slice(12)}`;
};

export default function UserProfilePage() {
  const router = useRouter();
  const currentUser = useSyncExternalStore(
    subscribeAuth,
    getAuth,
    getAuthServerSnapshot,
  );

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["profile", "points", "bookings"].includes(tabParam)) {
        return tabParam;
      }
    }
    return "profile";
  });
  const [redirectUrl, setRedirectUrl] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("redirect") || "";
    }
    return "";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile Form State
  const [formData, setFormData] = useState({
    title: "นาย",
    name: "",
    email: "",
    phone: "",
    id_card_or_passport: "",
    date_of_birth: "",
    lineId: "",
    age: "",
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Feedback Alerts
  const [profileAlert, setProfileAlert] = useState({ type: "", message: "" });
  const [passwordAlert, setPasswordAlert] = useState({ type: "", message: "" });

  // Stats & Bookings
  const [myBookings, setMyBookings] = useState([]);
  const [userDetails, setUserDetails] = useState(null);

  // Points & Loyalty System State
  const [userPoints, setUserPoints] = useState(0);
  const [pointTransactions, setPointTransactions] = useState([]);

  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("pt_token")
        : null;
    if (!token && !currentUser) {
      router.replace(`/auth/sign-in?redirect=/profile`);
      return;
    }

    async function loadData() {
      try {
        setIsLoading(true);
        // ดึงข้อมูลโปรไฟล์ล่าสุด
        const meRes = await authService.getMe();
        const user = meRes?.user || meRes?.data || meRes;
        if (user) {
          setUserDetails(user);
          setUserPoints(Number(user.points) || 0);
          const dob = user.date_of_birth
            ? new Date(user.date_of_birth).toISOString().slice(0, 10)
            : "";
          setFormData({
            title: user.title || "นาย",
            name: user.name || "",
            email: user.email || "",
            phone: formatPhoneNumber(user.phone || ""),
            id_card_or_passport: formatIdCardOrPassport(user.id_card_or_passport || ""),
            date_of_birth: dob,
            lineId: user.lineId || "",
            age: user.age ? String(user.age) : "",
          });
          setAuth(user);
        }

        // ดึงประวัติการจองของผู้ใช้เพื่อทำสถิติ
        const bookRes = await bookingService.getMyBookings();
        if (bookRes?.success && Array.isArray(bookRes?.data)) {
          setMyBookings(bookRes.data);
        }

        // ดึงข้อมูลแต้มสะสมและประวัติธุรกรรมแต้ม
        try {
          const pointsRes = await authService.getMyPoints();
          if (pointsRes?.success && pointsRes?.data) {
            if (typeof pointsRes.data.points === "number") {
              setUserPoints(pointsRes.data.points);
            }
            if (Array.isArray(pointsRes.data.transactions)) {
              setPointTransactions(pointsRes.data.transactions);
            }
          }
        } catch (ptsErr) {
          console.warn("Load points error:", ptsErr);
        }
      } catch (err) {
        console.error("Load profile error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [currentUser, router]);

  const handlePhoneChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      phone: formatPhoneNumber(e.target.value),
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileAlert({ type: "", message: "" });

    if (!formData.name.trim()) {
      setProfileAlert({ type: "error", message: "กรุณาระบุชื่อ-นามสกุล" });
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone && cleanPhone.length !== 10) {
      setProfileAlert({
        type: "error",
        message: "เบอร์โทรศัพท์ต้องมี 10 หลัก (เช่น 095-809-2434)",
      });
      return;
    }

    const cleanId = formData.id_card_or_passport.toUpperCase().replace(/[\s-]/g, "");
    if (cleanId && !/^(\d{13}|[A-Z0-9]{6,12})$/.test(cleanId)) {
      setProfileAlert({
        type: "error",
        message: "เลขบัตรประชาชนต้องมี 13 หลัก หรือเลข Passport 6-12 ตัวอักษร",
      });
      return;
    }

    try {
      setIsSavingProfile(true);
      const res = await authService.updateProfile({
        title: formData.title || "นาย",
        name: formData.name.trim(),
        phone: cleanPhone || null,
        id_card_or_passport: cleanId || null,
        date_of_birth: formData.date_of_birth || null,
        lineId: formData.lineId.trim() || null,
        age: formData.age ? parseInt(formData.age) : null,
      });

      if (res?.success) {
        setProfileAlert({
          type: "success",
          message: "บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว",
        });
        if (res.user) {
          setUserDetails(res.user);
          // อัปเดตข้อมูลใน auth store เพื่อให้ส่วนอื่นๆ ซิงค์ทันที
          setAuth(res.user);
        }
      } else {
        setProfileAlert({
          type: "error",
          message: res?.message || "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        });
      }
    } catch (err) {
      console.error(err);
      setProfileAlert({
        type: "error",
        message:
          err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordAlert({ type: "", message: "" });

    if (!passwordData.currentPassword) {
      setPasswordAlert({ type: "error", message: "กรุณากรอกรหัสผ่านปัจจุบัน" });
      return;
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      setPasswordAlert({
        type: "error",
        message: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
      });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordAlert({
        type: "error",
        message: "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน",
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (res?.success) {
        setPasswordAlert({
          type: "success",
          message: "เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setPasswordAlert({
          type: "error",
          message:
            res?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ ตรวจสอบรหัสผ่านเดิม",
        });
      }
    } catch (err) {
      console.error(err);
      setPasswordAlert({
        type: "error",
        message:
          err.response?.data?.message ||
          "รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาลองใหม่",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      clearAuth();
      router.push("/feed");
      router.refresh();
    }
  };

  // คำนวณสถิติ
  const totalBookings = myBookings.length;
  const confirmedBookings = myBookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "PAID",
  ).length;
  const pendingBookings = myBookings.filter(
    (b) => b.status === "PENDING_PAYMENT",
  ).length;

  const displayName =
    userDetails?.name ||
    currentUser?.name ||
    currentUser?.email?.split("@")[0] ||
    "ผู้ใช้งาน";
  const displayEmail = userDetails?.email || currentUser?.email || "-";
  const userRole =
    userDetails?.role?.name ||
    currentUser?.role?.name ||
    currentUser?.role ||
    "USER";
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const avatarSrc =
    !hasAvatarError && (userDetails?.avatar || currentUser?.avatar)
      ? userDetails?.avatar || currentUser?.avatar
      : "/no-image-user-v1.jpg";

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-6">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Profile Hero Header: 2 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Card 1: User Profile Card */}
          <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-7 text-slate-800 shadow-sm border border-slate-200/80 flex items-center gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="relative h-20 w-20 sm:h-22 sm:w-22 overflow-hidden rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
                <Image
                  src={avatarSrc}
                  alt={displayName}
                  fill
                  sizes="(max-width: 640px) 80px, 88px"
                  className="object-cover"
                  onError={() => setHasAvatarError(true)}
                />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 flex h-6.5 w-6.5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white">
                <BadgeCheck className="h-4 w-4" />
              </div>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 truncate">
                  {displayName}
                </h1>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-inset ring-indigo-100 uppercase tracking-wider">
                  {userRole}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{displayEmail}</span>
              </p>
              {userDetails?.createdAt && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5 truncate">
                  <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                  <span>
                    เป็นสมาชิกเมื่อ {formatThaiDate(userDetails.createdAt)}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Card 2: Points Card */}
          <button
            type="button"
            id="hero-points-btn"
            onClick={() => setActiveTab("points")}
            className="group relative overflow-hidden rounded-3xl bg-white p-6 sm:p-7 text-slate-800 shadow-sm border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all active:scale-[0.99] text-left cursor-pointer flex items-center justify-between gap-4"
            title="คลิกเพื่อดูรายละเอียดและประวัติแต้มสะสม"
          >
            {/* Background Illustration with soft overlay */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <Image
                src="/points-card-bg.jpg"
                alt="Points Background"
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover object-bottom-right group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-r from-white/95 via-white/80 to-white/30 backdrop-blur-[0.5px]" />
            </div>

            <div className="relative z-10 flex items-center gap-4">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Coins className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tracking-tight text-slate-600">
                    แต้มสะสมสมาชิก
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {userPoints.toLocaleString()}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-600">
                    แต้ม
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-slate-500 shadow-xs backdrop-blur-xs border border-white/80 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-400 transition-all shrink-0">
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
          <button
            type="button"
            id="tab-profile-btn"
            onClick={() => setActiveTab("profile")}
            className={`pb-3 text-sm font-bold transition-colors cursor-pointer relative shrink-0 ${
              activeTab === "profile"
                ? "text-indigo-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>ข้อมูลส่วนตัว</span>
            </div>
            {activeTab === "profile" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>

          <button
            type="button"
            id="tab-points-btn"
            onClick={() => setActiveTab("points")}
            className={`pb-3 text-sm font-bold transition-colors cursor-pointer relative shrink-0 ${
              activeTab === "points"
                ? "text-amber-700"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" />
              <span>แต้มสะสมสมาชิก</span>
            </div>
            {activeTab === "points" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            id="tab-bookings-btn"
            onClick={() => setActiveTab("bookings")}
            className={`pb-3 text-sm font-bold transition-colors cursor-pointer relative shrink-0 ${
              activeTab === "bookings"
                ? "text-indigo-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              <span>ภาพรวมการจอง</span>
            </div>
            {activeTab === "bookings" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Personal Profile Form */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
              <div className="mb-5 border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">
                  แก้ไขข้อมูลส่วนตัวและผู้จองหลัก
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ข้อมูลนี้จำเป็นสำหรับการจองแพ็กเกจ ออกตั๋วโดยสาร และกรมธรรม์ประกันภัยการเดินทาง
                </p>
              </div>

              {redirectUrl && (
                <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-xs font-semibold text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>กรุณากรอกข้อมูลส่วนตัว (เลขบัตร ปชช./Passport และวันเกิด) ให้เรียบร้อยเพื่อดำเนินการจองต่อ</span>
                  </div>
                </div>
              )}

              {profileAlert.message && (
                <div
                  className={`mb-5 flex items-start gap-2.5 rounded-2xl p-4 text-xs font-medium ${
                    profileAlert.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {profileAlert.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{profileAlert.message}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {/* คำนำหน้าชื่อ + ชื่อ-นามสกุล */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      คำนำหน้าชื่อ <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer shadow-2xs"
                    >
                      <option value="นาย">นาย</option>
                      <option value="นาง">นาง</option>
                      <option value="นางสาว">นางสาว</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      ชื่อ-นามสกุล (ตามบัตร ปชช. หรือ Passport) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="เช่น ธนากร สุขสวัสดิ์"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* เลขประจำตัวประชาชน / Passport */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      เลขประจำตัวประชาชน / Passport <span className="text-rose-500">*</span>
                    </label>
                    {formData.id_card_or_passport && (
                      <span
                        className={`text-[10px] font-medium ${
                          formData.id_card_or_passport.replace(/\D/g, "").length === 13
                            ? "text-emerald-600 font-bold"
                            : "text-slate-400"
                        }`}
                      >
                        {formData.id_card_or_passport.replace(/\D/g, "").length > 0 &&
                        !/[a-zA-Z]/.test(formData.id_card_or_passport)
                          ? `${formData.id_card_or_passport.replace(/\D/g, "").length}/13 หลัก`
                          : "Passport"}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={17}
                      placeholder="เลขบัตร 13 หลัก เช่น 1-2345-67890-12-3 หรือ Passport"
                      value={formData.id_card_or_passport}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          id_card_or_passport: formatIdCardOrPassport(e.target.value),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    ข้อมูลนี้จำเป็นต้องใช้ในการออกตั๋วโดยสารและลงทะเบียนประกันอุบัติเหตุการเดินทาง
                  </p>
                </div>

                {/* วันเกิดตามเอกสาร + อายุ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      วันเกิดตามเอกสาร <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.date_of_birth}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            date_of_birth: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      ใช้ตรวจช่วงอายุที่กรมธรรม์รับประกัน
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      อายุ (ปี)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, age: e.target.value }))
                      }
                      placeholder="เช่น 28"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                {/* อีเมล */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      อีเมล (Email)
                    </label>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      ยืนยันตัวตนแล้ว
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-500 shadow-2xs cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    อีเมลใช้สำหรับการเข้าสู่ระบบและรับเอกสารยืนยันการจอง
                  </p>
                </div>

                {/* เบอร์โทรศัพท์ + Line ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      เบอร์โทรศัพท์มือถือ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="095-xxx-xxxx"
                        maxLength={12}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Line ID (ไลน์ไอดี)
                    </label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={formData.lineId}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            lineId: e.target.value,
                          }))
                        }
                        placeholder="ไอดีไลน์ของคุณ"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  {redirectUrl && (
                    <button
                      type="button"
                      onClick={() => router.push(redirectUrl)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <ArrowRight className="h-4 w-4 rotate-180" />
                      <span>กลับไปหน้าจอง</span>
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    {redirectUrl && profileAlert.type === "success" && (
                      <button
                        type="button"
                        onClick={() => router.push(redirectUrl)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all cursor-pointer"
                      >
                        <span>ไปจองแพ็กเกจต่อ</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>กำลังบันทึก...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>บันทึกข้อมูลส่วนตัว</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Side Card: Shortcuts & Security Status */}
            <div className="space-y-4">
              <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-blue-50/50 p-6 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md mb-3">
                  <Ticket className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  ดูประวัติการจอง
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ตรวจสอบสถานะทริป ชำระเงิน
                  หรือจัดการผู้ร่วมทริปในหน้าการจองของคุณ
                </p>
                <Link
                  href="/my-bookings"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  <span>ไปที่การจองของฉัน</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    การปกป้องข้อมูล
                  </h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ข้อมูลส่วนบุคคลของคุณได้รับการเข้ารหัสอย่างปลอดภัย
                  และจะถูกใช้สำหรับการยืนยันเอกสารและประกันภัยระหว่างการท่องเที่ยวเท่านั้น
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Points & Loyalty System */}
        {activeTab === "points" && (
          <div className="space-y-6">
            {/* Point History / Transactions Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-amber-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      ประวัติการทำรายการแต้มสะสม
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    รายการแต้มที่ได้รับและรายการเคลื่อนไหวทั้งหมดในบัญชีของคุณ (
                    {pointTransactions.length} รายการ)
                  </p>
                </div>

                <Link
                  href="/package"
                  className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-amber-700 active:scale-95"
                >
                  <Plane className="h-3.5 w-3.5" />
                  <span>จองทริปเพื่อรับแต้มเพิ่ม</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {pointTransactions.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 ring-8 ring-amber-50/50">
                    <Coins className="h-8 w-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    ยังไม่มีประวัติการทำรายการแต้ม
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    เมื่อคุณจองแพ็กเกจท่องเที่ยวและชำระเงินสำเร็จ
                    แต้มสะสมจะแสดงและบันทึกประวัติที่นี่โดยอัตโนมัติ
                  </p>
                  <Link
                    href="/package"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
                  >
                    <Plane className="h-3.5 w-3.5" />
                    <span>ค้นหาแพ็กเกจท่องเที่ยว</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {pointTransactions.map((tx) => {
                    const isEarn = tx.points > 0;
                    return (
                      <div
                        key={tx.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-slate-200 hover:bg-white"
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold ${
                              isEarn
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {isEarn ? (
                              <ArrowUpRight className="h-5 w-5" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5" />
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isEarn
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {isEarn ? "ได้รับแต้ม" : "หักแต้มคืน"}
                              </span>
                              {tx.booking?.booking_code && (
                                <Link
                                  href={`/booking/success/${tx.booking.booking_code}`}
                                  className="font-mono text-[11px] font-bold text-indigo-600 hover:underline"
                                >
                                  {tx.booking.booking_code}
                                </Link>
                              )}
                              <span className="text-[11px] text-slate-400">
                                {formatThaiDateTime(tx.createdAt)}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm font-semibold text-slate-800">
                              {tx.description ||
                                (isEarn
                                  ? "ได้รับแต้มจากการจองแพ็กเกจ"
                                  : "หักแต้มสะสม")}
                            </p>

                            {tx.booking?.package?.name && (
                              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <Plane className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="line-clamp-1">
                                  {tx.booking.package.name}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                          <span
                            className={`text-base sm:text-lg font-black tracking-tight ${
                              isEarn ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isEarn
                              ? `+${tx.points.toLocaleString()}`
                              : tx.points.toLocaleString()}{" "}
                            แต้ม
                          </span>
                          {tx.booking?.total_price && (
                            <span className="text-[11px] text-slate-400">
                              ยอดจอง ฿
                              {Math.round(
                                tx.booking.total_price,
                              ).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Recent Bookings Overview */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  รายการจองของคุณ ({totalBookings})
                </h2>
                <p className="text-xs text-slate-500">
                  ประวัติการจองและทริปการท่องเที่ยวล่าสุดของคุณ
                </p>
              </div>
              <Link
                href="/my-bookings"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                <span>ดูทั้งหมดแบบละเอียด</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {myBookings.length === 0 ? (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
                  <Compass className="h-7 w-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  ยังไม่มีประวัติการจอง
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  เลือกดูแพ็กเกจท่องเที่ยวคุณภาพและร่วมเดินทางเปิดประสบการณ์ใหม่กับเรา
                </p>
                <Link
                  href="/package"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  <Plane className="h-3.5 w-3.5" />
                  <span>ค้นหาแพ็กเกจท่องเที่ยว</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myBookings.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition hover:border-slate-300"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4">
                      {b.package?.image ? (
                        <Image
                          width={200}
                          height={200}
                          src={b.package.image}
                          alt={b.package?.name || "Package cover"}
                          className="aspect-4/3 h-24 w-36 shrink-0 rounded-xl object-cover border border-slate-200/80 shadow-xs"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display =
                                "flex";
                            }
                          }}
                        />
                      ) : null}
                      <div
                        style={{ display: b.package?.image ? "none" : "flex" }}
                        className="h-24 w-36 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs border border-indigo-100/60"
                      >
                        <Ticket className="h-6 w-6 text-indigo-500" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {b.user_id !==
                            (userDetails?.id || currentUser?.id) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-medium text-purple-500">
                              <Users className="h-3 w-3" />
                              <span>ผู้ร่วมทริป (Collab)</span>
                            </span>
                          )}
                          {(() => {
                            if (b.status === "CONFIRMED" || b.status === "PAID") {
                              return (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>ยืนยันแล้ว</span>
                                </span>
                              );
                            }
                            if (b.status === "PENDING_PAYMENT") {
                              return (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-medium text-amber-500">
                                  <Clock className="h-3 w-3" />
                                  <span>รอชำระเงิน</span>
                                </span>
                              );
                            }
                            if (b.status === "AWAITING_VERIFICATION") {
                              return (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-medium text-blue-500">
                                  <Clock className="h-3 w-3" />
                                  <span>รอตรวจสอบ</span>
                                </span>
                              );
                            }
                            if (b.status === "CANCELLED") {
                              return (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-medium text-rose-500">
                                  <XCircle className="h-3 w-3" />
                                  <span>ยกเลิกแล้ว</span>
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                                <AlertCircle className="h-3 w-3" />
                                <span>{b.status}</span>
                              </span>
                            );
                          })()}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                          {b.package?.name || "แพ็กเกจท่องเที่ยว"}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>
                            วันเดินทาง:{" "}
                            {b.travel_date
                              ? formatThaiDate(b.travel_date)
                              : "-"}
                          </span>
                        </p>
                        {b.user_id !== (userDetails?.id || currentUser?.id) && (
                          <p className="text-[11px] text-purple-700 font-medium mt-0.5">
                            ผู้จอง:{" "}
                            {b.contact_name || b.user?.name || "ผู้จองหลัก"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          ยอดชำระสุทธิ
                        </span>
                        <span className="text-base font-extrabold text-indigo-600">
                          ฿{(b.total_price || 0).toLocaleString()}
                        </span>
                      </div>
                      <Link
                        href={`/booking/success/${b.booking_code}`}
                        className="rounded-xl md:hidden block border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <ArrowUpRight />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
