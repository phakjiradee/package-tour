"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Menu, X } from "lucide-react";
import AuthButton from "@/components/auth/AuthButton";

const navLinks = [
  { href: "/feed", label: "ฟีด" },
  { href: "/package", label: "แพ็กเกจ" },
];

function isActivePath(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function CustomerNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    ready: false,
  });
  const itemRefs = useRef({});

  // Elevate the bar once the page is scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Measure the active link so the pill indicator can slide to it.
  useEffect(() => {
    const measure = () => {
      const active = navLinks.find((link) => isActivePath(pathname, link.href));
      const el = active && itemRefs.current[active.href];
      if (el && el.offsetWidth) {
        setIndicator({
          left: el.offsetLeft,
          width: el.offsetWidth,
          ready: true,
        });
      } else {
        setIndicator((value) => ({ ...value, ready: false }));
      }
    };
    measure();
    const timer = setTimeout(measure, 150); // re-measure after web font loads
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [pathname]);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        className={`relative mx-auto flex max-w-5xl items-center gap-2 rounded-full border px-2.5 py-2 transition-all duration-300 sm:gap-3 ${
          scrolled || menuOpen
            ? "border-slate-200/70 bg-white/80 shadow-lg shadow-slate-900/5 backdrop-blur-xl"
            : "border-transparent bg-white/40 backdrop-blur-md"
        }`}
      >
        {/* Brand */}
        <Link
          href="/feed"
          onClick={() => setMenuOpen(false)}
          className="group flex shrink-0 items-center gap-2 pl-1"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm shadow-blue-500/30 transition-transform duration-300 group-hover:rotate-[18deg]">
            <Compass className="h-5 w-5" />
          </span>
          <span className="hidden text-[15px] font-bold tracking-tight text-slate-900 sm:inline">
            Package Tour
          </span>
        </Link>

        {/* Segmented nav with sliding indicator (centered, desktop only) */}
        <div className="hidden md:absolute md:left-1/2 md:top-1/2 md:block md:-translate-x-1/2 md:-translate-y-1/2">
          <div className="relative flex items-center rounded-full bg-slate-100/80 p-1">
            <span
              aria-hidden="true"
              className={`absolute top-1 bottom-1 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition-all duration-300 ease-out ${
                indicator.ready ? "opacity-100" : "opacity-0"
              }`}
              style={{ left: indicator.left, width: indicator.width }}
            />
            {navLinks.map((link) => {
              const active = isActivePath(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  ref={(node) => {
                    itemRefs.current[link.href] = node;
                  }}
                  className={`relative z-10 inline-flex h-8 items-center rounded-full px-3.5 text-sm font-medium transition-colors duration-200 sm:px-4 ${
                    active
                      ? "text-slate-900"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Auth actions (desktop) */}
        <div className="ml-auto hidden items-center md:flex">
          <AuthButton />
        </div>

        {/* Hamburger (mobile) */}
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
          className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu panel */}
      <div
        className={`absolute inset-x-0 top-full origin-top px-3 pt-2 transition-all duration-200 ease-out md:hidden ${
          menuOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/70 bg-white/95 p-2 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
          {navLinks.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="my-2 h-px bg-slate-100" />

          <div className="flex flex-col gap-2 p-1">
            <AuthButton fullWidth />
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {menuOpen ? (
        <button
          type="button"
          aria-label="ปิดเมนู"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 -z-10 h-screen w-screen cursor-default bg-slate-900/20 backdrop-blur-sm md:hidden"
        />
      ) : null}
    </header>
  );
}
