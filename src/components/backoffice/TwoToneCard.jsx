"use client";

export default function TwoToneCard({
  title,
  titleEn,
  label,
  subtitle,
  action,
  headerRight,
  children,
  className = "",
  bodyClassName = "p-4 sm:p-5",
  noPadding = false,
}) {
  const displayTitle = title || label;
  const resolvedBodyClass = noPadding ? "p-0" : bodyClassName;
  const rightSlot = action || headerRight;

  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-zinc-50/90 overflow-hidden shadow-2xs ${className}`}
    >
      {/* Layer 1: Header Bar (Tinted Gray Background) */}
      {(displayTitle || rightSlot) && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 min-h-10">
          <div className="flex items-center gap-2 min-w-0">
            {displayTitle && (
              <h3 className="text-xs font-semibold text-zinc-900 truncate">
                {displayTitle}
              </h3>
            )}
            {titleEn && (
              <span className="text-[11px] font-normal text-zinc-400 truncate">
                · {titleEn}
              </span>
            )}
            {subtitle && (
              <p className="text-[11px] text-zinc-400 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {rightSlot && <div className="shrink-0">{rightSlot}</div>}
        </div>
      )}

      {/* Layer 2: Inner White Canvas with Top Inset Border */}
      <div
        className={`rounded-t-lg border-t border-zinc-200/90 bg-white ${resolvedBodyClass}`}
      >
        {children}
      </div>
    </div>
  );
}
