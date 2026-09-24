"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearBackofficeAuth } from "@/lib/backoffice-auth";
import {
  BarChart3,
  BriefcaseBusiness,
  Boxes,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MapPin,
  Settings,
  UsersRound,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/backoffice/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Package",
    href: "/backoffice/package",
    icon: Boxes,
  },
  {
    label: "สถานที่",
    href: "/backoffice/location",
    icon: MapPin,
  },
];

const utilityItems = [
  {
    label: "Reports",
    href: "/backoffice/reports",
    icon: BarChart3,
  },
];

const settingItems = [
  {
    label: "พนักงาน",
    href: "/backoffice/employee",
    icon: UsersRound,
  },
  {
    label: "ตำแหน่ง",
    href: "/backoffice/position",
    icon: BriefcaseBusiness,
  },
];

function SidebarLink({ item }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive =
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={`group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
        isActive
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {isActive ? <ChevronRight className="h-4 w-4 shrink-0" /> : null}
    </Link>
  );
}

function SettingsDropdownContent({ pathname }) {
  const hasActiveChild = settingItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const [open, setOpen] = useState(hasActiveChild);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`group flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
          hasActiveChild
            ? "bg-slate-800 text-white"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
      >
        <Settings className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">ตั้งค่า</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="mt-1 space-y-1 pl-4">
          {settingItems.map((item) => (
            <SidebarLink key={item.href} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SettingsDropdown() {
  const pathname = usePathname();

  return <SettingsDropdownContent key={pathname} pathname={pathname} />;
}

export default function Sidebar() {
  const router = useRouter();

  const handleSignOut = () => {
    clearBackofficeAuth();
    router.push("/backoffice/login");
  };

  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-slate-800 bg-slate-950 px-4 py-5 text-white lg:flex lg:flex-col">
      <div className="flex h-12 items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-400 text-sm font-black text-slate-950">
          Z
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Zentura</p>
          <p className="truncate text-xs text-slate-400">Backoffice</p>
        </div>
      </div>

      <div className="mt-7">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Workspace
        </p>
        <nav className="mt-3 space-y-1">
          {navItems.map((item) => (
            <SidebarLink key={item.href} item={item} />
          ))}
        </nav>
      </div>

      <div className="mt-8">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Manage
        </p>
        <nav className="mt-3 space-y-1">
          {utilityItems.map((item) => (
            <SidebarLink key={item.href} item={item} />
          ))}
          <SettingsDropdown />
        </nav>
      </div>

      <div className="mt-auto rounded-lg border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm font-semibold">Admin session</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Manage tours, packages, and customer operations from one place.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-slate-800 text-sm font-medium text-slate-100 transition hover:bg-slate-700 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
