"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bus,
  BriefcaseBusiness,
  Boxes,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  Handshake,
  LayoutDashboard,
  LogOut,
  MapPin,
  PanelLeft,
  Settings,
  Store,
  UsersRound,
} from "lucide-react";
import { clearBackofficeAuth } from "@/lib/backoffice-auth";

const NAV_GROUPS = [
  {
    label: "WORKSPACE",
    items: [
      {
        label: "แดชบอร์ด",
        labelEn: "Dashboard",
        href: "/backoffice/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "รายการจอง",
        labelEn: "Bookings",
        href: "/backoffice/booking",
        icon: CalendarCheck,
      },
      {
        label: "จัดที่นั่ง",
        labelEn: "Seating",
        href: "/backoffice/seating",
        icon: Bus,
      },
      {
        label: "แพ็กเกจทัวร์",
        labelEn: "Packages",
        href: "/backoffice/package",
        icon: Boxes,
      },
      {
        label: "สถานที่ท่องเที่ยว",
        labelEn: "Locations",
        href: "/backoffice/location",
        icon: MapPin,
      },
      {
        label: "พาร์ทเนอร์",
        labelEn: "Partners",
        href: "/backoffice/partner",
        icon: Handshake,
      },
      {
        label: "รถบัส & ที่นั่ง",
        labelEn: "Buses",
        href: "/backoffice/bus",
        icon: Bus,
      },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      {
        label: "จัดการพนักงาน",
        labelEn: "Employees",
        href: "/backoffice/employee",
        icon: UsersRound,
      },
      {
        label: "บัญชี Supplier",
        labelEn: "Suppliers",
        href: "/backoffice/supplier",
        icon: Store,
      },
      {
        label: "ตำแหน่ง & สิทธิ์",
        labelEn: "Positions",
        href: "/backoffice/position",
        icon: BriefcaseBusiness,
      },
    ],
  },
];

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = () => {
    clearBackofficeAuth();
    router.push("/backoffice/login");
  };

  const renderNavContent = (isMobile = false) => {
    const isCollapsed = !isMobile && collapsed;

    return (
      <div className="flex h-full flex-col justify-between p-2 select-none overflow-hidden">
        {/* Navigation list */}
        <nav
          className="thin-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden py-1 px-0.5"
          aria-label="เมนูหลักหลังบ้าน"
        >
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={group.label} className="space-y-0.5">
              {isCollapsed ? (
                groupIdx > 0 && (
                  <div className="my-2 mx-auto w-5 border-t border-zinc-200" />
                )
              ) : (
                <p className="px-2.5 pb-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase whitespace-nowrap">
                  {group.label}
                </p>
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  if (isCollapsed) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.label}
                        className={`relative flex size-8.5 items-center justify-center rounded-md mx-auto transition-colors ${
                          isActive
                            ? "bg-zinc-100 text-zinc-900 font-semibold shadow-2xs"
                            : "text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900"
                        }`}
                      >
                        <Icon size={16} className="shrink-0" />
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        if (isMobile && onCloseMobile) onCloseMobile();
                      }}
                      className={`group flex items-center justify-between gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-colors select-none ${
                        isActive
                          ? "bg-zinc-100 font-semibold text-zinc-900 shadow-2xs"
                          : "font-normal text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-950"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={15}
                          className={`shrink-0 ${
                            isActive
                              ? "text-zinc-900"
                              : "text-zinc-500 group-hover:text-zinc-700"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && (
                        <span className="size-1 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Bar: Collapse Toggle */}
        {!isMobile && (
          <div className="mt-auto border-t border-zinc-200/80 pt-2 px-0.5">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"}
              className={`flex items-center gap-2 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer ${
                collapsed ? "size-8.5 justify-center mx-auto" : "w-full text-xs font-medium"
              }`}
            >
              <PanelLeft size={16} className="shrink-0" />
              {!collapsed && <span>ย่อแถบเมนู</span>}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar Rail */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-zinc-200/90 transition-[width] duration-200 ease-out select-none sticky top-12 h-[calc(100vh-48px)] overflow-hidden ${
          collapsed ? "w-14" : "w-60"
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col z-10">
            <div className="h-12 border-b border-zinc-200 px-4 flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-900">Zentura Backoffice</span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="text-zinc-400 hover:text-zinc-700 text-xs p-1"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {renderNavContent(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
