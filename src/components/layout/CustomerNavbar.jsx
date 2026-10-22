"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import AuthButton from "@/components/auth/AuthButton";

const navLinks = [
  { href: "/feed", label: "Feeds" },
  { href: "/package", label: "Products" },
  // { href: "/package?tab=promotion", label: "Promotion" },
];

function isActivePath(pathname, href) {
  const baseHref = href.split("?")[0];
  return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
}

export default function CustomerNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Elevate the bar once the page is scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const isHome = pathname === "/" || pathname === "/feed";
  const isHero = isHome && !scrolled;

  return (
    <header
      className={`${
        isHome
          ? scrolled
            ? "fixed top-0 inset-x-0"
            : "absolute top-0 inset-x-0"
          : "sticky top-0"
      } z-40 w-full transition-all duration-300 ${
        isHero
          ? "border-b border-white/10 bg-transparent"
          : "border-b border-slate-200/70 bg-white/85 shadow-xs backdrop-blur-xl"
      }`}
    >
      <nav className="relative flex items-center justify-between w-full container mx-auto px-4 sm:px-6 lg:px-8 py-3.5 transition-all duration-300">
        {/* Brand */}
        <Link
          href="/feed"
          onClick={() => setMenuOpen(false)}
          className="group flex shrink-0 flex-col"
        >
          <span
            className={`text-xl sm:text-2xl font-black tracking-tight leading-none transition-colors ${
              isHero ? "text-white" : "text-slate-900"
            }`}
          >
            Zentura
          </span>
          <span
            className={`text-[10px] sm:text-[11px] font-normal tracking-wide mt-1 transition-colors ${
              isHero ? "text-white/70" : "text-slate-500"
            }`}
          >
            Zentura.com | Thailand tour packages
          </span>
        </Link>

        {/* Center Nav Links matching sample image */}
        <div className="hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm tracking-wide transition-all duration-200 ${
                  active
                    ? isHero
                      ? "text-white font-bold"
                      : "text-blue-600 font-bold"
                    : isHero
                    ? "text-white/75 hover:text-white font-medium"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Auth actions (desktop) */}
        <div className="hidden items-center md:flex">
          <AuthButton isHero={isHero} />
        </div>

        {/* Hamburger (mobile) */}
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
          className={`ml-auto grid h-10 w-10 place-items-center rounded-xl border shadow-sm transition md:hidden ${
            isHero
              ? "border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu panel */}
      <div
        className={`absolute inset-x-0 top-full origin-top border-b border-slate-200/70 bg-white/95 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur-xl transition-all duration-200 ease-out md:hidden ${
          menuOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="w-full container mx-auto flex flex-col space-y-1">
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
