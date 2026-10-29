"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  Compass,
  UserCheck,
} from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";

export default function GuideNavbar() {
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 w-full shrink-0 border-b border-zinc-200/90 bg-white px-3 sm:px-6 select-none">
        <div className="relative flex w-full max-w-7xl mx-auto items-center justify-between">
          {/* Left: Brand Badge */}
          <Link
            href="/worker/assignment"
            className="flex items-center gap-2 transition-transform active:scale-95 shrink-0"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#0051c8] text-white shadow-2xs">
              <Compass size={15} />
            </span>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-zinc-900 tracking-tight">
                Zentura
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">
                Guide
              </span>
            </div>
          </Link>

          {/* Right: Notifications + User Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notifications Button */}
            <button
              type="button"
              aria-label="การแจ้งเตือน"
              className="relative grid h-8 w-8 place-items-center rounded-md border border-zinc-200/80 bg-white text-zinc-500 hover:bg-zinc-50 shadow-2xs transition cursor-pointer"
            >
              <Bell size={13} />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-blue-600" />
            </button>

            {/* User Dropdown */}
          <Dropdown portal="guide" />
          </div>
        </div>
      </header>

    </>
  );
}
