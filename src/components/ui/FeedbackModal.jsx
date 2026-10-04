"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export default function FeedbackModal({
  isOpen,
  onClose,
  type = "success", // "success" | "error" | "warning" | "info"
  title,
  message,
  confirmText = "ตกลง",
  cancelText = null,
  onConfirm = null,
  onCancel = null,
  confirmBtnClass = null,
  cancelBtnClass = null,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        if (onCancel) onCancel();
        else onClose();
      } else if (e.key === "Enter") {
        if (onConfirm) onConfirm();
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onConfirm, onCancel]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    else onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else onClose();
  };

  const config = {
    success: {
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-600",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs border-0 outline-none ring-0 focus:ring-0",
      defaultTitle: "สำเร็จเรียบร้อย!",
    },
    error: {
      icon: AlertCircle,
      iconBg: "bg-rose-50 text-rose-600",
      btnClass: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs border-0 outline-none ring-0 focus:ring-0",
      defaultTitle: "เกิดข้อผิดพลาด",
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-amber-50 text-amber-700",
      btnClass: "bg-amber-700 hover:bg-amber-800 text-white shadow-xs border-0 outline-none ring-0 focus:ring-0",
      defaultTitle: "แจ้งเตือนข้อมูล",
    },
    info: {
      icon: Info,
      iconBg: "bg-blue-50 text-blue-600",
      btnClass: "bg-blue-600 hover:bg-blue-700 text-white shadow-xs border-0 outline-none ring-0 focus:ring-0",
      defaultTitle: "ข้อมูลเพิ่มเติม",
    },
  }[type] || {
    icon: CheckCircle2,
    iconBg: "bg-emerald-50 text-emerald-600",
    btnClass: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs border-0 outline-none ring-0 focus:ring-0",
    defaultTitle: "แจ้งเตือน",
  };

  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleCancel}
      />

      {/* Dialog Box */}
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 transition-all duration-300 transform scale-100 text-center animate-in fade-in zoom-in-95">
        {/* Close Button Top-Right */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          title="ปิด"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Animated Icon Container */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.iconBg}`}>
            <IconComponent className="h-6 w-6 stroke-[2.25]" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          {title || config.defaultTitle}
        </h3>

        {/* Message */}
        {message && (
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            {message}
          </p>
        )}

        {/* Action Buttons */}
        <div className={`mt-6 flex items-center gap-2.5 ${cancelText ? "grid grid-cols-2" : "flex flex-col"}`}>
          {cancelText && (
            <button
              type="button"
              onClick={handleCancel}
              className={`w-full rounded-xl py-2.5 px-4 text-sm font-semibold transition-colors cursor-pointer ${
                cancelBtnClass || "border border-slate-300 bg-slate-100 text-slate-800 shadow-xs hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={`w-full rounded-xl py-2.5 px-4 text-sm font-bold shadow-sm transition-all active:scale-[0.98] outline-none border-0 ring-0 focus:outline-none focus:ring-0 cursor-pointer ${
              confirmBtnClass || config.btnClass
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
