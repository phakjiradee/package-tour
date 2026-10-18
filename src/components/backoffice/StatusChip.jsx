"use client";

import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Circle,
  HelpCircle,
} from "lucide-react";

const TONE_STYLES = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  warning: "bg-amber-50 text-amber-700 border-amber-200/80",
  danger: "bg-rose-50 text-rose-700 border-rose-200/80",
  info: "bg-sky-50 text-sky-700 border-sky-200/80",
  purple: "bg-purple-50 text-purple-700 border-purple-200/80",
  neutral: "bg-zinc-100 text-zinc-600 border-zinc-200/80",
};

export default function StatusChip({
  status,
  label,
  tone = "neutral",
  icon: CustomIcon,
  size = "sm",
  className = "",
}) {
  // Derive default tone & label if standard booking/order status
  let resolvedLabel = label || status;
  let resolvedTone = tone;
  let ResolvedIcon = CustomIcon;

  if (status === "CONFIRMED" || status === "PAID" || status === "success" || status === "active") {
    resolvedTone = "success";
    ResolvedIcon = ResolvedIcon || CheckCircle2;
    if (!label) resolvedLabel = status === "CONFIRMED" ? "ยืนยันแล้ว" : "ชำระเงินแล้ว";
  } else if (status === "PENDING_PAYMENT" || status === "pending") {
    resolvedTone = "warning";
    ResolvedIcon = ResolvedIcon || Clock;
    if (!label) resolvedLabel = "รอชำระเงิน";
  } else if (status === "AWAITING_VERIFICATION") {
    resolvedTone = "info";
    ResolvedIcon = ResolvedIcon || Clock;
    if (!label) resolvedLabel = "รอตรวจสอบ";
  } else if (status === "CANCELLED" || status === "canceled" || status === "failed") {
    resolvedTone = "danger";
    ResolvedIcon = ResolvedIcon || XCircle;
    if (!label) resolvedLabel = "ยกเลิกแล้ว";
  } else if (status === "DRAFT" || status === "draft") {
    resolvedTone = "neutral";
    ResolvedIcon = ResolvedIcon || Circle;
    if (!label) resolvedLabel = "ฉบับร่าง";
  }

  const toneClass = TONE_STYLES[resolvedTone] || TONE_STYLES.neutral;
  const sizeClasses =
    size === "md"
      ? "px-3 py-1 text-xs gap-1.5"
      : "px-2.5 py-0.5 text-[11px] gap-1.5";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-semibold border tracking-tight transition-colors select-none ${sizeClasses} ${toneClass} ${className}`}
    >
      {ResolvedIcon && <ResolvedIcon size={12.5} strokeWidth={2.2} className="shrink-0" />}
      <span>{resolvedLabel}</span>
    </span>
  );
}
