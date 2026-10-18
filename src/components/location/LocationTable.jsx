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
    <div className="overflow-hidden rounded-lg border border-zinc-200/90 bg-zinc-50/90 shadow-2xs">
      {/* Search & Filter Bar */}
      <div className="grid gap-2.5 p-3 sm:p-3.5 lg:grid-cols-[minmax(220px,1fr)_200px_auto_auto]">
        <label className="flex h-8.5 items-center gap-2 rounded-md border border-zinc-200/90 bg-white px-2.5 text-xs text-zinc-500 shadow-2xs focus-within:border-[#0051c8]">
          <Search size={14} className="shrink-0 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อสถานที่ หรือประเภท..."
            className="w-full bg-transparent text-zinc-900 outline-none placeholder:text-zinc-400 text-xs"
          />
        </label>

        <label className="flex h-8.5 items-center gap-2 rounded-md border border-zinc-200/90 bg-white px-2.5 text-xs text-zinc-500 shadow-2xs focus-within:border-[#0051c8]">
          <Tag size={13} className="shrink-0 text-zinc-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-transparent text-zinc-800 outline-none cursor-pointer text-xs"
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
          className="btn-secondary h-8.5 px-3 text-xs rounded-md cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>ล้างตัวกรอง</span>
        </button>

        <div className="flex items-center justify-end text-[11px] text-zinc-400 pr-1">
          พบ <span className="mx-1 font-semibold text-zinc-900">{filteredLocations.length}</span> รายการ
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto border-t border-zinc-200/90 bg-white">
        <table className="w-full min-w-162.5 border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200/90 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-2.5">ชื่อสถานที่</th>
              <th className="px-4 py-2.5">ประเภทสถานที่</th>
              <th className="px-4 py-2.5">วันที่บันทึก</th>
              <th className="px-4 py-2.5 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-3">
                    <div className="h-4 w-32 rounded bg-zinc-100" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-20 rounded bg-zinc-100" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-3.5 w-24 rounded bg-zinc-100" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="ml-auto h-7 w-16 rounded bg-zinc-100" />
                  </td>
                </tr>
              ))
            ) : filteredLocations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                    <div className="grid size-11 place-items-center rounded-xl bg-zinc-100 text-zinc-400">
                      <MapPin size={20} />
                    </div>
                    <p className="mt-3 text-xs font-semibold text-zinc-800">
                      {search || selectedType !== "ทั้งหมด"
                        ? "ไม่พบสถานที่ที่ตรงกับเงื่อนไขการค้นหา"
                        : "ยังไม่มีรายการสถานที่"}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {search || selectedType !== "ทั้งหมด"
                        ? "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองใหม่"
                        : "เริ่มต้นเพิ่มสถานที่ท่องเที่ยว จุดเช็คอินแรกของคุณ"}
                    </p>
                    {onAddNew && !search && selectedType === "ทั้งหมด" && (
                      <button
                        type="button"
                        onClick={onAddNew}
                        className="btn-primary mt-3 h-8 px-3 text-xs rounded-md cursor-pointer"
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
                  className="transition-colors hover:bg-zinc-50/70"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-8 shrink-0 place-items-center rounded-md bg-blue-50 text-[#0051c8]">
                        <MapPin size={15} />
                      </div>
                      <span className="font-semibold text-zinc-900">
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${getTypeBadgeClass(
                        item.lct_type?.name
                      )}`}
                    >
                      <Tag size={10} />
                      <span>{item.lct_type?.name || "ไม่ระบุประเภท"}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Calendar size={12} className="text-zinc-400" />
                      <span>{formatDate(item.createAt)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="btn-secondary h-7 px-2.5 text-xs rounded-md cursor-pointer"
                        title="แก้ไข"
                      >
                        <Edit3 size={12} />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="btn-danger h-7 px-2.5 text-xs rounded-md cursor-pointer"
                        title="ลบ"
                      >
                        <Trash2 size={12} />
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

