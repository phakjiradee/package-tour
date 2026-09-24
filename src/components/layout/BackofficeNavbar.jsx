"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";

const titles = [
  {
    href: "/backoffice/package",
    title: "Package",
    description: "Create, review, and manage tour packages.",
  },
  {
    href: "/backoffice/employee",
    title: "จัดการพนักงาน",
    description: "จัดการข้อมูลพนักงาน ตำแหน่ง สถานะ และประวัติการอัปเดต",
  },
  {
    href: "/backoffice/position",
    title: "จัดการตำแหน่ง",
    description: "จัดการข้อมูลตำแหน่ง สิทธิ์การเข้าถึง และจำนวนพนักงานในระบบ",
  },
  {
    href: "/backoffice/dashboard",
    title: "Dashboard",
    description: "Monitor operations, bookings, and revenue signals.",
  },
];

export default function BackofficeNavbar() {
  const pathname = usePathname();
  const current =
    titles.find((item) => pathname.startsWith(item.href)) ??
    titles[titles.length - 1];

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button className="inline-grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-slate-950">
            {current.title}
          </h1>
          <p className="hidden truncate text-sm text-slate-500 sm:block">
            {current.description}
          </p>
        </div>

        <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50">
          <Bell className="h-4 w-4" />
        </button>

        <Dropdown />
      </div>
    </header>
  );
}
