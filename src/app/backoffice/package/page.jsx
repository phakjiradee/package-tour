import { MoreHorizontal, Plus, Search } from "lucide-react";

const packages = [
  {
    name: "Bangkok City Light",
    destination: "Bangkok",
    price: "฿3,900",
    status: "Published",
    bookings: 128,
  },
  {
    name: "Chiang Mai Slow Trail",
    destination: "Chiang Mai",
    price: "฿8,500",
    status: "Draft",
    bookings: 42,
  },
  {
    name: "Phuket Island Escape",
    destination: "Phuket",
    price: "฿12,900",
    status: "Published",
    bookings: 236,
  },
  {
    name: "Ayutthaya Heritage Day",
    destination: "Ayutthaya",
    price: "฿2,400",
    status: "Review",
    bookings: 71,
  },
];

export default function PackagePage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Package inventory
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage published packages, drafts, pricing, and booking volume.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
            <Search className="h-4 w-4" />
            <input
              className="w-48 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Search package"
            />
          </label>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" />
            Add package
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Package</th>
              <th className="px-5 py-3 font-semibold">Destination</th>
              <th className="px-5 py-3 font-semibold">Price</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Bookings</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {packages.map((item) => (
              <tr key={item.name} className="hover:bg-slate-50/70">
                <td className="px-5 py-4 text-sm font-semibold text-slate-950">
                  {item.name}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {item.destination}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {item.price}
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-md bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">
                    {item.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {item.bookings}
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="inline-grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
