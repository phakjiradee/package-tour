"use client";

import React, { useState, useEffect, useSyncExternalStore, useRef } from "react";
import { createPortal } from "react-dom";
import {
  User,
  Users,
  UserPlus,
  CreditCard,
  Phone,
  X,
  Check,
  Search,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import authService from "@/service/auth";
import { UserAvatar } from "@/components/package/CollaboratorBox";

const emptySubscribe = () => () => {};

// ฟังก์ชันจัดรูปแบบเบอร์โทรศัพท์ (0xx-xxx-xxxx) ใส่ได้เฉพาะตัวเลข
export const formatPhoneNumber = (value) => {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "").slice(0, 10);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

// ฟังก์ชันจัดรูปแบบเลขบัตร ปชช. (x-xxxx-xxxxx-xx-x) หรือ Passport
export const formatIdCardOrPassport = (value) => {
  if (!value) return "";
  if (/[a-zA-Z]/.test(value)) {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  }
  const cleaned = value.replace(/\D/g, "").slice(0, 13);
  if (cleaned.length <= 1) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 1)}-${cleaned.slice(1)}`;
  if (cleaned.length <= 10) return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5)}`;
  if (cleaned.length <= 12) return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10)}`;
  return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned.slice(12)}`;
};

export default function AddParticipantModal({
  isOpen,
  onClose,
  onAddManual,
  onAddCollabs,
  existingTravelers = [],
  currentUser = null,
}) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // Choice mode: "manual" (ข้อมูลทั่วไป) or "collab" (เพื่อน Collab แบบ Multi-select)
  const [addType, setAddType] = useState("manual");

  // Manual Form State
  const [manualData, setManualData] = useState({
    passenger_type: "adult",
    title: "นาย",
    full_name: "",
    id_card_or_passport: "",
    date_of_birth: "",
    phone: "",
  });

  // Collab Multi-select State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);


  // Focus search input when switching to collab
  useEffect(() => {
    if (isOpen && addType === "collab") {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, addType]);

  // Load initial users or search users
  useEffect(() => {
    if (!isOpen || addType !== "collab") return;

    let ignore = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await authService.searchUsers(searchQuery);
        if (!ignore && res?.users) {
          setSearchResults(res.users);
        }
      } catch (err) {
        console.error("Failed to search users:", err);
      } finally {
        if (!ignore) setIsSearching(false);
      }
    }, 200);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [searchQuery, isOpen, addType]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !isMounted) return null;

  // Set of existing user IDs in trip
  const existingUserIds = new Set();
  if (currentUser?.id) existingUserIds.add(currentUser.id);
  existingTravelers.forEach((t) => {
    if (t.collab_user?.id) existingUserIds.add(t.collab_user.id);
  });

  // Toggle user in multi-select
  const handleToggleUser = (user) => {
    if (existingUserIds.has(user.id)) return; // Already added

    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Submit Manual Participant
  const handleSubmitManual = (e) => {
    e.preventDefault();
    if (!manualData.full_name?.trim() || !manualData.id_card_or_passport?.trim() || !manualData.date_of_birth) {
      alert("กรุณากรอกชื่อ เลขบัตร/Passport และวันเกิดให้ครบ");
      return;
    }
    if (onAddManual) {
      onAddManual(manualData);
    }
    onClose();
  };

  // Submit Selected Collab Users
  const handleSubmitCollab = () => {
    if (selectedUsers.length === 0) return;
    if (onAddCollabs) {
      onAddCollabs(selectedUsers);
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                เพิ่มผู้เข้าร่วมทัวร์
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เลือกรูปแบบที่ต้องการเพิ่ม: ข้อมูลทั่วไป หรือ เพื่อน Collab
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Choice Tabs: ข้อมูลทั่วไป VS เพื่อน Collab */}
        <div className="p-3 bg-slate-50/80 border-b border-slate-100">
          <div className="flex rounded-xl bg-slate-200/70 p-1 gap-1">
            <button
              type="button"
              onClick={() => setAddType("manual")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                addType === "manual"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>ข้อมูลทั่วไป (Manual)</span>
            </button>

            <button
              type="button"
              onClick={() => setAddType("collab")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                addType === "collab"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>เพื่อน Collab (Multi-select)</span>
              {selectedUsers.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                  {selectedUsers.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Option 1: Manual Form */}
        {addType === "manual" && (
          <form
            onSubmit={handleSubmitManual}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* ประเภทผู้เดินทาง และ คำนำหน้าชื่อ (grid-cols-2) */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* ประเภทผู้เดินทาง (ผู้ใหญ่ / เด็ก) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ประเภทผู้เดินทาง <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={manualData.passenger_type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setManualData((prev) => ({
                        ...prev,
                        passenger_type: newType,
                        title: newType === "child" ? "เด็กชาย" : "นาย",
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition-all cursor-pointer"
                  >
                    <option value="adult">ผู้ใหญ่ (Adult)</option>
                    <option value="child">เด็ก (Child)</option>
                  </select>
                </div>

                {/* คำนำหน้าชื่อ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    คำนำหน้าชื่อ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={manualData.title}
                    onChange={(e) =>
                      setManualData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition-all cursor-pointer"
                  >
                    {manualData.passenger_type === "child" ? (
                      <>
                        <option value="เด็กชาย">เด็กชาย (ด.ช.)</option>
                        <option value="เด็กหญิง">เด็กหญิง (ด.ญ.)</option>
                      </>
                    ) : (
                      <>
                        <option value="นาย">นาย</option>
                        <option value="นาง">นาง</option>
                        <option value="นางสาว">นางสาว</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* ชื่อ - นามสกุล */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น สมชาย ใจดี หรือ SOMCHAI JAIDEE"
                    value={manualData.full_name}
                    onChange={(e) =>
                      setManualData((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              {/* เลขบัตร ปชช. / Passport */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    เลขบัตร ปชช. / Passport (สำหรับทำประกัน)
                  </label>
                  {manualData.id_card_or_passport && (
                    <span className={`text-[10px] font-medium ${
                      manualData.id_card_or_passport.replace(/\D/g, "").length === 13
                        ? "text-emerald-600 font-bold"
                        : "text-slate-400"
                    }`}>
                      {manualData.id_card_or_passport.replace(/\D/g, "").length > 0 && !/[a-zA-Z]/.test(manualData.id_card_or_passport)
                        ? `${manualData.id_card_or_passport.replace(/\D/g, "").length}/13 หลัก`
                        : "Passport"}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <CreditCard className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={17}
                    placeholder="เลขบัตร 13 หลัก เช่น 1-2345-67890-12-3 หรือ Passport"
                    value={manualData.id_card_or_passport}
                    onChange={(e) =>
                      setManualData((prev) => ({
                        ...prev,
                        id_card_or_passport: formatIdCardOrPassport(e.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              {/* วันเกิดสำหรับตรวจสิทธิ์ประกัน */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  วันเกิดตามเอกสาร <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={manualData.date_of_birth}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setManualData((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {/* เบอร์โทรศัพท์ */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    เบอร์โทรศัพท์ (ไม่บังคับ)
                  </label>
                  {manualData.phone && (
                    <span className={`text-[10px] font-medium ${
                      manualData.phone.replace(/\D/g, "").length === 10
                        ? "text-emerald-600 font-bold"
                        : "text-slate-400"
                    }`}>
                      {manualData.phone.replace(/\D/g, "").length}/10 หลัก
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="เช่น 081-234-5678"
                    value={manualData.phone}
                    onChange={(e) =>
                      setManualData((prev) => ({
                        ...prev,
                        phone: formatPhoneNumber(e.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all"
              >
                <Check className="h-3.5 w-3.5" />
                <span>เพิ่มผู้เดินทางท่านนี้</span>
              </button>
            </div>
          </form>
        )}

        {/* Option 2: Collab Multi-select */}
        {addType === "collab" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Search Bar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ค้นหาเพื่อนร่วมทริป (Multi-select)
                </label>
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="พิมพ์ชื่อ (@username) หรืออีเมล เช่น pooh, ormsin..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  คลิกที่รายชื่อเพื่อเลือก สามารถเลือกเพื่อนได้หลายคนพร้อมกัน
                </p>
              </div>

              {/* Selected Chips */}
              {selectedUsers.length > 0 && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900 mb-2">
                    <span>เลือกแล้ว ({selectedUsers.length} ท่าน)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedUsers([])}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      ล้างทั้งหมด
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUsers.map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200 shadow-2xs"
                      >
                        <UserAvatar user={u} size="xs" />
                        <span>@{u.name}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleUser(u)}
                          className="hover:text-rose-500 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Users List */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  <span>รายชื่อเพื่อนในระบบ</span>
                  {isSearching && (
                    <span className="flex items-center gap-1 text-indigo-600 lowercase font-normal">
                      <Loader2 className="h-3 w-3 animate-spin" /> กำลังค้นหา...
                    </span>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      {isSearching
                        ? "กำลังค้นหารายชื่อเพื่อน..."
                        : searchQuery
                        ? "ไม่พบผู้ใช้ที่ตรงกับคำค้นหา"
                        : "ไม่มีข้อมูลผู้ใช้ในระบบ"}
                    </div>
                  ) : (
                    searchResults.map((user) => {
                      const isAlreadyInTrip = existingUserIds.has(user.id);
                      const isSelected = selectedUsers.some(
                        (u) => u.id === user.id,
                      );

                      return (
                        <div
                          key={user.id}
                          onClick={() =>
                            !isAlreadyInTrip && handleToggleUser(user)
                          }
                          className={`flex items-center justify-between p-3 transition-colors ${
                            isAlreadyInTrip
                              ? "bg-slate-50 opacity-60 cursor-not-allowed"
                              : isSelected
                              ? "bg-indigo-50/70 cursor-pointer"
                              : "hover:bg-slate-50 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox */}
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                                isAlreadyInTrip
                                  ? "bg-slate-200 border-slate-300 text-slate-400"
                                  : isSelected
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {(isSelected || isAlreadyInTrip) && (
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                              )}
                            </div>

                            <UserAvatar user={user} size="sm" />

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                @{user.name}
                              </p>
                              {user.email && (
                                <p className="text-[11px] text-slate-400 truncate">
                                  {user.email}
                                </p>
                              )}
                            </div>
                          </div>

                          {isAlreadyInTrip ? (
                            <span className="text-[11px] font-semibold text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded-md shrink-0">
                              อยู่ในทริปแล้ว
                            </span>
                          ) : isSelected ? (
                            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> เลือกแล้ว
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400 shrink-0">
                              + เลือก
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                disabled={selectedUsers.length === 0}
                onClick={handleSubmitCollab}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Check className="h-3.5 w-3.5" />
                <span>
                  เพิ่มเพื่อนที่เลือก ({selectedUsers.length} ท่าน)
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
