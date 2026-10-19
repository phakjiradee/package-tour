"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Shield,
  UserRound,
} from "lucide-react";
import {
  clearBackofficeAuth,
  getBackofficeAuth,
  getBackofficeToken,
  setBackofficeAuth,
} from "@/lib/backoffice-auth";
import { authService } from "@/service/auth";
import SearchableSelect from "./SearchableSelect";

/**
 * Backoffice Navbar User Profile Dropdown Menu
 */
export function UserDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    let isMounted = true;
    authService
      .getMe()
      .then((res) => {
        if (isMounted && res?.user) {
          setUser(res.user);
          const currentToken = getBackofficeToken();
          if (currentToken) {
            setBackofficeAuth(res.user, currentToken);
          }
        }
      })
      .catch(() => {
        if (isMounted) setUser(getBackofficeAuth());
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = () => {
    clearBackofficeAuth();
    setOpen(false);
    router.push("/backoffice/login");
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const name = user?.name || "Admin User";
  const email = user?.email || "admin@zentura.com";
  const role =
    typeof user?.role === "object"
      ? user?.role?.name || "Admin"
      : user?.role || user?.position || user?.Role?.name || "Admin";
  const initials = (name || "AD").slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 items-center gap-2 rounded-md border border-zinc-200/90 bg-white px-2 text-xs font-medium text-zinc-700 shadow-2xs transition hover:bg-zinc-50 cursor-pointer"
      >
        <span className="grid h-5 w-5 place-items-center rounded bg-[#0051c8] text-[10px] font-bold text-white uppercase">
          {initials}
        </span>
        <span className="hidden sm:inline font-semibold text-zinc-800">
          {name}
        </span>
        <span className="hidden md:inline-flex items-center rounded bg-blue-50 px-1.5 py-0.2 text-[9px] font-semibold text-blue-700 uppercase">
          {role}
        </span>
        <ChevronDown className="h-3 w-3 text-zinc-400" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-zinc-200/90 bg-white p-1.5 shadow-xl shadow-zinc-900/10">
          <div className="px-3 py-2 border-b border-zinc-100">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold text-zinc-900">
                {name}
              </p>
              <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 uppercase">
                {role}
              </span>
            </div>
            <p className="truncate text-[11px] text-zinc-400 mt-0.5">
              {email}
            </p>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/backoffice/profile");
              }}
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 cursor-pointer transition-colors"
            >
              <UserRound className="h-3.5 w-3.5 text-zinc-400" />
              <span>โปรไฟล์ของฉัน</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/backoffice/employee");
              }}
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 cursor-pointer transition-colors"
            >
              <UserRound className="h-3.5 w-3.5 text-zinc-400" />
              <span>ข้อมูลพนักงาน</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/backoffice/position");
              }}
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 cursor-pointer transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-zinc-400" />
              <span>สิทธิ์การใช้งาน</span>
            </button>
          </div>

          <div className="border-t border-zinc-100 pt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Specialized Guide Assignment Dropdown
 * Encapsulates guide conflict checks, availability badges, and formatting,
 * removing 40+ lines of overhead code from form pages.
 */
export function GuideDropdown({
  value,
  onChange,
  onSelect,
  guidesList = [],
  assignedGuides = [],
  currentIndex = -1,
  checkConflict,
  packageId,
  error = false,
  disabled = false,
  placeholder = "-- เลือกไกด์นำเที่ยว --",
  searchPlaceholder = "ค้นหาชื่อไกด์, เบอร์โทร...",
  className = "",
}) {
  const options = useMemo(() => {
    return (guidesList || []).map((emp) => {
      const isSelectedInOther = (assignedGuides || []).some(
        (g, gIdx) =>
          gIdx !== currentIndex && String(g?.emp_id) === String(emp.id)
      );
      const conflict = checkConflict
        ? checkConflict(emp, packageId)
        : null;
      const isDisabled = isSelectedInOther || !!conflict;

      let badge = "ว่าง";
      let badgeVariant = "success";
      let disabledReason = "";

      if (isSelectedInOther) {
        badge = "เลือกแล้ว";
        badgeVariant = "warning";
        disabledReason = "เลือกแล้วในรายการนี้";
      } else if (conflict) {
        badge = "ติดงาน";
        badgeVariant = "danger";
        disabledReason = `ติดงานแพ็กเกจ "${conflict.package_name}"`;
      }

      return {
        value: emp.id,
        label: emp.name,
        subLabel: emp.phone ? `โทร: ${emp.phone}` : emp.email || "",
        badge,
        badgeVariant,
        disabled: isDisabled,
        disabledReason,
        keywords: [
          emp.name,
          emp.phone || "",
          emp.email || "",
          emp.position || "",
        ],
        raw: emp,
      };
    });
  }, [guidesList, assignedGuides, currentIndex, checkConflict, packageId]);

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      error={error}
      disabled={disabled}
      className={className}
      noOptionsMessage="ไม่พบพนักงานที่มีบทบาท 'ไกด์' ในระบบ"
    />
  );
}

/**
 * Universal Dropdown Component for Forms and Navbar
 * - If guide props (guidesList or type="guide") are passed, renders GuideDropdown.
 * - If form props (options, value, onChange, placeholder) are passed, renders SearchableSelect.
 * - If called without form props (e.g. in BackofficeNavbar), renders UserDropdown.
 */
export default function Dropdown(props) {
  if (props.type === "guide" || props.guidesList !== undefined) {
    return <GuideDropdown {...props} />;
  }

  if (
    props.options ||
    props.value !== undefined ||
    props.name ||
    props.placeholder ||
    props.searchPlaceholder ||
    props.searchable !== undefined
  ) {
    return <SearchableSelect {...props} />;
  }

  return <UserDropdown {...props} />;
}

Dropdown.Guide = GuideDropdown;
Dropdown.Select = SearchableSelect;
Dropdown.User = UserDropdown;

export { SearchableSelect };

