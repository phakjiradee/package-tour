import { Mail, MoreHorizontal, Search, ShieldCheck } from "lucide-react";

const customers = [
  {
    name: "Narin K.",
    email: "narin@example.com",
    plan: "Traveler",
    status: "Verified",
    orders: 7,
  },
  {
    name: "Mali S.",
    email: "mali@example.com",
    plan: "Family",
    status: "Pending",
    orders: 2,
  },
  {
    name: "Thomas W.",
    email: "thomas@example.com",
    plan: "Premium",
    status: "Verified",
    orders: 12,
  },
  {
    name: "Ploy R.",
    email: "ploy@example.com",
    plan: "Traveler",
    status: "Blocked",
    orders: 1,
  },
];

export default function CustomerPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Customer directory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review customer profile status and booking history.
            </p>
          </div>
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
            <Search className="h-4 w-4" />
            <input
              className="w-56 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Search customer"
            />
          </label>
        </div>

        <div className="divide-y divide-slate-100">
          {customers.map((customer) => (
            <div
              key={customer.email}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
            >
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                {customer.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {customer.name}
                </p>
                <p className="mt-1 flex items-center gap-2 truncate text-sm text-slate-500">
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {customer.plan}
                </span>
                <span className="rounded-md bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">
                  {customer.status}
                </span>
                <span className="w-16 text-right text-sm text-slate-500">
                  {customer.orders} orders
                </span>
                <button className="inline-grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-base font-semibold text-slate-950">
          Verification queue
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Prioritize pending customers before approving high-value bookings.
        </p>
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <p className="text-3xl font-semibold text-slate-950">19</p>
          <p className="mt-1 text-sm text-slate-500">profiles awaiting review</p>
        </div>
      </aside>
    </div>
  );
}
