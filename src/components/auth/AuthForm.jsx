"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Compass,
} from "lucide-react";
import { setAuth } from "@/lib/auth-client";
import TypingText from "@/components/ui/TypingText";

export default function AuthForm({
  mode: initialMode = "sign-in",
  onSubmit,
  brandName = "Package Tour",
  showBrand = true,
  showcaseImage = "/cartoon-travel.gif",
}) {
  const [mode, setMode] = useState(initialMode);
  const isSignIn = mode === "sign-in";
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: false,
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const switchMode = (next) => {
    setMode(next);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Simple validation
    if (!formData.email || !formData.password) {
      setErrorMessage("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    if (!isSignIn) {
      if (formData.password.length < 6) {
        setErrorMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
        return;
      }
      if (!formData.terms) {
        setErrorMessage("กรุณายอมรับเงื่อนไขการให้บริการ");
        return;
      }
    }

    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(formData, mode);
      } else {
        // Mock async request
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      // Mark the session as logged in so the navbar switches to its auth UI.
      setAuth({ name: formData.email, email: formData.email });
      setSuccessMessage(
        isSignIn
          ? "เข้าสู่ระบบสำเร็จ กำลังพาคุณเข้าสู่ระบบ..."
          : "สร้างบัญชีสำเร็จแล้ว! กำลังเตรียมข้อมูลของคุณ...",
      );
      router.push("/feed");
    } catch (err) {
      setErrorMessage(err?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-blue-500 focus:bg-white focus:shadow-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Split Card Container */}
      <div className="animate-card-in grid overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-white/50 md:grid-cols-2">
        {/* Left: Form */}
        <div className="p-8 sm:p-10 lg:p-12">
          {/* Brand */}
          {showBrand && (
            <div
              className="animate-fade-in-up mb-6 flex items-center gap-2"
              style={{ animationDelay: "0.05s" }}
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm shadow-blue-500/30">
                <Compass className="h-5 w-5" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                {brandName}
              </span>
            </div>
          )}

          {/* Mode toggle: segmented control with sliding indicator */}
          <div
            className="animate-fade-in-up relative mb-6 grid grid-cols-2 rounded-full bg-slate-100 p-1 text-xs font-medium"
            style={{ animationDelay: "0.08s" }}
          >
            <span
              aria-hidden="true"
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition-transform duration-300 ease-out ${
                isSignIn ? "translate-x-0" : "translate-x-full"
              }`}
            />
            <button
              type="button"
              onClick={() => switchMode("sign-in")}
              className={`relative z-10 inline-flex h-8 items-center justify-center rounded-full transition-colors ${
                isSignIn
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => switchMode("sign-up")}
              className={`relative z-10 inline-flex h-8 items-center justify-center rounded-full transition-colors ${
                isSignIn
                  ? "text-slate-500 hover:text-slate-700"
                  : "text-slate-900"
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>

          {/* Header */}
          <div
            className="animate-fade-in-up mb-6"
            style={{ animationDelay: "0.1s" }}
          >
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {isSignIn ? "ยินดีต้อนรับกลับมา" : "สร้างบัญชีผู้ใช้ใหม่"}
            </h1>
            <p className="mt-1.5 text-xs text-slate-500">
              {isSignIn
                ? "กรุณาเข้าสู่ระบบเพื่อสำรวจแพ็กเกจทัวร์ของคุณ"
                : "เริ่มต้นใช้งานและสัมผัสประสบการณ์แพ็กเกจทัวร์ที่ดีที่สุด"}
            </p>
          </div>

          {/* Feedback Alert: Error */}
          {errorMessage && (
            <div className="animate-shake mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div className="flex-1 leading-snug">{errorMessage}</div>
            </div>
          )}

          {/* Feedback Alert: Success */}
          {successMessage && (
            <div className="animate-fade-in-up mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div className="flex-1 leading-snug">{successMessage}</div>
            </div>
          )}

          {/* Form Body */}
          <form
            onSubmit={handleSubmit}
            className="animate-fade-in-up space-y-4"
            style={{ animationDelay: "0.15s" }}
          >
            {/* Email */}
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="อีเมล"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="email"
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="รหัสผ่าน"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete={isSignIn ? "current-password" : "new-password"}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Confirm Password (Sign Up only) */}
            {!isSignIn && (
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="ยืนยันรหัสผ่าน"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label={
                    showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}

            {/* Options Row */}
            {isSignIn ? (
              <div className="flex items-center">
                <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-slate-600">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="checkbox-animated"
                  />
                  จดจำการเข้าสู่ระบบ
                </label>
              </div>
            ) : (
              <label className="flex cursor-pointer select-none items-start gap-2 text-xs text-slate-600">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="checkbox-animated mt-0.5"
                />
                <span className="leading-relaxed">
                  ฉันยอมรับ{" "}
                  <a
                    href="#terms"
                    className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700"
                  >
                    ข้อกำหนดการใช้งาน
                  </a>{" "}
                  และ{" "}
                  <a
                    href="#privacy"
                    className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700"
                  >
                    นโยบายความเป็นส่วนตัว
                  </a>
                </span>
              </label>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-4 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:pointer-events-none disabled:opacity-60"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isSignIn ? "เข้าสู่ระบบ" : "สร้างบัญชี"}</span>
            </button>
          </form>
        </div>

        {/* Right: Showcase Panel */}
        <div className="relative hidden md:block md:overflow-hidden">
          <Image
            src={showcaseImage}
            alt="แพ็กเกจทัวร์ทะเลไทย"
            fill
            priority
            sizes="(max-width: 768px) 0px, 50vw"
            className="object-cover"
          />
          {/* Gradient overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-blue-900/35 to-blue-800/10" />

          <div
            className="animate-fade-in-up absolute inset-x-0 bottom-0 z-10 p-10 text-center"
            style={{ animationDelay: "0.25s" }}
          >
            <h2 className="flex min-h-7 items-center justify-center text-lg font-bold text-white drop-shadow-sm">
              <TypingText
                words={[
                  "สำรวจแพ็กเกจทัวร์ทั่วไทย",
                  "วางแผนทริปในแบบของคุณ",
                  "จองง่าย ครบในที่เดียว",
                ]}
              />
            </h2>
            <p className="mt-2 text-xs text-blue-100 drop-shadow">
              ทุกสิ่งที่คุณต้องการสำหรับการวางแผนทริปในแดชบอร์ดเดียว
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
