"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  icon: Icon,
  title,
  label,
  value,
  subtitle,
  hint,
  badgeText,
  badgeType = "success", // success | blue | purple | warning | danger | neutral
  trendBadge, // { text, tone: "success" | "warning" | "danger" | "neutral" }
  tone,
  meterSegments, // [{ percent: number, color: string }]
  percent,
  barColor = "bg-[#0051c8]",
  footer,
  loading = false,
  onClick,
  active = false,
  className = "",
}) {
  const displayTitle = title || label || "สถิติ";
  const displaySubtitle = subtitle || hint;

  const badgeStyles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    blue: "bg-blue-50 text-[#0051c8] border-blue-200/80",
    purple: "bg-purple-50 text-purple-700 border-purple-200/80",
    warning: "bg-amber-50 text-amber-800 border-amber-200/80",
    danger: "bg-rose-50 text-rose-700 border-rose-200/80",
    neutral: "bg-zinc-100 text-zinc-600 border-zinc-200/80",
  };
  const toneStyles = {
    success: { frame: "border-emerald-300 bg-emerald-50", body: "border-emerald-200 bg-emerald-50/70", text: "text-emerald-800", icon: "border-emerald-200 bg-white text-emerald-700" },
    warning: { frame: "border-amber-300 bg-amber-50", body: "border-amber-200 bg-amber-50/70", text: "text-amber-900", icon: "border-amber-200 bg-white text-amber-700" },
    danger: { frame: "border-rose-300 bg-rose-50", body: "border-rose-200 bg-rose-50/70", text: "text-rose-800", icon: "border-rose-200 bg-white text-rose-700" },
  };
  const toneStyle = toneStyles[tone];

  // Resolve badge either from trendBadge object or badgeText
  const resolvedBadge = trendBadge
    ? {
        text: trendBadge.text,
        style: badgeStyles[trendBadge.tone] || badgeStyles.success,
        tone: trendBadge.tone,
      }
    : badgeText
    ? {
        text: badgeText,
        style: badgeStyles[badgeType] || badgeStyles.blue,
        tone: badgeType,
      }
    : null;

  const totalBars = 20;
  const filledCount =
    typeof percent === "number"
      ? Math.min(totalBars, Math.max(1, Math.round(totalBars * (percent / 100))))
      : null;

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border overflow-hidden shadow-2xs flex flex-col justify-between transition-all ${
        onClick ? "cursor-pointer hover:border-zinc-300 hover:shadow-xs active:scale-[0.99]" : ""
      } ${
        active
          ? "border-zinc-900 ring-2 ring-zinc-900/10 bg-zinc-100/90"
          : toneStyle?.frame || "border-zinc-200 bg-zinc-50/90"
      } ${className}`}
    >
      {/* Layer 1: Header Bar with Icon & Title */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 min-h-9.5">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <span className={`flex size-6 shrink-0 items-center justify-center rounded-md border shadow-2xs ${toneStyle?.icon || "border-zinc-200/80 bg-white text-zinc-600"}`}>
              <Icon size={13} />
            </span>
          )}
          <span className={`truncate text-xs font-semibold ${toneStyle?.text || "text-zinc-800"}`}>
            {displayTitle}
          </span>
        </div>

        {/* Header Right Badge */}
        {badgeText && !trendBadge && (
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider border ${
              badgeStyles[badgeType] || badgeStyles.blue
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Layer 2: Inner Canvas with Metric Value */}
      <div className={`rounded-t-lg border-t p-3.5 flex flex-col justify-between flex-1 ${toneStyle?.body || "border-zinc-200/90 bg-white"}`}>
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-zinc-100" />
        ) : (
          <div className="flex items-baseline justify-between flex-wrap gap-1.5">
            <span className={`text-xl sm:text-2xl font-bold tracking-tight font-sans tabular-nums ${toneStyle?.text || "text-zinc-900"}`}>
              {value}
            </span>

            {/* Trend badge beside value */}
            {resolvedBadge && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${resolvedBadge.style}`}
              >
                {resolvedBadge.tone === "success" && (
                  <TrendingUp size={10} className="stroke-[2.5]" />
                )}
                {resolvedBadge.tone === "danger" && (
                  <TrendingDown size={10} className="stroke-[2.5]" />
                )}
                <span>{resolvedBadge.text}</span>
              </span>
            )}
          </div>
        )}

        {/* Optional Multi-Segment Meter */}
        {Array.isArray(meterSegments) && meterSegments.length > 0 && !loading && (
          <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            {meterSegments.map((seg, idx) => (
              <span
                key={idx}
                style={{ width: `${Math.max(0, Math.min(100, seg.percent || 0))}%` }}
                className={`h-full ${seg.color || "bg-[#0051c8]"}`}
              />
            ))}
          </div>
        )}

        {/* Optional Single-Bar Segmented Meter */}
        {filledCount !== null && !loading && (
          <div className="mt-3 flex items-center gap-1">
            {Array.from({ length: totalBars }).map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i < filledCount ? barColor : "bg-zinc-100"
                }`}
              />
            ))}
          </div>
        )}

        {/* Subtitle / Hint */}
        {displaySubtitle && !loading && (
          <p className={`mt-2 text-[11px] font-medium ${toneStyle?.text || "text-zinc-400"}`}>
            {displaySubtitle}
          </p>
        )}

        {/* Optional Footer Link / Extra Details */}
        {footer && !loading && (
          <div className="mt-2.5 pt-2 border-t border-zinc-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
