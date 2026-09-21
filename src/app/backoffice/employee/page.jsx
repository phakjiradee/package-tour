"use client";

import { useMemo, useState } from "react";
import {
  Edit3,
  RotateCcw,
  Search,
  Trash2,
  UserRoundPlus,
  X,
} from "lucide-react";

const employees = [
  {
    id: 1,
    name: "Narin Kittisak",
    email: "narin@zentura.co",
    phone: "081-234-5678",
    position: "Admin",
    status: "ใช้งาน",
    createdAt: "21/09/2569 09:20",
    updatedAt: "21/09/2569 16:44",
  },
  {
    id: 2,
    name: "Mali Srisuwan",
    email: "mali@zentura.co",
    phone: "089-555-1221",
    position: "Sales",
    status: "ใช้งาน",
    createdAt: "19/09/2569 14:12",
    updatedAt: "21/09/2569 11:05",
  },
  {
    id: 3,
    name: "Thana Wongchai",
    email: "thana@zentura.co",
    phone: "092-881-4400",
    position: "Guide",
    status: "พักงาน",
    createdAt: "18/09/2569 10:30",
    updatedAt: "20/09/2569 18:18",
  },
  {
    id: 4,
    name: "Ploy Rattanakul",
    email: "ploy@zentura.co",
    phone: "086-402-9912",
    position: "Support",
    status: "ใช้งาน",
    createdAt: "15/09/2569 08:45",
    updatedAt: "19/09/2569 13:26",
  },
  {
    id: 5,
    name: "Kawin Meechai",
    email: "kawin@zentura.co",
    phone: "099-245-7781",
    position: "Sales",
    status: "ปิดใช้งาน",
    createdAt: "12/09/2569 17:40",
    updatedAt: "18/09/2569 09:51",
  },
];

const positions = ["ทั้งหมด", "Admin", "Sales", "Guide", "Support"];
const statuses = ["ทั้งหมด", "ใช้งาน", "พักงาน", "ปิดใช้งาน"];

function StatusBadge({ status }) {
  const classes = {
    ใช้งาน: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    พักงาน: "bg-amber-50 text-amber-700 ring-amber-200",
    ปิดใช้งาน: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${classes[status]}`}
    >
      {status}
    </span>
  );
}

export default function EmployeePage() {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("ทั้งหมด");
  const [status, setStatus] = useState("ทั้งหมด");
  const [editingEmployee, setEditingEmployee] = useState(null);

  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !keyword ||
        employee.name.toLowerCase().includes(keyword) ||
        employee.email.toLowerCase().includes(keyword) ||
        employee.phone.includes(keyword);
      const matchesPosition =
        position === "ทั้งหมด" || employee.position === position;
      const matchesStatus = status === "ทั้งหมด" || employee.status === status;

      return matchesSearch && matchesPosition && matchesStatus;
    });
  }, [position, search, status]);

  const clearFilters = () => {
    setSearch("");
    setPosition("ทั้งหมด");
    setStatus("ทั้งหมด");
  };

  return (
    <>
      <div>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 p-5 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto_auto]">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="ค้นหาชื่อ อีเมล์ หรือเบอร์โทร"
            />
          </label>

          <select
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          >
            {positions.map((item) => (
              <option key={item} value={item}>
                {item === "ทั้งหมด" ? "ตำแหน่งทั้งหมด" : item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === "ทั้งหมด" ? "สถานะทั้งหมด" : item}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            เคลียร์
          </button>

          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
            <UserRoundPlus className="h-4 w-4" />
            เพิ่มพนักงาน
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="w-20 px-5 py-3 font-semibold">ลำดับ</th>
                <th className="px-5 py-3 font-semibold">ชื่อ-นามสกุล</th>
                <th className="px-5 py-3 font-semibold">อีเมล์</th>
                <th className="px-5 py-3 font-semibold">เบอร์โทร</th>
                <th className="px-5 py-3 font-semibold">ตำแหน่ง</th>
                <th className="px-5 py-3 font-semibold">สถานะ</th>
                <th className="px-5 py-3 font-semibold">วันที่สร้าง</th>
                <th className="px-5 py-3 font-semibold">วันที่อัพเดต</th>
                <th className="w-28 px-5 py-3 text-right font-semibold">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((employee, index) => (
                <tr key={employee.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4 text-sm font-medium text-slate-500">
                    {index + 1}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-950">
                    {employee.name}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {employee.email}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {employee.phone}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {employee.position}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={employee.status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {employee.createdAt}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {employee.updatedAt}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingEmployee(employee)}
                        className="inline-grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-700"
                        aria-label={`แก้ไข ${employee.name}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="inline-grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
                        aria-label={`ลบ ${employee.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
          <span>แสดง {filteredEmployees.length} รายการ</span>
          <span>ข้อมูลตัวอย่างสำหรับออกแบบ UI</span>
        </div>
        </div>
      </div>

      {editingEmployee ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  แก้ไขพนักงาน
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  ตัวอย่าง modal สำหรับแก้ไขข้อมูลพนักงาน
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="inline-grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  ชื่อ-นามสกุล
                </span>
                <input
                  defaultValue={editingEmployee.name}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">
                  อีเมล์
                </span>
                <input
                  defaultValue={editingEmployee.email}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">
                  เบอร์โทร
                </span>
                <input
                  defaultValue={editingEmployee.phone}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">
                  ตำแหน่ง
                </span>
                <select
                  defaultValue={editingEmployee.position}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  {positions
                    .filter((item) => item !== "ทั้งหมด")
                    .map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                </select>
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">
                  สถานะ
                </span>
                <select
                  defaultValue={editingEmployee.status}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  {statuses
                    .filter((item) => item !== "ทั้งหมด")
                    .map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
