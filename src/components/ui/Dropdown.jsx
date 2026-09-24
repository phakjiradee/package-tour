"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { clearBackofficeAuth } from "@/lib/backoffice-auth";

export default function Dropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = () => {
    clearBackofficeAuth();
    setOpen(false);
    router.push("/backoffice/login");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-3 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-950 text-xs font-bold text-white">
          AD
        </span>
        <span className="hidden sm:inline">Admin</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/60">
          <button className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-slate-700 hover:bg-slate-100">
            <UserRound className="h-4 w-4" />
            Profile
          </button>
          <button className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-slate-700 hover:bg-slate-100">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-rose-600 hover:bg-rose-50 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
