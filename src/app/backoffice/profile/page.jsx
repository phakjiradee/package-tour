"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  KeyRound,
  Layers,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
} from "lucide-react";
import { authService } from "@/service/auth";
import { guideService } from "@/service/guide";
import { getBackofficeAuth, setBackofficeAuth, getBackofficeToken } from "@/lib/backoffice-auth";
import { formatThaiDate } from "@/lib/date";
import PageHeader from "@/components/backoffice/PageHeader";
import StatCard from "@/components/backoffice/StatCard";
import { PositionBadge } from "@/components/ui/Badges";

export default function BackofficeProfilePage() {
  // Real authenticated user data from /api/auth/me
  const [profileUser, setProfileUser] = useState(() =>
    typeof window !== "undefined" ? getBackofficeAuth() : null
  );

  // If user is a guide, load their tour statistics
  const [guideStats, setGuideStats] = useState({
    ongoingCount: 0,
    pastCount: 0,
    totalCount: 0,
    packages: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // ดึงข้อมูลจริงจาก authService.getMe()
  const fetchMeData = useCallback(async () => {
    setRefreshing(true);
    setErrorMessage(null);

    try {
      const res = await authService.getMe();
      if (res && res.user) {
        setProfileUser(res.user);

        // อัปเดตข้อมูล user ใน localStorage ให้เป็นปัจจุบัน
        const token = getBackofficeToken();
        if (token) {
          setBackofficeAuth(res.user, token);
        }

        // ตรวจสอบว่ามีบทบาทเป็นไกด์หรือไม่ ถ้าเป็นไกด์ ให้ดึงข้อมูลทริปที่ดูแลประกอบด้วย
        const roleName = (
          res.user.role?.name ||
          res.user.position ||
          ""
        ).toLowerCase();

        const isGuideRole =
          roleName.includes("guide") || roleName.includes("ไกด์");

        if (isGuideRole) {
          try {
            const guideRes = await guideService.getPackages({
              guide_id: res.user.id,
            });
            if (guideRes && guideRes.success) {
              setGuideStats({
                ongoingCount: guideRes.counts?.ongoing || 0,
                pastCount: guideRes.counts?.past || 0,
                totalCount: guideRes.counts?.total || 0,
                packages: guideRes.packages?.all || [],
              });
            }
          } catch (e) {
            console.warn("Could not fetch guide tour stats:", e);
          }
        }
      } else {
        // Fallback to local session if available
        const localAuth = getBackofficeAuth();
        if (localAuth) {
          setProfileUser(localAuth);
        }
      }
    } catch (err) {
      console.error("Failed to fetch real profile from getMe:", err);
      // Fallback to local storage if API network fails
      const localAuth = getBackofficeAuth();
      if (localAuth) {
        setProfileUser(localAuth);
      } else {
        setErrorMessage("ไม่สามารถดึงข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        fetchMeData();
      }
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchMeData]);

  const roleName = (
    (typeof profileUser?.role === "object" ? profileUser?.role?.name : profileUser?.role) ||
    profileUser?.position ||
    profileUser?.Role?.name ||
    "Staff"
  ).trim();

  const isGuide =
    roleName.toLowerCase().includes("guide") || roleName.includes("ไกด์");
  const isAdmin =
    roleName.toLowerCase().includes("admin") || roleName.includes("แอดมิน");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="โปรไฟล์ผู้ใช้งาน (User Profile)"
        subtitle="ตรวจสอบข้อมูลส่วนตัว บัญชีปฏิบัติงาน และสิทธิ์การเข้าถึงระบบแบ็คออฟฟิศ"
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Lock className="h-3 w-3 text-slate-500" />
            โหมดดูข้อมูลเท่านั้น (Read-Only)
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchMeData()}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-slate-500 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              <span>รีเฟรชข้อมูล</span>
            </button>
          </div>
        }
      />

      {/* Read-Only & Policy Notice Banner */}
      <div className="flex items-start gap-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 shadow-2xs">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-amber-900">
            ข้อมูลส่วนตัวและการปฏิบัติงานนี้เป็นข้อมูลที่ได้รับการรับรองความถูกต้อง (Verified System Record)
          </p>
          <p className="text-amber-700 leading-relaxed">
            ระบบกำหนดให้ข้อมูลโปรไฟล์ของผู้ปฏิบัติงานอยู่ในสถานะ <strong>ดูข้อมูลเท่านั้น (Read-Only)</strong> เพื่อความปลอดภัยและความถูกต้องของข้อมูล หากต้องการเปลี่ยนแปลงข้อมูลส่วนตัว เบอร์โทรศัพท์ หรือสิทธิ์การใช้งาน กรุณาติดต่อฝ่ายทรัพยากรบุคคลหรือผู้ดูแลระบบ (HR & Administrator)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
            <span className="text-xs text-slate-400">กำลังดึงข้อมูลผู้ใช้งานจริงจากระบบ...</span>
          </div>
        </div>
      ) : profileUser ? (
        <div className="space-y-6">
          {/* Main User Profile Hero Card */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                {/* Large Avatar with Initial */}
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-linear-to-br from-indigo-500 to-indigo-700 text-white font-extrabold text-3xl shadow-md shadow-indigo-200">
                  {profileUser.name ? profileUser.name.charAt(0) : "U"}
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      {profileUser.name}
                    </h2>
                    <PositionBadge position={roleName} />
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      สถานะ: {profileUser.status || "ใช้งาน"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    รหัสประจำตัว: <span className="font-mono font-bold text-slate-700">#EMP-{String(profileUser.id).padStart(3, "0")}</span> • สังกัด: Zentura Operations
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2.5">
                    {profileUser.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {profileUser.email}
                      </span>
                    )}
                    {profileUser.phone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {profileUser.phone}
                      </span>
                    )}
                    {profileUser.lineId && (
                      <span className="flex items-center gap-1">
                        <span className="font-bold text-emerald-600 text-[11px]">LINE:</span>
                        {profileUser.lineId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* If Guide: Quick Action to Assignment */}
              {isGuide && (
                <div className="flex sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <Link
                    href="/backoffice/assignment"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600 active:scale-95 transition-all"
                  >
                    <Compass className="h-4 w-4 text-amber-300" />
                    ดูงานที่ได้รับมอบหมาย
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* If Guide: Show Tour Overview KPI */}
          {isGuide && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                title="แพ็กเกจที่ดูแลอยู่ (Ongoing)"
                value={guideStats.ongoingCount}
                subtitle="ทริปที่กำลังดำเนินงานหรือกำลังจะถึง"
                icon={Clock}
                color="amber"
              />
              <StatCard
                title="แพ็กเกจที่ดูแลสำเร็จ (Completed)"
                value={guideStats.pastCount}
                subtitle="ประวัติการนำเที่ยวที่เสร็จสิ้น"
                icon={CheckCircle2}
                color="emerald"
              />
              <StatCard
                title="รวมแพ็กเกจที่มอบหมายทั้งหมด"
                value={guideStats.totalCount}
                subtitle="ตลอดการทำงานในระบบ"
                icon={Layers}
                color="indigo"
              />
            </div>
          )}

          {/* Two-Column Details View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 1: ข้อมูลส่วนตัว (Personal Details - Strict Read-Only) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-500" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    ข้อมูลส่วนตัว (Personal Information)
                  </h3>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Lock className="h-3 w-3" />
                  ห้ามแก้ไข
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Name */}
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    ชื่อ-นามสกุล (Full Name)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={profileUser.name || "-"}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-800 font-medium cursor-not-allowed select-all"
                    />
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    อีเมล (Email)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={profileUser.email || "-"}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-800 font-medium cursor-not-allowed select-all font-mono"
                    />
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    เบอร์โทรศัพท์ติดต่อ (Phone Number)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={profileUser.phone || "-"}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-800 font-medium cursor-not-allowed select-all font-mono"
                    />
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Line ID */}
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Line ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={profileUser.lineId || "ไม่มี"}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-800 font-medium cursor-not-allowed select-all font-mono"
                      />
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      อายุ (Age)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={profileUser.age ? `${profileUser.age} ปี` : "ไม่ระบุ"}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-800 font-medium cursor-not-allowed select-all"
                      />
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Created / Registered Date */}
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">
                    วันที่ขึ้นทะเบียนในระบบ (Registered Date)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={formatThaiDate(profileUser.createdAt)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-800 font-medium cursor-not-allowed"
                    />
                    <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: ข้อมูลตำแหน่งและการปฏิบัติงาน (Role & System Permissions) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    ข้อมูลตำแหน่งและสิทธิ์ระบบ (Role & Permissions)
                  </h3>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Lock className="h-3 w-3" />
                  กำหนดโดยผู้ดูแลระบบ
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Role / Position */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">
                      ตำแหน่งหน้าที่ในระบบ
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {roleName}
                    </p>
                  </div>
                  <PositionBadge position={roleName} />
                </div>

                {/* Access Level */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">
                      ระดับการเข้าถึง Workspace
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {profileUser.role?.access || (isAdmin ? "Full Admin Access" : "Standard Operations Access")}
                    </p>
                  </div>
                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                    {isAdmin ? "Super Access" : "Authorized"}
                  </span>
                </div>

                {/* Account Security Status */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">
                      การตั้งรหัสผ่าน (Password Setup)
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {profileUser.isPasswordSet ? "ตั้งรหัสผ่านส่วนตัวแล้ว" : "รหัสผ่านเริ่มต้น"}
                    </p>
                  </div>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      profileUser.isPasswordSet
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {profileUser.isPasswordSet ? "ปลอดภัย" : "แนะนำให้เปลี่ยน"}
                  </span>
                </div>

                {/* If Guide: Assigned packages list */}
                {isGuide && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-semibold uppercase">
                        แพ็กเกจทัวร์ที่ดูแล
                      </span>
                      <Link
                        href="/backoffice/assignment"
                        className="text-[11px] font-bold text-amber-600 hover:underline flex items-center gap-1"
                      >
                        ดูงานทั้งหมด <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {guideStats.packages.length > 0 ? (
                        guideStats.packages.map((p) => (
                          <Link
                            key={p.id}
                            href="/backoffice/assignment"
                            className="inline-flex items-center rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-800 border border-slate-200 shadow-2xs hover:border-amber-400 transition-all"
                          >
                            #{p.id} - {p.name}
                          </Link>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">
                          ยังไม่มีรายการทัวร์ที่ได้รับมอบหมาย
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Guidelines */}
                <div className="rounded-2xl border border-slate-200/80 bg-linear-to-br from-slate-50 to-slate-100/50 p-4 space-y-2 text-slate-600">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-indigo-500" />
                    ข้อกำหนดความปลอดภัยและการใช้งานบัญชี
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>ห้ามแชร์บัญชีหรือรหัสผ่านการใช้งานร่วมกับผู้อื่น</li>
                    <li>ข้อมูลการเข้าถึงทั้งหมดจะถูกบันทึกใน Audit Logs ของระบบเพื่อความปลอดภัย</li>
                    <li>หากต้องการแก้ไขข้อมูลส่วนตัว กรุณาติดต่อฝ่ายทรัพยากรบุคคล (HR)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-700">ไม่พบข้อมูลโปรไฟล์ผู้ใช้งาน</p>
          <p className="text-xs text-slate-400 mt-1">
            {errorMessage || "กรุณาเข้าสู่ระบบใหม่อีกครั้งเพื่อยืนยันตัวตน"}
          </p>
        </div>
      )}
    </div>
  );
}
