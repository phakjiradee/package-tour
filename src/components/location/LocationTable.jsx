"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Edit3,
  MapPin,
  RotateCcw,
  Search,
  Tag,
  Trash2,
} from "lucide-react";

export default function LocationTable({
  locations = [],
  locationTypes = [],
  loading = false,
  onEdit,
  onDelete,
  onAddNew,
}) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ทั้งหมด");

  const filteredLocations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return locations.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.name?.toLowerCase().includes(keyword) ||
        item.lct_type?.name?.toLowerCase().includes(keyword) ||
        String(item.id).includes(keyword);

      const matchesType =
        selectedType === "ทั้งหมด" ||
        String(item.lct_type_id) === selectedType ||
        item.lct_type?.name === selectedType;

      return matchesSearch && matchesType;
    });
  }, [locations, search, selectedType]);

  const clearFilters = () => {
    setSearch("");
    setSelectedType("ทั้งหมด");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Color generator for tags based on type name
  const getTypeBadgeClass = (typeName) => {
    const colors = [
      "bg-cyan-50 text-cyan-700 ring-cyan-200",
      "bg-emerald-50 text-emerald-700 ring-emerald-200",
      "bg-purple-50 text-purple-700 ring-purple-200",
      "bg-amber-50 text-amber-700 ring-amber-200",
      "bg-blue-50 text-blue-700 ring-blue-200",
      "bg-pink-50 text-pink-700 ring-pink-200",
    ];
    if (!typeName) return "bg-slate-100 text-slate-700 ring-slate-200";
    let hash = 0;
    for (let i = 0; i < typeName.length; i++) {
      hash = typeName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Search & Filter Bar */}
      <div className="grid gap-3 border-b border-slate-200 p-4 sm:p-5 lg:grid-cols-[minmax(220px,1fr)_200px_auto_auto]">
        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อสถานที่ หรือประเภท..."
            className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
          />
        </label>

        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
          <Tag className="h-4 w-4 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-transparent text-slate-800 outline-none"
          >
            <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
            {locationTypes.map((type) => (
              <option key={type.id} value={String(type.id)}>
                {type.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <RotateCcw className="h-4 w-4" />
          ล้างตัวกรอง
        </button>

        <div className="flex items-center justify-end text-xs text-slate-500">
          พบ <span className="mx-1 font-semibold text-slate-900">{filteredLocations.length}</span> รายการ
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3.5">ID</th>
              <th className="px-5 py-3.5">ชื่อสถานที่</th>
              <th className="px-5 py-3.5">ประเภทสถานที่</th>
              <th className="px-5 py-3.5">วันที่บันทึก</th>
              <th className="px-5 py-3.5 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-5 py-4">
                    <div className="h-4 w-8 rounded bg-slate-100" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-4 w-32 rounded bg-slate-100" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-6 w-20 rounded-md bg-slate-100" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-4 w-28 rounded bg-slate-100" />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="ml-auto h-8 w-16 rounded bg-slate-100" />
                  </td>
                </tr>
              ))
            ) : filteredLocations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      {search || selectedType !== "ทั้งหมด"
                        ? "ไม่พบสถานที่ที่ตรงกับเงื่อนไขการค้นหา"
                        : "ยังไม่มีรายการสถานที่"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {search || selectedType !== "ทั้งหมด"
                        ? "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองใหม่"
                        : "เริ่มต้นเพิ่มสถานที่ท่องเที่ยว จุดเช็คอินแรกของคุณ"}
                    </p>
                    {onAddNew && (!search && selectedType === "ทั้งหมด") && (
                      <button
                        type="button"
                        onClick={onAddNew}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        + เพิ่มสถานที่แรก
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredLocations.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-400">
                    #{item.id}
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-slate-800">
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getTypeBadgeClass(
                        item.lct_type?.name
                      )}`}
                    >
                      <Tag className="h-3 w-3" />
                      {item.lct_type?.name || "ไม่ระบุประเภท"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatDate(item.createAt)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        title="แก้ไข"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-100 bg-rose-50/50 px-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 hover:text-rose-700"
                        title="ลบ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
