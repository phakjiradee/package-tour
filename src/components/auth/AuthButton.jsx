"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Package, UserRound } from "lucide-react";
import {
  getAuth,
  clearAuth,
  subscribeAuth,
  getAuthServerSnapshot,
} from "@/lib/auth-client";

export default function AuthButton({ fullWidth = false }) {
  const user = useSyncExternalStore(
    subscribeAuth,
    getAuth,
    getAuthServerSnapshot,
  );
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = () => {
    clearAuth();
    setOpen(false);
    router.push("/feed");
  };

  // Condition 1: not logged in -> show sign in / sign up actions.
  if (!user) {
    return (
      <div
        className={
          fullWidth
            ? "grid w-full grid-cols-2 gap-2"
            : "flex items-center gap-1.5"
        }
      >
        <Link
          href="/auth/sign-in"
          className={`inline-flex h-9 items-center justify-center rounded-full px-3.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 ${
            fullWidth ? "w-full" : ""
          }`}
        >
          เข้าสู่ระบบ
        </Link>
        <Link
          href="/auth/sign-up"
          className={`inline-flex h-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-500/30 transition-transform duration-200 hover:scale-[1.04] active:scale-95 ${
            fullWidth ? "w-full" : ""
          }`}
        >
          สมัครสมาชิก
        </Link>
      </div>
    );
  }

  // Condition 2: logged in -> show avatar menu.
  const label = user.name || user.email || "ผู้ใช้";
  const initials = label.slice(0, 2).toUpperCase();

  return (
    <div className={`relative ${fullWidth ? "w-full" : ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow ${
          fullWidth ? "w-full justify-between" : ""
        }`}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
          {initials}
        </span>
        <span
          className={
            fullWidth
              ? "max-w-[10rem] truncate"
              : "hidden max-w-[8rem] truncate sm:inline"
          }
        >
          {label}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="animate-menu-in absolute right-0 z-30 mt-2 w-52 origin-top-right rounded-2xl border border-slate-200/70 bg-white/90 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {label}
            </p>
            {user.email ? (
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            ) : null}
          </div>
          <div className="my-1 h-px bg-slate-100" />
          <Link
            href="/package"
            onClick={() => setOpen(false)}
            className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-slate-700 transition hover:bg-slate-100"
          >
            <Package className="h-4 w-4" />
            แพ็กเกจของฉัน
          </Link>
          <button
            type="button"
            className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-slate-700 transition hover:bg-slate-100"
          >
            <UserRound className="h-4 w-4" />
            โปรไฟล์
          </button>
          <div className="my-1 h-px bg-slate-100" />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </button>
        </div>
      ) : null}
    </div>
  );
}
