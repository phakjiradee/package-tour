"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
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

export default function UserProfilePage() {
  const router = useRouter();
  const currentUser = useSyncExternalStore(
    subscribeAuth,
    getAuth,
    getAuthServerSnapshot,
  );

  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'points' | 'bookings' | 'security'
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
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

  // ตรวจสอบแท็บเริ่มต้นจาก URL Query Params (เช่น ?tab=points)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["profile", "points", "bookings", "security"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("pt_token") : null;
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
          setFormData({
            name: user.name || "",
            email: user.email || "",
            phone: formatPhoneNumber(user.phone || ""),
            lineId: user.lineId || "",
            age: user.age ? String(user.age) : "",
          });
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

    try {
      setIsSavingProfile(true);
      const res = await authService.updateProfile({
        name: formData.name.trim(),
        phone: cleanPhone || null,
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
          // อัปเดตข้อมูลใน auth store เพื่อให้ navbar ซิงค์ชื่อทันที
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
        message: err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
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
          message: res?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ ตรวจสอบรหัสผ่านเดิม",
        });
      }
    } catch (err) {
      console.error(err);
      setPasswordAlert({
        type: "error",
        message:
          err.response?.data?.message || "รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาลองใหม่",
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
    userDetails?.name || currentUser?.name || currentUser?.email?.split("@")[0] || "ผู้ใช้งาน";
  const displayEmail = userDetails?.email || currentUser?.email || "-";
  const userRole =
    userDetails?.role?.name ||
    currentUser?.role?.name ||
    currentUser?.role ||
    "USER";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-6">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Profile Hero Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
          {/* Subtle glowing orb decorations */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-2xl sm:text-3xl font-black text-white shadow-lg shadow-blue-500/30 ring-4 ring-white/10 uppercase tracking-wider">
                  {initials}
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-slate-900">
                  <BadgeCheck className="h-4 w-4" />
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-bold text-blue-300 ring-1 ring-inset ring-blue-400/30 uppercase tracking-wider">
                    {userRole}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{displayEmail}</span>
                </p>
                {userDetails?.createdAt && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                    <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>เป็นสมาชิกเมื่อ {formatThaiDate(userDetails.createdAt)}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions & Points */}
            <div className="flex flex-col sm:items-end gap-3 self-stretch sm:self-auto">
              {/* Loyalty Points Pill Button */}
              <button
                type="button"
                id="hero-points-btn"
                onClick={() => setActiveTab("points")}
                className="group flex items-center justify-between sm:justify-start gap-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-600/20 px-4 py-2.5 backdrop-blur-md border border-amber-400/40 shadow-lg shadow-amber-500/10 transition-all hover:border-amber-300 hover:bg-amber-500/30 active:scale-95 text-left cursor-pointer"
                title="คลิกเพื่อดูรายละเอียดและประวัติแต้มสะสม"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black shadow-md shadow-amber-400/30 group-hover:scale-105 transition-transform">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      แต้มสะสมสมาชิก
                    </span>
                    <Sparkles className="h-3 w-3 text-amber-300" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-amber-200">
                      {userPoints.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-amber-300/80">แต้ม</span>
                  </div>
                </div>
              </button>

              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <Link
                  href="/my-bookings"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white shadow-xs backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                >
                  <Ticket className="h-3.5 w-3.5 text-indigo-400" />
                  <span>การจองของฉัน ({totalBookings})</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-300 ring-1 ring-inset ring-rose-500/30 transition-all hover:bg-rose-500/30 active:scale-95 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-400" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">การจองทั้งหมด</span>
              <Ticket className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{totalBookings}</span>
              <span className="text-xs text-slate-400">รายการ</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">ยืนยันแล้ว</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600">{confirmedBookings}</span>
              <span className="text-xs text-slate-400">ทริป</span>
            </div>
          </div>

          {/* Points Card */}
          <button
            type="button"
            id="stats-points-card"
            onClick={() => setActiveTab("points")}
            className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-amber-50/40 to-yellow-50/70 p-4 shadow-xs text-left cursor-pointer transition hover:border-amber-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-xs font-bold">แต้มสะสมสมาชิก</span>
              <Coins className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-900">{userPoints.toLocaleString()}</span>
              <span className="text-xs font-bold text-amber-700">แต้ม</span>
            </div>
            <span className="text-[10px] font-medium text-amber-600 block mt-0.5">
              คำนวณ 100 บาท = 1 แต้ม
            </span>
          </button>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">รอชำระเงิน</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-600">{pendingBookings}</span>
              <span className="text-xs text-slate-400">รายการ</span>
            </div>
          </div>
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
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                {userPoints.toLocaleString()} แต้ม
              </span>
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

          <button
            type="button"
            id="tab-security-btn"
            onClick={() => setActiveTab("security")}
            className={`pb-3 text-sm font-bold transition-colors cursor-pointer relative shrink-0 ${
              activeTab === "security"
                ? "text-indigo-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              <span>ความปลอดภัย & รหัสผ่าน</span>
            </div>
            {activeTab === "security" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Personal Profile Form */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
              <div className="mb-5 border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">แก้ไขข้อมูลส่วนตัว</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ข้อมูลนี้จะถูกนำไปใช้กรอกชื่อและเบอร์ติดต่อโดยอัตโนมัติเมื่อทำการจองแพ็กเกจ
                </p>
              </div>

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
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="เช่น ธนากร สุขสวัสดิ์"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      เบอร์โทรศัพท์มือถือ
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
                          setFormData((prev) => ({ ...prev, lineId: e.target.value }))
                        }
                        placeholder="ไอดีไลน์ของคุณ"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                  </div>
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
                    className="w-full sm:w-1/2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
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
              </form>
            </div>

            {/* Side Card: Shortcuts & Security Status */}
            <div className="space-y-4">
              <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-blue-50/50 p-6 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md mb-3">
                  <Ticket className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">ดูประวัติการจอง</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ตรวจสอบสถานะทริป ชำระเงิน หรือจัดการผู้ร่วมทริปในหน้าการจองของคุณ
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
                  ข้อมูลส่วนบุคคลของคุณได้รับการเข้ารหัสอย่างปลอดภัย และจะถูกใช้สำหรับการยืนยันเอกสารและประกันภัยระหว่างการท่องเที่ยวเท่านั้น
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Points & Loyalty System */}
        {activeTab === "points" && (
          <div className="space-y-6">
            {/* VIP Loyalty Banner Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950/80 to-slate-900 p-6 sm:p-8 text-white border border-amber-500/30 shadow-xl shadow-amber-950/20">
              {/* Glow effects */}
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-yellow-500/15 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-4 ring-white/10">
                    <Coins className="h-8 w-8 text-amber-950" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 ring-1 ring-inset ring-amber-400/30 uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" />
                        Zentura Member Rewards
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      แต้มสะสมสมาชิกของคุณ
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300">
                      ยิ่งจองมาก ยิ่งได้รับแต้มสะสมมาก สะสมได้ไม่มีวันหมดอายุ
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-4 sm:p-5 text-left md:text-right min-w-[200px]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block">
                    แต้มสะสมพร้อมใช้งาน
                  </span>
                  <div className="flex items-baseline md:justify-end gap-1.5 mt-1">
                    <span className="text-3xl sm:text-4xl font-black text-amber-200">
                      {userPoints.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-amber-300/80">แต้ม</span>
                  </div>
                  <span className="text-[11px] text-slate-300 block mt-1">
                    คำนวณจากยอดชำระ 100 บาท = 1 แต้ม
                  </span>
                </div>
              </div>

              {/* Value Proposition Grid */}
              <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2.5 mb-1.5 text-amber-300 font-bold text-xs sm:text-sm">
                    <Coins className="h-4 w-4 shrink-0" />
                    <span>อัตราการรับแต้ม</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ทุกยอดจอง 100 บาท รับทันที 1 แต้มสะสม คำนวณจากยอดชำระสุทธิหลังเสร็จสิ้นการจอง
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2.5 mb-1.5 text-amber-300 font-bold text-xs sm:text-sm">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>รับแต้มอัตโนมัติ</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ระบบจะโอนแต้มเข้าบัญชีของคุณทันทีเมื่อการจองได้รับการยืนยันหรือชำระเงินสำเร็จ
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2.5 mb-1.5 text-amber-300 font-bold text-xs sm:text-sm">
                    <Award className="h-4 w-4 shrink-0" />
                    <span>ไม่มีวันหมดอายุ</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    แต้มสะสมไม่มีกำหนดหมดอายุ สามารถสะสมต่อเนื่องได้ตลอดการเป็นสมาชิก
                  </p>
                </div>
              </div>
            </div>

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
                    รายการแต้มที่ได้รับและรายการเคลื่อนไหวทั้งหมดในบัญชีของคุณ ({pointTransactions.length} รายการ)
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
                    เมื่อคุณจองแพ็กเกจท่องเที่ยวและชำระเงินสำเร็จ แต้มสะสมจะแสดงและบันทึกประวัติที่นี่โดยอัตโนมัติ
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
                              {tx.description || (isEarn ? "ได้รับแต้มจากการจองแพ็กเกจ" : "หักแต้มสะสม")}
                            </p>

                            {tx.booking?.package?.name && (
                              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <Plane className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="line-clamp-1">{tx.booking.package.name}</span>
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
                            {isEarn ? `+${tx.points.toLocaleString()}` : tx.points.toLocaleString()} แต้ม
                          </span>
                          {tx.booking?.total_price && (
                            <span className="text-[11px] text-slate-400">
                              ยอดจอง ฿{Math.round(tx.booking.total_price).toLocaleString()}
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

        {/* Tab 3: Security & Password Form */}
        {activeTab === "security" && (
          <div className="max-w-xl mx-auto rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
            <div className="mb-5 border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">เปลี่ยนรหัสผ่าน</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                เพื่อความปลอดภัยของบัญชี กรุณาตั้งรหัสผ่านที่มีความยาวอย่างน้อย 6 ตัวอักษร
              </p>
            </div>

            {passwordAlert.message && (
              <div
                className={`mb-5 flex items-start gap-2.5 rounded-2xl p-4 text-xs font-medium ${
                  passwordAlert.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {passwordAlert.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{passwordAlert.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รหัสผ่านปัจจุบัน <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword.current ? "text" : "password"}
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="กรอกรหัสผ่านปัจจุบันของคุณ"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({ ...prev, current: !prev.current }))
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รหัสผ่านใหม่ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword.new ? "text" : "password"}
                    required
                    minLength={6}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({ ...prev, new: !prev.new }))
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ยืนยันรหัสผ่านใหม่ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>กำลังอัปเดตรหัสผ่าน...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>อัปเดตรหัสผ่านใหม่</span>
                    </>
                  )}
                </button>
              </div>
            </form>
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
                <h3 className="text-sm font-bold text-slate-900">ยังไม่มีประวัติการจอง</h3>
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
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs">
                        <Ticket className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {b.booking_code}
                          </span>
                          {b.user_id !== (userDetails?.id || currentUser?.id) && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800">
                              ผู้ร่วมทริป (Collab)
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              b.status === "CONFIRMED" || b.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.status === "PENDING_PAYMENT"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {b.status === "CONFIRMED" || b.status === "PAID"
                              ? "ยืนยันแล้ว"
                              : b.status === "PENDING_PAYMENT"
                              ? "รอชำระเงิน"
                              : b.status}
                          </span>
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
                            ผู้จอง: {b.contact_name || b.user?.name || "ผู้จองหลัก"}
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
                        className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        ดูรายละเอียด
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
