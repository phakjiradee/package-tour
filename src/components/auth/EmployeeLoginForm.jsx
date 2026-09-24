"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { setBackofficeAuth } from "@/lib/backoffice-auth";
import TypingText from "@/components/ui/TypingText";
import { authService } from "@/service/auth";

export default function EmployeeLoginForm({
  brandName = "Zentura Backoffice",
  showcaseImage = "/dep377-lake-8844310_1280.jpg",
}) {
  const router = useRouter();

  // Step: "login" | "first-time-password"
  const [step, setStep] = useState("login");

  // Form State
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [newPasswordForm, setNewPasswordForm] = useState({
    newPassword: "",
    confirmNewPassword: "",
  });

  // State for employee session awaiting first-time password change
  const [pendingUser, setPendingUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Handle Login Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!loginForm.email.trim() || !loginForm.password) {
      setErrorMessage("กรุณากรอกอีเมล์และรหัสผ่าน");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      const user = response.user;
      const token = response.token;

      // Check if user is logging in for the first time (isPasswordSet === 0)
      if (user.isPasswordSet === 0) {
        setPendingUser(user);
        setCurrentPassword(loginForm.password);
        setStep("first-time-password");
        setSuccessMessage("เข้าสู่ระบบสำเร็จ! เนื่องจากเป็นการเข้าใช้งานครั้งแรก กรุณาตั้งรหัสผ่านใหม่ของคุณ");
        return;
      }

      // Normal login (already set password)
      setBackofficeAuth(user, token);
      setSuccessMessage("เข้าสู่ระบบสำเร็จ กำลังพาเข้าสู่ระบบ Backoffice...");
      router.push("/backoffice/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setErrorMessage(
        err?.response?.data?.message || err?.message || "อีเมล์หรือรหัสผ่านไม่ถูกต้อง"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle First-time Password Change Submission
  const handleSetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const { newPassword, confirmNewPassword } = newPasswordForm;

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิมที่ระบบสุ่มให้");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.setPassword({
        employeeId: pendingUser.id,
        email: pendingUser.email,
        currentPassword,
        newPassword,
      });

      // Save authenticated employee
      setBackofficeAuth(response.user, response.token);
      setSuccessMessage("ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว! กำลังเข้าสู่ระบบ...");

      setTimeout(() => {
        router.push("/backoffice/dashboard");
      }, 1000);
    } catch (err) {
      console.error("Set password error:", err);
      setErrorMessage(
        err?.response?.data?.message || err?.message || "เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition-all focus:border-cyan-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6">
      {/* Main Container Card */}
      <div className="relative min-h-[580px] w-full overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 flex flex-col md:flex-row">
        {/* Left Side: Showcase Image & Typing Banner */}
        <div className="relative hidden md:flex md:w-1/2 flex-col justify-between p-10 overflow-hidden text-white">
          <Image
            src={showcaseImage}
            alt="Zentura Backoffice"
            fill
            priority
            sizes="(max-width: 1024px) 50vw, 600px"
            className="object-cover"
          />
          {/* Gradients overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/20" />

          {/* Top Brand Tag */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/20 backdrop-blur-md border border-cyan-400/40 text-cyan-300">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white drop-shadow">
              {brandName}
            </span>
          </div>

          {/* Bottom Typing Banner */}
          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-200 backdrop-blur-md border border-cyan-400/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              ระบบบริหารจัดการหลังบ้าน (Backoffice)
            </span>
            <h2 className="text-2xl font-bold leading-snug drop-shadow-md min-h-16">
              <TypingText
                words={[
                  "จัดการแพ็กเกจทัวร์และข้อมูลพนักงาน",
                  "ระบบปลอดภัย ตรวจสอบได้ทุกขั้นตอน",
                  "ควบคุมการดำเนินงานได้ในที่เดียว",
                ]}
              />
            </h2>
            <p className="text-xs text-slate-300 drop-shadow">
              เข้าถึงเฉพาะเจ้าหน้าที่และผู้ดูแลระบบที่ได้รับอนุญาตเท่านั้น
            </p>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-6 sm:p-10 lg:p-12 bg-white">
          <div className="w-full max-w-sm mx-auto">
            {/* Mobile Brand (visible on small screens) */}
            <div className="mb-6 flex md:hidden items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-600 text-white">
                <Compass className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-slate-900">{brandName}</span>
            </div>

            {/* Step 1: Login Form */}
            {step === "login" && (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 mb-2">
                    <UserCheck className="h-3.5 w-3.5 text-cyan-600" />
                    เข้าสู่ระบบพนักงาน
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                    เข้าสู่ระบบ
                  </h1>
                  <p className="mt-1.5 text-xs text-slate-500">
                    กรุณากรอกอีเมล์และรหัสผ่านที่ได้รับจากผู้ดูแลระบบ
                  </p>
                </div>

                {/* Alerts */}
                {errorMessage && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 animate-shake">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <span className="flex-1 leading-snug">{errorMessage}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="flex-1 leading-snug">{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      อีเมล์ผู้ใช้งาน (User)
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={loginForm.email}
                        onChange={(e) => {
                          setLoginForm({ ...loginForm, email: e.target.value });
                          if (errorMessage) setErrorMessage("");
                        }}
                        placeholder="your-email@zentura.co"
                        disabled={isLoading}
                        autoComplete="email"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      รหัสผ่าน (Password)
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={loginForm.password}
                        onChange={(e) => {
                          setLoginForm({ ...loginForm, password: e.target.value });
                          if (errorMessage) setErrorMessage("");
                        }}
                        placeholder="••••••••"
                        disabled={isLoading}
                        autoComplete="current-password"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                        กำลังตรวจสอบข้อมูล...
                      </>
                    ) : (
                      "เข้าสู่ระบบพนักงาน"
                    )}
                  </button>

                  <p className="pt-2 text-center text-[11px] text-slate-400">
                    * ระบบนี้เฉพาะพนักงานและผู้ดูแลระบบเท่านั้น ไม่เปิดรับสมัครภายนอก
                  </p>
                </form>
              </>
            )}

            {/* Step 2: First-time Password Change */}
            {step === "first-time-password" && (
              <>
                <div className="mb-5">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200 mb-2">
                    <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                    เข้าใช้งานครั้งแรก
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                    ตั้งรหัสผ่านใหม่
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    สวัสดีคุณ <strong className="text-slate-800">{pendingUser?.name}</strong> เพื่อความปลอดภัย กรุณาตั้งรหัสผ่านใหม่ก่อนเริ่มใช้งาน
                  </p>
                </div>

                {/* User info banner */}
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 flex items-center justify-between">
                  <span>บัญชี:</span>
                  <span className="font-mono font-semibold text-slate-900">{pendingUser?.email}</span>
                </div>

                {/* Alerts */}
                {errorMessage && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <span className="flex-1 leading-snug">{errorMessage}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="flex-1 leading-snug">{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      รหัสผ่านใหม่ <span className="text-slate-400 font-normal">(อย่างน้อย 6 ตัวอักษร)</span>
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPasswordForm.newPassword}
                        onChange={(e) => {
                          setNewPasswordForm({ ...newPasswordForm, newPassword: e.target.value });
                          if (errorMessage) setErrorMessage("");
                        }}
                        placeholder="รหัสผ่านใหม่"
                        disabled={isLoading}
                        autoComplete="new-password"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      ยืนยันรหัสผ่านใหม่
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={newPasswordForm.confirmNewPassword}
                        onChange={(e) => {
                          setNewPasswordForm({ ...newPasswordForm, confirmNewPassword: e.target.value });
                          if (errorMessage) setErrorMessage("");
                        }}
                        placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
                        disabled={isLoading}
                        autoComplete="new-password"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        กำลังบันทึกรหัสผ่าน...
                      </>
                    ) : (
                      "บันทึกรหัสผ่านใหม่และเข้าสู่ระบบ"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
