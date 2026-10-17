"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  User,
  CreditCard,
  Phone,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Lock,
  Crown,
  UserCheck,
  Trash2,
} from "lucide-react";
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

function TravelerForm({
  travelerIndex,
  traveler,
  isCollabPassenger,
  collabUser,
  currentUser,
  contactName,
  totalTravelers,
  hasPrev,
  hasNext,
  onClose,
  onSaveTraveler,
  onDeleteTraveler,
  onSwitchTab,
}) {
  const initialName = isCollabPassenger
    ? collabUser?.name || traveler?.full_name || ""
    : traveler?.full_name || "";

  const [formData, setFormData] = useState({
    passenger_type: traveler?.passenger_type || "adult",
    title: traveler?.title || "นาย",
    full_name: initialName,
    id_card_or_passport: formatIdCardOrPassport(traveler?.id_card_or_passport || ""),
    phone: formatPhoneNumber(traveler?.phone || ""),
  });

  const isFirst = travelerIndex === 0;

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAndClose = () => {
    if (onSaveTraveler) {
      onSaveTraveler(travelerIndex, formData);
    }
    onClose();
  };

  const handleSaveAndNext = () => {
    if (onSaveTraveler) {
      onSaveTraveler(travelerIndex, formData);
    }
    if (hasNext && onSwitchTab) {
      onSwitchTab(travelerIndex + 1);
    }
  };

  return (
    <>
      {/* Modal Form Body */}
      <div className="p-5 sm:p-6 overflow-y-auto space-y-4.5 flex-1">
        {/* Collab Banner (if locked by collab) */}
        {isCollabPassenger && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5 flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {collabUser ? (
                <UserAvatar user={collabUser} size="sm" showCrown={isFirst} />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Lock className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
            <div className="text-xs text-indigo-950 min-w-0">
              <p className="font-bold flex items-center gap-1.5 truncate">
                {isFirst ? (
                  <>
                    <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>ผู้จองหลัก ({currentUser?.name || contactName || "คุณ"})</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span>เพื่อน Collab: @{collabUser?.name}</span>
                  </>
                )}
              </p>
              <p className="text-indigo-700 text-[11px] mt-0.5">
                {isFirst
                  ? "ข้อมูลชื่อดึงมาจากบัญชีของคุณ สามารถระบุเลขบัตร ปชช. / Passport เพิ่มเติมได้"
                  : "ชื่อผู้ร่วมเดินทางล็อกตามบัญชีเพื่อน Collab สามารถระบุคำนำหน้าและเลขบัตรได้"}
              </p>
            </div>
          </div>
        )}

        {/* ประเภทผู้เดินทาง และ คำนำหน้าชื่อ (grid-cols-2) */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Field 0: ประเภทผู้เดินทาง */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ประเภทผู้เดินทาง <span className="text-rose-500">*</span>
            </label>
            {!isFirst && !isCollabPassenger ? (
              <select
                value={formData.passenger_type || "adult"}
                onChange={(e) => {
                  const newType = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    passenger_type: newType,
                    title:
                      newType === "child" &&
                      !["เด็กชาย", "เด็กหญิง"].includes(prev.title)
                        ? "เด็กชาย"
                        : newType === "adult" &&
                          ["เด็กชาย", "เด็กหญิง"].includes(prev.title)
                        ? "นาย"
                        : prev.title,
                  }));
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition-all cursor-pointer"
              >
                <option value="adult">ผู้ใหญ่ (Adult)</option>
                <option value="child">เด็ก (Child)</option>
              </select>
            ) : (
              <div className="h-10.5 flex items-center px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-indigo-700">
                ผู้ใหญ่ (Adult)
              </div>
            )}
          </div>

          {/* Field 1: คำนำหน้าชื่อ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              คำนำหน้าชื่อ <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition-all cursor-pointer"
            >
              {formData.passenger_type === "child" ? (
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

        {/* Field 2: ชื่อ - นามสกุล */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            ชื่อ - นามสกุล (ภาษาไทย หรือ อังกฤษตามเอกสารเดินทาง){" "}
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="เช่น สมชาย ใจดี หรือ SOMCHAI JAIDEE"
              value={formData.full_name}
              onChange={(e) => handleFieldChange("full_name", e.target.value)}
              disabled={isCollabPassenger}
              className={`w-full rounded-xl border py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium focus:outline-none transition-all ${
                isCollabPassenger
                  ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed select-none font-semibold"
                  : "bg-white text-slate-800 border-slate-200 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100"
              }`}
            />
          </div>
          {isCollabPassenger && (
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              ล็อกตามบัญชีผู้ใช้งานระบบ Collab
            </p>
          )}
        </div>

        {/* Field 3: เลขบัตร ปชช. / Passport */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">
              เลขประจำตัวประชาชน / Passport <span className="text-rose-500">*</span>
            </label>
            {formData.id_card_or_passport && (
              <span className={`text-[10px] font-medium ${
                formData.id_card_or_passport.replace(/\D/g, "").length === 13
                  ? "text-emerald-600 font-bold"
                  : "text-slate-400"
              }`}>
                {formData.id_card_or_passport.replace(/\D/g, "").length > 0 && !/[a-zA-Z]/.test(formData.id_card_or_passport)
                  ? `${formData.id_card_or_passport.replace(/\D/g, "").length}/13 หลัก`
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
              value={formData.id_card_or_passport}
              onChange={(e) =>
                handleFieldChange(
                  "id_card_or_passport",
                  formatIdCardOrPassport(e.target.value),
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition-all"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            ข้อมูลนี้จำเป็นต้องใช้ในการออกตั๋วโดยสารและลงทะเบียนประกันอุบัติเหตุ
          </p>
        </div>

        {/* Field 4: เบอร์โทรศัพท์ (ไม่บังคับ) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700">
              เบอร์โทรศัพท์ (ไม่บังคับ)
            </label>
            {formData.phone && (
              <span className={`text-[10px] font-medium ${
                formData.phone.replace(/\D/g, "").length === 10
                  ? "text-emerald-600 font-bold"
                  : "text-slate-400"
              }`}>
                {formData.phone.replace(/\D/g, "").length}/10 หลัก
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
              value={formData.phone}
              onChange={(e) =>
                handleFieldChange("phone", formatPhoneNumber(e.target.value))
              }
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-3 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isFirst && onDeleteTraveler && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `คุณต้องการลบข้อมูลผู้เดินทางท่านที่ ${
                      travelerIndex + 1
                    } ออกจากทริปหรือไม่?`,
                  )
                ) {
                  onDeleteTraveler(travelerIndex);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>ลบผู้เดินทาง</span>
            </button>
          )}

          {hasPrev && (
            <button
              type="button"
              onClick={() => onSwitchTab(travelerIndex - 1)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">ท่านก่อนหน้า</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            ปิด
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasNext && (
            <button
              type="button"
              onClick={handleSaveAndNext}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
            >
              <span>บันทึก & ท่านถัดไป</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAndClose}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          >
            <Check className="h-3.5 w-3.5" />
            <span>บันทึกข้อมูล</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default function TravelerModal({
  isOpen,
  onClose,
  travelerIndex,
  travelers = [],
  currentUser = null,
  contactName = "",
  onSaveTraveler,
  onDeleteTraveler,
  onSelectTravelerIndex,
}) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

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

  if (!isOpen || travelerIndex === null || !travelers[travelerIndex] || !isMounted) {
    return null;
  }

  const currentTraveler = travelers[travelerIndex];
  const isFirst = travelerIndex === 0;
  const isCollabPassenger =
    Boolean(currentTraveler.collab_user) || (isFirst && Boolean(currentUser));
  const collabUser = isFirst ? currentUser : currentTraveler.collab_user;

  const totalTravelers = travelers.length;
  const hasNext = travelerIndex < totalTravelers - 1;
  const hasPrev = travelerIndex > 0;

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
              <User className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  ข้อมูลผู้เดินทางท่านที่ {travelerIndex + 1}
                </h3>
                {isFirst ? (
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-100">
                    ผู้ติดต่อหลัก
                  </span>
                ) : isCollabPassenger ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-100 flex items-center gap-1">
                    <UserCheck className="h-3 w-3" /> เพื่อน Collab
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
                    {currentTraveler.passenger_type === "child"
                      ? "เด็ก (Child)"
                      : "ผู้ใหญ่ (Adult)"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                กรอกข้อมูลส่วนบุคคลเพื่อการออกเอกสารและประกันภัยการเดินทาง
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

        {/* Traveler Switcher Tabs (if multiple travelers) */}
        {totalTravelers > 1 && (
          <div className="px-5 pt-3 pb-2 border-b border-slate-100 bg-slate-50/70 overflow-x-auto no-scrollbar flex items-center gap-1.5">
            {travelers.map((t, idx) => {
              const active = idx === travelerIndex;
              const isFilled =
                Boolean(t.full_name?.trim()) && Boolean(t.id_card_or_passport?.trim());

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectTravelerIndex && onSelectTravelerIndex(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100"
                  }`}
                >
                  <span>ท่านที่ {idx + 1}</span>
                  {idx === 0 ? (
                    <span className="text-[10px] opacity-80">(หลัก)</span>
                  ) : t.passenger_type === "child" ? (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-1 rounded">
                      เด็ก
                    </span>
                  ) : null}
                  {t.collab_user && (
                    <span className="text-[10px] text-indigo-500 font-normal">
                      @{t.collab_user.name}
                    </span>
                  )}
                  {isFilled && (
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                        active ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Form content with key so it resets correctly per traveler without useEffect setState */}
        <TravelerForm
          key={travelerIndex}
          travelerIndex={travelerIndex}
          traveler={currentTraveler}
          isCollabPassenger={isCollabPassenger}
          collabUser={collabUser}
          currentUser={currentUser}
          contactName={contactName}
          totalTravelers={totalTravelers}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onClose={onClose}
          onSaveTraveler={onSaveTraveler}
          onDeleteTraveler={onDeleteTraveler}
          onSwitchTab={onSelectTravelerIndex}
        />
      </div>
    </div>,
    document.body,
  );
}
