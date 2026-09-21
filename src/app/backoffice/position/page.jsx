import { BriefcaseBusiness, MoreHorizontal, Plus, Search } from "lucide-react";

const positions = [
  {
    title: "Admin",
    employees: 3,
    access: "Full access",
  },
  {
    title: "Sales",
    employees: 8,
    access: "Booking and customer access",
  },
  {
    title: "Guide",
    employees: 14,
    access: "Assigned tour access",
  },
  {
    title: "Support",
    employees: 5,
    access: "Customer support access",
  },
];

export default function PositionPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
            <BriefcaseBusiness className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-950">
            ตำแหน่ง
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            จัดการตำแหน่งและสิทธิ์การเข้าถึงของพนักงาน
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
            <Search className="h-4 w-4" />
            <input
              className="w-48 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="ค้นหาตำแหน่ง"
            />
          </label>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" />
            เพิ่มตำแหน่ง
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {positions.map((position) => (
          <div
            key={position.title}
            className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
          >
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
              {position.title.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-950">
                {position.title}
              </p>
              <p className="mt-1 truncate text-sm text-slate-500">
                {position.access}
              </p>
            </div>
            <span className="rounded-md bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">
              {position.employees} employees
            </span>
            <button className="inline-grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
