"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bus, ChevronDown, Compass, LogOut, Menu, PanelLeft } from "lucide-react";
import { clearSupplierAuth, getSupplierAuth } from "@/lib/supplier-auth";

export default function SupplierLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setUser(getSupplierAuth()), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (pathname === "/supplier/login") return children;

  const signOut = () => {
    clearSupplierAuth();
    setAccountOpen(false);
    router.push("/supplier/login");
    router.refresh();
  };

  const navigation = (isMobile) => (
    <div className="flex h-full flex-col justify-between overflow-hidden p-2 select-none">
      <nav className="thin-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-0.5 py-1" aria-label="เมนู Supplier">
        {(isMobile || !collapsed) && (
          <p className="px-2.5 pb-1 text-[10px] font-semibold tracking-wider text-zinc-400">WORKSPACE</p>
        )}
        <Link
          href="/supplier"
          title="เที่ยวรถบัส"
          onClick={() => setMobileOpen(false)}
          className={`group flex items-center rounded-md text-xs font-semibold text-zinc-900 shadow-2xs bg-zinc-100 ${
            !isMobile && collapsed ? "mx-auto size-8.5 justify-center" : "justify-between gap-2.5 px-2.5 py-1.5"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <Bus size={15} className="shrink-0" />
            {(isMobile || !collapsed) && <span className="truncate">เที่ยวรถบัส</span>}
          </span>
          {(isMobile || !collapsed) && <span className="size-1 shrink-0 rounded-full bg-blue-600" />}
        </Link>
      </nav>

      {!isMobile && (
        <div className="mt-auto border-t border-zinc-200/80 px-0.5 pt-2">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"}
            className={`flex items-center gap-2 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer ${
              collapsed ? "mx-auto size-8.5 justify-center" : "w-full text-xs font-medium"
            }`}
          >
            <PanelLeft size={16} className="shrink-0" />
            {!collapsed && <span>ย่อแถบเมนู</span>}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8f9] font-sans text-zinc-900 antialiased">
      <header className="sticky top-0 z-40 flex h-12 w-full shrink-0 items-center justify-between border-b border-zinc-200/90 bg-white px-3 select-none sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="เปิดเมนู"
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden"
          >
            <Menu size={16} />
          </button>
          <span className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#0051c8] text-white shadow-2xs">
              <Compass size={15} />
            </span>
            <span className="hidden flex-col text-left leading-tight sm:flex">
              <span className="text-xs font-bold tracking-tight text-zinc-900">Zentura</span>
              <span className="text-[10px] font-medium text-zinc-400">Supplier</span>
            </span>
          </span>
          <div className="hidden items-center gap-2 border-l border-zinc-200 pl-3 text-xs md:flex">
            <span className="font-semibold text-zinc-900">เที่ยวรถบัส</span>
            <span className="text-zinc-400">· Trips</span>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((value) => !value)}
            aria-expanded={accountOpen}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-zinc-200/90 bg-white px-2 text-xs font-medium text-zinc-700 shadow-2xs transition hover:bg-zinc-50 cursor-pointer"
          >
            <span className="grid size-5 place-items-center rounded bg-[#0051c8] text-[10px] font-bold text-white uppercase">
              {(user?.name || "SP").slice(0, 2)}
            </span>
            <span className="hidden font-semibold text-zinc-800 sm:inline">{user?.name || "Supplier"}</span>
            <span className="hidden items-center rounded bg-blue-50 px-1.5 py-0.2 text-[9px] font-semibold text-blue-700 md:inline-flex">SUPPLIER</span>
            <ChevronDown size={12} className="text-zinc-400" />
          </button>
          {accountOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-zinc-200/90 bg-white p-1.5 shadow-xl shadow-zinc-900/10">
              <div className="border-b border-zinc-100 px-3 py-2">
                <p className="truncate text-xs font-semibold text-zinc-900">{user?.name || "Supplier"}</p>
                <p className="mt-0.5 truncate text-[11px] text-zinc-400">{user?.email || user?.partner?.name || "พาร์ทเนอร์"}</p>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="mt-1 flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
              >
                <LogOut size={14} />ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="relative flex min-h-[calc(100vh-48px)] flex-1">
        <aside className={`sticky top-12 hidden h-[calc(100vh-48px)] shrink-0 overflow-hidden border-r border-zinc-200/90 bg-white transition-[width] duration-200 ease-out lg:flex lg:flex-col ${collapsed ? "w-14" : "w-60"}`}>
          {navigation(false)}
        </aside>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" aria-label="ปิดเมนู" onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
            <div className="fixed inset-y-0 left-0 z-10 flex w-64 flex-col bg-white shadow-xl">
              <div className="flex h-12 items-center justify-between border-b border-zinc-200 px-4">
                <span className="text-xs font-bold text-zinc-900">Zentura Supplier</span>
                <button type="button" onClick={() => setMobileOpen(false)} aria-label="ปิดเมนู" className="p-1 text-xs text-zinc-400 hover:text-zinc-700">✕</button>
              </div>
              <div className="flex-1 overflow-hidden">{navigation(true)}</div>
            </div>
          </div>
        )}
        <main className="min-w-0 w-full flex-1 p-4 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
