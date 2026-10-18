"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, Plus, Search, Sparkles, Compass } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";

const titles = [
  {
    href: "/backoffice/dashboard",
    title: "แดชบอร์ด",
    titleEn: "Dashboard",
    description: "ภาพรวมสถิติ การจอง และรายรับของระบบ",
  },
  {
    href: "/backoffice/booking",
    title: "จัดการการจอง",
    titleEn: "Bookings",
    description: "ตรวจสอบรายการจอง รายละเอียดผู้เดินทาง และอัปเดตสถานะ",
  },
  {
    href: "/backoffice/package",
    title: "จัดการแพ็กเกจ",
    titleEn: "Packages",
    description: "สร้าง ตรวจสอบ และบริหารจัดการแพ็กเกจทัวร์",
  },
  {
    href: "/backoffice/location",
    title: "จัดการสถานที่",
    titleEn: "Locations",
    description: "จุดหมายปลายทาง แหล่งท่องเที่ยว และประเภทสถานที่",
  },
  {
    href: "/backoffice/partner",
    title: "จัดการพาร์ทเนอร์",
    titleEn: "Partners",
    description: "คู่ค้า โรงแรม ยานพาหนะ และพาร์ทเนอร์ทางธุรกิจ",
  },
  {
    href: "/backoffice/bus",
    title: "จัดการรถบัส",
    titleEn: "Buses",
    description: "จัดการยานพาหนะและผังที่นั่งการเดินทาง",
  },
  {
    href: "/backoffice/employee",
    title: "จัดการพนักงาน",
    titleEn: "Employees",
    description: "ข้อมูลบุคลากร ตำแหน่งงาน และสิทธิ์เข้าถึง",
  },
  {
    href: "/backoffice/position",
    title: "จัดการตำแหน่ง",
    titleEn: "Positions",
    description: "ตำแหน่ง สิทธิ์การเข้าถึง และโครงสร้างองค์กร",
  },
];

export default function BackofficeNavbar({ onToggleMobileMenu }) {
  const pathname = usePathname();
  const current =
    titles.find((item) => pathname.startsWith(item.href)) ?? titles[0];

  return (
    <header className="sticky top-0 z-40 flex h-12 w-full shrink-0 items-center justify-between border-b border-zinc-200/90 bg-white px-3 sm:px-4 select-none">
      {/* Left: Hamburger + Brand + Breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="เปิดเมนู"
            className="cursor-pointer rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 lg:hidden"
          >
            <Menu size={16} />
          </button>
        )}

        {/* Brand Badge */}
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#0051c8] text-white shadow-2xs">
            <Compass size={15} />
          </span>
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-xs font-bold text-zinc-900 tracking-tight">
              Zentura
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">
              Backoffice
            </span>
          </div>
        </div>

        {/* Breadcrumb separator & active route */}
        <div className="hidden md:flex items-center gap-2 text-xs border-l border-zinc-200 pl-3">
          <span className="font-semibold text-zinc-900">
            {current.title}
          </span>
          {current.titleEn && (
            <span className="text-zinc-400">
              · {current.titleEn}
            </span>
          )}
        </div>
      </div>

      {/* Right: Search Box + Actions + User Dropdown */}
      <div className="flex items-center gap-2">
        {/* Quick Search Trigger */}
        <div className="hidden md:flex items-center justify-between gap-3 rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-2.5 py-1 text-xs text-zinc-400 w-44 lg:w-56 transition-colors">
          <span className="flex items-center gap-1.5 truncate">
            <Search size={13} className="text-zinc-400 shrink-0" />
            <span className="truncate">ค้นหาหน้า, ข้อมูล...</span>
          </span>
          <kbd className="inline-flex items-center rounded border border-zinc-200 bg-white px-1.5 py-0.2 text-[10px] font-mono text-zinc-400 shadow-2xs shrink-0">
            ⌘K
          </kbd>
        </div>

        {pathname.startsWith("/backoffice/bus") && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("bus:create"))}
            className="btn-primary h-8 px-3 text-xs rounded-lg cursor-pointer"
          >
            <Plus size={13} />
            <span>เพิ่มรถ</span>
          </button>
        )}

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
        <Dropdown />
      </div>
    </header>
  );
}
