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
  Compass,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { setAuth } from "@/lib/auth-client";
import TypingText from "@/components/ui/TypingText";
import { authService } from "@/service/auth";

export default function AuthForm({
  mode: initialMode = "sign-in",
  onSubmit,
  brandName = "Zentura",
  showBrand = true,
  showcaseImage = "/dep377-lake-8844310_1280.jpg",
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
    setFormData({ email: "", password: "", confirmPassword: "", rememberMe: false, terms: false });
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
      let response;
      if (onSubmit) {
        response = await onSubmit(formData, mode);
      } else {
        // ยิง API ตรงนี้เลยตามโหมด (Sign-in หรือ Sign-up)
        if (isSignIn) {
          response = await authService.login({
            email: formData.email,
            password: formData.password
          });
        } else {
          response = await authService.register({
            email: formData.email,
            password: formData.password
          });
        }
      }

      // บันทึกข้อมูลและ Token
      setAuth(response.user);
      if (response.token) {
        window.localStorage.setItem("pt_token", response.token);
      }

      setSuccessMessage(
        isSignIn
          ? "เข้าสู่ระบบสำเร็จ กำลังพาคุณเข้าสู่ระบบ..."
          : "สร้างบัญชีสำเร็จแล้ว! กำลังเตรียมข้อมูลของคุณ..."
      );
      router.push("/feed");
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };


  const inputClass =
    "flex h-12 w-full rounded-xl border-2 border-slate-100 bg-slate-50/50 pl-10 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-[#004d40] focus:bg-white focus:shadow-none focus:outline-none focus:ring-4 focus:ring-[#004d40]/10 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-slate-100/50";

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Container */}
      <div className="animate-card-in relative min-h-160 w-full overflow-hidden bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5">

        {/* Full-width Static Background Image */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src={showcaseImage}
            alt="Showcase"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover opacity-90"
          />
          {/* Subtle overlay for text readability without altering image color */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Text Block (Slides to empty side) */}
        <div
          className={`absolute bottom-0 left-0 hidden h-full w-1/2 md:flex flex-col items-center justify-end p-12 text-center text-white z-0 transition-transform duration-700 ease-in-out ${isSignIn ? "translate-x-full" : "translate-x-0"
            }`}
        >
          <h2 className="flex min-h-12 items-center justify-center text-2xl font-bold drop-shadow-md">
            <TypingText
              words={[
                "สำรวจแพ็กเกจทัวร์ทั่วไทย",
                "วางแผนทริปในแบบของคุณ",
                "จองง่าย ครบในที่เดียว",
              ]}
            />
          </h2>
          <p className="mt-3 text-sm text-slate-200 drop-shadow">
            ทุกสิ่งที่คุณต้องการสำหรับการวางแผนทริปในแดชบอร์ดเดียว
          </p>
        </div>

        {/* Form Panel (Slides left/right) */}
        <div
          className={`absolute top-0 left-0 h-full w-full md:w-1/2 bg-white z-10 transition-transform duration-700 ease-in-out ${isSignIn ? "translate-x-0" : "md:translate-x-full"
            }`}
        >
          <div className="flex h-full flex-col justify-center p-6 sm:p-8">
            <div className="w-full max-w-sm mx-auto">
              {/* Brand */}
              {showBrand && (
                <div className="mb-6 flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-[#004d40] to-teal-600 text-white shadow-lg shadow-teal-900/20">
                    <Compass className="h-6 w-6" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-slate-900">
                    {brandName}
                  </span>
                </div>
              )}

              {/* Mode toggle */}
              <div className="relative mb-6 grid grid-cols-2 rounded-full bg-slate-100 p-1 text-sm font-medium">
                <span
                  aria-hidden="true"
                  className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm transition-transform duration-300 ease-out ${isSignIn ? "translate-x-0" : "translate-x-full"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => switchMode("sign-in")}
                  className={`relative z-10 inline-flex h-10 items-center justify-center rounded-full transition-colors ${isSignIn ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("sign-up")}
                  className={`relative z-10 inline-flex h-10 items-center justify-center rounded-full transition-colors ${isSignIn ? "text-slate-500 hover:text-slate-700" : "text-slate-900"
                    }`}
                >
                  สมัครสมาชิก
                </button>
              </div>

              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {isSignIn ? "ยินดีต้อนรับกลับมา" : "สร้างบัญชีผู้ใช้ใหม่"}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {isSignIn
                    ? "กรุณาเข้าสู่ระบบเพื่อสำรวจแพ็กเกจทัวร์ของคุณ"
                    : "เริ่มต้นใช้งานและสัมผัสประสบการณ์แพ็กเกจทัวร์ที่ดีที่สุด"}
                </p>
              </div>

              {/* Alerts */}
              {errorMessage && (
                <div className="animate-shake mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div className="flex-1 leading-snug">{errorMessage}</div>
                </div>
              )}
              {successMessage && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div className="flex-1 leading-snug">{successMessage}</div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
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
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Confirm Password */}
                {!isSignIn && (
                  <div className="relative animate-fade-in-up">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                )}

                {/* Options */}
                {isSignIn ? (
                  <div className="flex items-center px-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300 text-[#004d40] accent-[#004d40] focus:ring-[#004d40]/30 transition-colors cursor-pointer"
                      />
                      จดจำการเข้าสู่ระบบ
                    </label>
                  </div>
                ) : (
                  <div className="flex items-start px-1 animate-fade-in-up">
                    <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        name="terms"
                        checked={formData.terms}
                        onChange={handleChange}
                        className="h-4 w-4 mt-0.5 rounded border-slate-300 text-[#004d40] accent-[#004d40] focus:ring-[#004d40]/30 transition-colors cursor-pointer shrink-0"
                      />
                      <span className="leading-relaxed">
                        ฉันยอมรับ{" "}
                        <a href="#terms" className="font-medium text-[#004d40] underline underline-offset-2 hover:text-teal-700">ข้อกำหนดการใช้งาน</a>
                        {" "}และ{" "}
                        <a href="#privacy" className="font-medium text-[#004d40] underline underline-offset-2 hover:text-teal-700">นโยบายความเป็นส่วนตัว</a>
                      </span>
                    </label>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#004d40] text-sm font-semibold text-white transition-all hover:bg-[#00332a] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 shadow-lg shadow-teal-900/20 hover:shadow-teal-900/40"
                >
                  <div className="absolute inset-0 flex h-full w-full justify-center transform-[skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:transform-[skew(-12deg)_translateX(150%)]">
                    <div className="relative h-full w-8 bg-white/20" />
                  </div>
                  {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                  <span>{isSignIn ? "เข้าสู่ระบบ" : "สร้างบัญชี"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
