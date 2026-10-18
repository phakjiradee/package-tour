"use client";

import { CalendarDays } from "lucide-react";
import { formatThaiDate } from "@/lib/date";

export default function PageHeader({
  title,
  description,
  actions,
  showDate = true,
}) {
  const todayStr = formatThaiDate(new Date().toISOString());

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div className="min-w-0">
        <h1 className="text-[22px] leading-tight font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[13px] text-zinc-500">
            {description}
          </p>
        )}
      </div>

      {(actions || showDate) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {showDate && (
            <span className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200/90 bg-white px-2.5 text-xs font-medium text-zinc-600 shadow-2xs">
              <CalendarDays size={14} className="text-zinc-400" />
              <span>{todayStr}</span>
            </span>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
