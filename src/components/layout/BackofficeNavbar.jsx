"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, Plus, Search } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";

const titles = [
  {
    href: "/backoffice/package",
    title: "Package",
    description: "Create, review, and manage tour packages.",
  },
  {
    href: "/backoffice/employee",
    title: "Employee",
    description: "Manage staff accounts, roles, and recent activity.",
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

        <label className="hidden h-10 w-full max-w-xs items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 xl:flex">
          <Search className="h-4 w-4" />
          <input
            className="min-w-0 flex-1 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
            placeholder="Search"
          />
        </label>

        <button className="hidden h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 sm:inline-flex">
          <Plus className="h-4 w-4" />
          New
        </button>

        <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50">
          <Bell className="h-4 w-4" />
        </button>

        <Dropdown />
      </div>
    </header>
  );
}
