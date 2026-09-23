"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Package, UserRound } from "lucide-react";
import {
  getAuth,
  clearAuth,
  setAuth,
  subscribeAuth,
  getAuthServerSnapshot,
} from "@/lib/auth-client";
import authService, { serviceAuth } from "@/service/auth";

const auth = authService || serviceAuth;

export default function AuthButton({ fullWidth = false }) {
  const user = useSyncExternalStore(
    subscribeAuth,
    getAuth,
    getAuthServerSnapshot,
  );
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  // Validate session with the backend API on mount
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("pt_token")
        : null;

    if (!token) {
      if (getAuth()) {
        clearAuth();
      }
      return;
    }

    if (!auth?.getMe) {
      return;
    }

    let isMounted = true;
    auth
      .getMe()
      .then((response) => {
        if (!isMounted) return;
        const userData = response?.user || response?.data || response;
        if (userData && (userData.id || userData.email)) {
          setAuth(userData);
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("Auth verification failed:", error);
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          clearAuth();
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleSignOut = async () => {
    try {
      if (auth?.logout) {
        await auth.logout();
      }
    } catch (err) {
      console.warn("Sign out request error:", err);
    } finally {
      clearAuth();
      setOpen(false);
      router.push("/feed");
      router.refresh();
    }
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
          className={`inline-flex h-9 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-700 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-500/30 transition-transform duration-200 hover:scale-[1.04] active:scale-95 ${
            fullWidth ? "w-full" : ""
          }`}
        >
          สมัครสมาชิก
        </Link>
      </div>
    );
  }

  // Condition 2: logged in -> show avatar menu.
  const label =
    user.name ||
    (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "") ||
    user.username ||
    user.email?.split("@")[0] ||
    "ผู้ใช้";

  const initials = (label || "U").slice(0, 2).toUpperCase();

  const roleName =
    typeof user.role === "object" && user.role !== null
      ? user.role.name
      : typeof user.role === "string"
      ? user.role
      : null;

  return (
    <div className={`relative ${fullWidth ? "w-full" : ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow ${
          fullWidth ? "w-full justify-between" : ""
        }`}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-linear-to-br from-blue-500 to-blue-700 text-xs font-bold text-white uppercase">
          {initials}
        </span>
        <span
          className={
            fullWidth
              ? "max-w-40 truncate"
              : "hidden max-w-32 truncate sm:inline"
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
        <div className="animate-menu-in absolute right-0 z-30 mt-2 w-56 origin-top-right rounded-2xl border border-slate-200/70 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-slate-900">
                {label}
              </p>
              {roleName ? (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                  {roleName}
                </span>
              ) : null}
            </div>
            {user.email ? (
              <p className="truncate text-xs text-slate-500 mt-0.5">{user.email}</p>
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
