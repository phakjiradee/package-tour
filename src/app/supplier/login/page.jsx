"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  RefreshCw,
  Store,
} from "lucide-react";
import supplierService from "@/service/supplier";
import { setSupplierAuth } from "@/lib/supplier-auth";

export default function SupplierLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // First-time password set state
  const [needNewPassword, setNeedNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    try {
      setLoading(true);
      const res = await supplierService.login({
        email: email.trim(),
        password,
      });

      if (res.success && res.token) {
        // ตรวจสอบว่าต้องตั้งรหัสผ่านใหม่ก่อนหรือไม่
        if (res.user?.isPasswordSet === 0) {
          setNeedNewPassword(true);
          return;
        }

        setSupplierAuth(res.user, res.token);
        router.push("/supplier");
        router.refresh();
      } else {
        setError(res.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือคุณไม่มีสิทธิ์เข้าถึงพอร์ทัลนี้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      setSetPasswordLoading(true);
      const res = await supplierService.setPassword({
        email: email.trim(),
        currentPassword: password,
        newPassword,
      });

      if (res.success && res.token) {
        setSupplierAuth(res.user, res.token);
        router.push("/supplier");
        router.refresh();
      } else {
        setError(res.message || "ไม่สามารถตั้งรหัสผ่านใหม่ได้");
      }
    } catch (err) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่");
    } finally {
      setSetPasswordLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans text-slate-100">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header Branding */}
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-white">
            ZENTURA <span className="text-cyan-400">SUPPLIER</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            ระบบตรวจสอบเที่ยวรถบัสและกำหนดการสำหรับคู่ค้าและพาร์ทเนอร์
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* First Time Password Change Form */}
        {needNewPassword ? (
          <form onSubmit={handleSetNewPassword} className="mt-6 space-y-4">
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 text-xs text-cyan-200">
              <div className="flex items-center gap-2 font-semibold">
                <KeyRound className="h-4 w-4 text-cyan-400" />
                <span>การเข้าสู่ระบบครั้งแรก</span>
              </div>
              <p className="mt-1 text-slate-300">
                กรุณาตั้งรหัสผ่านใหม่เพื่อความปลอดภัยในการเข้าใช้งานพอร์ทัล Supplier
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="รหัสผ่านใหม่"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                ยืนยันรหัสผ่านใหม่อีกครั้ง
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={setPasswordLoading}
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
            >
              {setPasswordLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>บันทึกรหัสผ่านและเข้าสู่ระบบ</span>
            </button>
          </form>
        ) : (
          /* Normal Login Form */
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                อีเมลของพาร์ทเนอร์
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="อีเมลที่บันทึกในข้อมูลพาร์ทเนอร์"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
            >
              {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>เข้าสู่ระบบ Supplier</span>
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-slate-800/80 pt-4 text-center">
          <p className="text-[11px] text-slate-500">
            พอร์ทัลนี้สำหรับตัวแทนและซัพพลายเออร์ที่ลงทะเบียนเท่านั้น หากพบปัญหา กรุณาติดต่อผู้ดูแลระบบ Zentura
          </p>
        </div>
      </div>
    </div>
  );
}
