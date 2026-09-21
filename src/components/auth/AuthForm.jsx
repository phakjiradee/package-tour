'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Mail, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Compass
} from 'lucide-react';

export default function AuthForm({
  mode: initialMode = 'sign-in',
  onSubmit,
  brandName = 'Package Tour',
  showBrand = true,
}) {
  const [mode, setMode] = useState(initialMode);
  const isSignIn = mode === 'sign-in';

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Simple validation
    if (!formData.email || !formData.password) {
      setErrorMessage('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    if (!isSignIn) {
      if (formData.password.length < 6) {
        setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }
      if (!formData.terms) {
        setErrorMessage('กรุณายอมรับเงื่อนไขการให้บริการ');
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
        setSuccessMessage(
          isSignIn 
            ? 'เข้าสู่ระบบสำเร็จ กำลังพาคุณเข้าสู่ระบบ...' 
            : 'สร้างบัญชีสำเร็จแล้ว! กำลังเตรียมข้อมูลของคุณ...'
        );
      }
    } catch (err) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full max-w-md mx-auto">
      {/* Shadcn Card Container */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 transition-all">
        
        {/* Card Header */}
        <div className="flex flex-col space-y-2 text-center mb-6">
          {showBrand && (
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="h-9 w-9 rounded-lg bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center text-white dark:text-zinc-900 shadow-xs">
                <Compass className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
                {brandName}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {isSignIn ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชีผู้ใช้ใหม่'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isSignIn
              ? 'กรอกข้อมูลเพื่อเข้าสู่ระบบบัญชีของคุณ'
              : 'เริ่มต้นใช้งานและสัมผัสประสบการณ์แพ็กเกจทัวร์ที่ดีที่สุด'}
          </p>
        </div>

        {/* Feedback Alert: Error */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1 leading-snug">{errorMessage}</div>
          </div>
        )}

        {/* Feedback Alert: Success */}
        {successMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1 leading-snug">{successMessage}</div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div className="space-y-1.5">
            <label 
              htmlFor="email" 
              className="text-sm font-medium text-zinc-900 dark:text-zinc-200 leading-none"
            >
              อีเมล
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="email"
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-300"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="password" 
                className="text-sm font-medium text-zinc-900 dark:text-zinc-200 leading-none"
              >
                รหัสผ่าน
              </label>
              {isSignIn && (
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-zinc-500 hover:text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  ลืมรหัสผ่าน?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent pl-9 pr-10 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Sign Up only) */}
          {!isSignIn && (
            <div className="space-y-1.5">
              <label 
                htmlFor="confirmPassword" 
                className="text-sm font-medium text-zinc-900 dark:text-zinc-200 leading-none"
              >
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent pl-9 pr-10 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-300"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
                  aria-label={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Checkbox Options */}
          {isSignIn ? (
            <div className="flex items-center gap-2 pt-1">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-zinc-300 cursor-pointer accent-zinc-900 dark:accent-zinc-100"
              />
              <label 
                htmlFor="rememberMe" 
                className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none"
              >
                จดจำการเข้าสู่ระบบ
              </label>
            </div>
          ) : (
            <div className="flex items-start gap-2 pt-1">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={formData.terms}
                onChange={handleChange}
                className="h-4 w-4 mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-zinc-300 cursor-pointer accent-zinc-900 dark:accent-zinc-100"
              />
              <label 
                htmlFor="terms" 
                className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed cursor-pointer select-none"
              >
                ฉันยอมรับ{' '}
                <a href="#terms" className="text-zinc-900 dark:text-zinc-200 underline underline-offset-2 hover:text-zinc-700">
                  ข้อกำหนดการใช้งาน
                </a>{' '}
                และ{' '}
                <a href="#privacy" className="text-zinc-900 dark:text-zinc-200 underline underline-offset-2 hover:text-zinc-700">
                  นโยบายความเป็นส่วนตัว
                </a>
              </label>
            </div>
          )}

          {/* Shadcn Primary Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow-xs hover:bg-zinc-800 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isSignIn ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}</span>
          </button>
        </form>


        {/* Card Footer: Toggle Mode */}
        <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          {isSignIn ? (
            <>
              ยังไม่มีบัญชีผู้ใช้?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('sign-up');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-800 dark:text-zinc-100 dark:hover:text-zinc-300 transition-colors"
              >
                สมัครสมาชิก
              </button>
            </>
          ) : (
            <>
              มีบัญชีผู้ใช้อยู่แล้ว?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('sign-in');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-800 dark:text-zinc-100 dark:hover:text-zinc-300 transition-colors"
              >
                เข้าสู่ระบบ
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}