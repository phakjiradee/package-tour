"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Copy,
  Check,
  Edit3,
  Handshake,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  Tag,
  Trash2,
} from "lucide-react";

export default function PartnerTable({
  partners = [],
  partnerTypes = [],
  loading = false,
  onEdit,
  onDelete,
  onAddNew,
}) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ทั้งหมด");
  const [copiedItem, setCopiedItem] = useState(null);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(key);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const filteredPartners = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return partners.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.name?.toLowerCase().includes(keyword) ||
        item.phone?.toLowerCase().includes(keyword) ||
        item.email?.toLowerCase().includes(keyword) ||
        item.address?.toLowerCase().includes(keyword) ||
        item.pt_type?.name?.toLowerCase().includes(keyword) ||
        String(item.id).includes(keyword);

      const matchesType =
        selectedType === "ทั้งหมด" ||
        String(item.pt_type_id) === selectedType ||
        item.pt_type?.name === selectedType;

      return matchesSearch && matchesType;
    });
  }, [partners, search, selectedType]);

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
      });
    } catch {
      return dateString;
    }
  };

  // Color generator for tags based on type name
  const getTypeBadgeClass = (typeName) => {
    const colors = [
      "bg-cyan-50 text-cyan-700 ring-cyan-200",
      "bg-purple-50 text-purple-700 ring-purple-200",
      "bg-emerald-50 text-emerald-700 ring-emerald-200",
      "bg-blue-50 text-blue-700 ring-blue-200",
      "bg-amber-50 text-amber-700 ring-amber-200",
      "bg-rose-50 text-rose-700 ring-rose-200",
      "bg-indigo-50 text-indigo-700 ring-indigo-200",
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
            placeholder="ค้นหาชื่อ, เบอร์โทร, อีเมล, ที่อยู่ หรือประเภท..."
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
            {partnerTypes.map((type) => (
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
          พบ <span className="mx-1 font-semibold text-zinc-900">{filteredPartners.length}</span> รายการ
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto border-t border-zinc-200/90 bg-white">
        <table className="w-full min-w-[850px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200/90 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-2.5">พาร์ทเนอร์</th>
              <th className="px-4 py-2.5">ประเภท</th>
              <th className="px-4 py-2.5">ข้อมูลติดต่อ</th>
              <th className="px-4 py-2.5">ที่อยู่</th>
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
                    <div className="h-4 w-36 rounded bg-zinc-100" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-20 rounded bg-zinc-100" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="h-3.5 w-24 rounded bg-zinc-100" />
                      <div className="h-3.5 w-32 rounded bg-zinc-100" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-3.5 w-28 rounded bg-zinc-100" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-3.5 w-20 rounded bg-zinc-100" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="ml-auto h-7 w-20 rounded bg-zinc-100" />
                  </td>
                </tr>
              ))
            ) : filteredPartners.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                    <div className="grid size-11 place-items-center rounded-xl bg-zinc-100 text-zinc-400">
                      <Handshake size={20} />
                    </div>
                    <p className="mt-3 text-xs font-semibold text-zinc-800">
                      {search || selectedType !== "ทั้งหมด"
                        ? "ไม่พบพาร์ทเนอร์ที่ตรงกับเงื่อนไขการค้นหา"
                        : "ยังไม่มีรายการพาร์ทเนอร์"}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {search || selectedType !== "ทั้งหมด"
                        ? "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองใหม่"
                        : "เริ่มต้นเพิ่มพาร์ทเนอร์ คู่ค้า โรงแรม หรือยานพาหนะรายแรกของคุณ"}
                    </p>
                    {onAddNew && !search && selectedType === "ทั้งหมด" && (
                      <button
                        type="button"
                        onClick={onAddNew}
                        className="btn-primary mt-3 h-8 px-3 text-xs rounded-md cursor-pointer"
                      >
                        + เพิ่มพาร์ทเนอร์รายแรก
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredPartners.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-zinc-50/70"
                >
                  {/* Partner Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-8 shrink-0 place-items-center rounded-md bg-blue-50 text-[#0051c8]">
                        <Handshake size={15} />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">
                          {item.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Partner Type */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${getTypeBadgeClass(
                        item.pt_type?.name
                      )}`}
                    >
                      <Tag size={10} />
                      <span>{item.pt_type?.name || "ไม่ระบุประเภท"}</span>
                    </span>
                  </td>

                  {/* Contact Info */}
                  <td className="px-4 py-3">
                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-700">
                        <Phone size={12} className="text-zinc-400 shrink-0" />
                        <span className="font-mono text-[11px]">{item.phone}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.phone, `phone-${item.id}`)}
                          className="ml-0.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                          title="คัดลอกเบอร์โทร"
                        >
                          {copiedItem === `phone-${item.id}` ? (
                            <Check size={11} className="text-emerald-600" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-zinc-700">
                        <Mail size={12} className="text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[170px] text-[11px]" title={item.email}>
                          {item.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.email, `email-${item.id}`)}
                          className="ml-0.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                          title="คัดลอกอีเมล"
                        >
                          {copiedItem === `email-${item.id}` ? (
                            <Check size={11} className="text-emerald-600" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Address & Location */}
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {item.address ? (
                        <div className="flex items-start gap-1 max-w-[220px] text-xs text-zinc-600">
                          <MapPin size={12} className="text-zinc-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-[11px]" title={item.address}>
                            {item.address}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic">ไม่ระบุที่อยู่</span>
                      )}
                      {item.location?.name && (
                        <div className="flex items-center gap-1 text-[11px] text-blue-700">
                          <MapPin size={12} className="shrink-0" />
                          <span>{item.location.name}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Created At */}
                  <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Calendar size={12} className="text-zinc-400" />
                      <span>{formatDate(item.createAt)}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="btn-secondary h-7 px-2.5 text-xs rounded-md cursor-pointer"
                        title="แก้ไขข้อมูลพาร์ทเนอร์"
                      >
                        <Edit3 size={12} />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="btn-danger h-7 px-2.5 text-xs rounded-md cursor-pointer"
                        title="ลบพาร์ทเนอร์"
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

