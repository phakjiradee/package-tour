import { useSyncExternalStore } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-zinc-200/90 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-xs text-xs">
        <p className="font-bold text-zinc-900 mb-1.5 flex items-center gap-1.5">
          <span>{data.label}</span>
          <span className="text-[11px] font-normal text-zinc-400">
            ({data.fullDate || data.dateStr})
          </span>
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-zinc-500">
              <span className="size-2 rounded-full bg-[#0051c8]" />
              การจองทั้งหมด
            </span>
            <span className="font-bold text-zinc-900 tabular-nums">
              {data.count} รายการ
            </span>
          </div>
          {typeof data.confirmedCount === "number" && (
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-zinc-500">
                <span className="size-2 rounded-full bg-emerald-500" />
                ยืนยันแล้ว
              </span>
              <span className="font-semibold text-emerald-700 tabular-nums">
                {data.confirmedCount} รายการ
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export default function BookingTrendsChart({ data = [] }) {
  const isClient = useIsClient();

  const totalBookingsInPeriod = data.reduce((sum, d) => sum + (d.count || 0), 0);
  const maxDayCount = Math.max(...data.map((d) => d.count || 0), 0);
  const peakDay = data.find((d) => (d.count || 0) === maxDayCount);

  if (!isClient) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-zinc-50/50 rounded-lg animate-pulse">
        <span className="text-xs text-zinc-400">กำลังโหลดกราฟสถิติ...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Quick Summary Metrics above the Area Chart */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[11px] text-zinc-400">ยอดจองรวม 7 วัน: </span>
            <span className="font-bold text-zinc-900 tabular-nums">
              {totalBookingsInPeriod} รายการ
            </span>
          </div>
          {peakDay && maxDayCount > 0 && (
            <div>
              <span className="text-[11px] text-zinc-400">วันที่จองสูงสุด: </span>
              <span className="font-semibold text-[#0051c8]">
                {peakDay.label} ({maxDayCount} รายการ)
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#0051c8]" />
            แนวโน้มการจอง
          </span>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="bookingTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0051c8" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#0051c8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "#e4e4e7" }}
              tick={{ fill: "#71717a", fontSize: 11 }}
              dy={8}
            />

            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="count"
              stroke="#0051c8"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#bookingTrendGradient)"
              activeDot={{
                r: 5,
                fill: "#0051c8",
                stroke: "#ffffff",
                strokeWidth: 2.5,
              }}
              dot={{
                r: 3.5,
                fill: "#ffffff",
                stroke: "#0051c8",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
