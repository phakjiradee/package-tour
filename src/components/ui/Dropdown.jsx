"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, UserRound, Shield } from "lucide-react";
import { clearBackofficeAuth, getBackofficeAuth } from "@/lib/backoffice-auth";

export default function Dropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user] = useState(() => getBackofficeAuth());
  const ref = useRef(null);


  const handleSignOut = () => {
    clearBackofficeAuth();
    setOpen(false);
    router.push("/backoffice/login");
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const name = user?.name || "Admin User";
  const email = user?.email || "admin@zentura.com";
  const role = user?.role || "Admin";
  const initials = (name || "AD").slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 items-center gap-2 rounded-md border border-zinc-200/90 bg-white px-2 text-xs font-medium text-zinc-700 shadow-2xs transition hover:bg-zinc-50 cursor-pointer"
      >
        <span className="grid h-5 w-5 place-items-center rounded bg-[#0051c8] text-[10px] font-bold text-white uppercase">
          {initials}
        </span>
        <span className="hidden sm:inline font-semibold text-zinc-800">{name}</span>
        <span className="hidden md:inline-flex items-center rounded bg-blue-50 px-1.5 py-0.2 text-[9px] font-semibold text-blue-700 uppercase">
          {role}
        </span>
        <ChevronDown className="h-3 w-3 text-zinc-400" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-zinc-200/90 bg-white p-1.5 shadow-xl shadow-zinc-900/10">
          <div className="px-3 py-2 border-b border-zinc-100">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold text-zinc-900">
                {name}
              </p>
              <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 uppercase">
                {role}
              </span>
            </div>
            <p className="truncate text-[11px] text-zinc-400 mt-0.5">
              {email}
            </p>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/backoffice/employee");
              }}
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 cursor-pointer transition-colors"
            >
              <UserRound className="h-3.5 w-3.5 text-zinc-400" />
              <span>ข้อมูลพนักงาน</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/backoffice/position");
              }}
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 cursor-pointer transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-zinc-400" />
              <span>สิทธิ์การใช้งาน</span>
            </button>
          </div>

          <div className="border-t border-zinc-100 pt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
