import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  PlaneTakeoff,
  UsersRound,
} from "lucide-react";

const stats = [
  {
    label: "Total bookings",
    value: "1,284",
    trend: "+12.4%",
    direction: "up",
    icon: CalendarDays,
  },
  {
    label: "Revenue",
    value: "฿842K",
    trend: "+8.1%",
    direction: "up",
    icon: CircleDollarSign,
  },
  {
    label: "Active packages",
    value: "48",
    trend: "+3",
    direction: "up",
    icon: PlaneTakeoff,
  },
  {
    label: "Pending customers",
    value: "19",
    trend: "-4.3%",
    direction: "down",
    icon: UsersRound,
  },
];

const activities = [
  "Bangkok heritage tour updated",
  "New customer verification pending",
  "Chiang Mai package received 12 bookings",
  "Payment reconciliation completed",
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon =
            stat.direction === "up" ? ArrowUpRight : ArrowDownRight;

          return (
            <div
              key={stat.label}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {stat.value}
                  </p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <div
                className={`mt-4 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
                  stat.direction === "up"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                <TrendIcon className="h-3.5 w-3.5" />
                {stat.trend}
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Booking performance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Weekly operations snapshot
              </p>
            </div>
            <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Export
            </button>
          </div>

          <div className="mt-8 flex h-72 items-end gap-3">
            {[42, 58, 38, 74, 64, 86, 70, 96, 78, 88, 68, 92].map(
              (height, index) => (
                <div
                  key={index}
                  className="flex min-w-0 flex-1 flex-col justify-end"
                >
                  <div
                    className="rounded-t-md bg-cyan-500"
                    style={{ height: `${height}%` }}
                  />
                </div>
              ),
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            Recent activity
          </h2>
          <div className="mt-5 space-y-4">
            {activities.map((activity) => (
              <div key={activity} className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-500" />
                <p className="text-sm leading-6 text-slate-600">{activity}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
