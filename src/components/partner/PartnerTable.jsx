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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Search & Filter Bar */}
      <div className="grid gap-3 border-b border-slate-200 p-4 sm:p-5 lg:grid-cols-[minmax(220px,1fr)_220px_auto_auto]">
        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, เบอร์โทร, อีเมล, ที่อยู่ หรือประเภท..."
            className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
          />
        </label>

        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
          <Tag className="h-4 w-4 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-transparent text-slate-800 outline-none cursor-pointer"
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
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          ล้างตัวกรอง
        </button>

        <div className="flex items-center justify-end text-xs text-slate-500">
          พบ <span className="mx-1 font-semibold text-slate-900">{filteredPartners.length}</span> รายการ
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3.5">ID</th>
              <th className="px-5 py-3.5">พาร์ทเนอร์</th>
              <th className="px-5 py-3.5">ประเภท</th>
              <th className="px-5 py-3.5">ข้อมูลติดต่อ</th>
              <th className="px-5 py-3.5">ที่อยู่</th>
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
                    <div className="h-4 w-36 rounded bg-slate-100" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-6 w-24 rounded-md bg-slate-100" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 rounded bg-slate-100" />
                      <div className="h-3.5 w-36 rounded bg-slate-100" />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-4 w-32 rounded bg-slate-100" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-4 w-24 rounded bg-slate-100" />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="ml-auto h-8 w-20 rounded bg-slate-100" />
                  </td>
                </tr>
              ))
            ) : filteredPartners.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                      <Handshake className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      {search || selectedType !== "ทั้งหมด"
                        ? "ไม่พบพาร์ทเนอร์ที่ตรงกับเงื่อนไขการค้นหา"
                        : "ยังไม่มีรายการพาร์ทเนอร์"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {search || selectedType !== "ทั้งหมด"
                        ? "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองใหม่"
                        : "เริ่มต้นเพิ่มพาร์ทเนอร์ คู่ค้า โรงแรม หรือยานพาหนะรายแรกของคุณ"}
                    </p>
                    {onAddNew && !search && selectedType === "ทั้งหมด" && (
                      <button
                        type="button"
                        onClick={onAddNew}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
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
                  className="transition-colors hover:bg-slate-50/70"
                >
                  {/* ID */}
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-400">
                    #{item.id}
                  </td>

                  {/* Partner Name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
                        <Handshake className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          ID: PT-{String(item.id).padStart(4, "0")}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Partner Type */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getTypeBadgeClass(
                        item.pt_type?.name
                      )}`}
                    >
                      <Tag className="h-3 w-3" />
                      {item.pt_type?.name || "ไม่ระบุประเภท"}
                    </span>
                  </td>

                  {/* Contact Info */}
                  <td className="px-5 py-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{item.phone}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.phone, `phone-${item.id}`)}
                          className="ml-1 text-slate-400 hover:text-slate-600"
                          title="คัดลอกเบอร์โทร"
                        >
                          {copiedItem === `phone-${item.id}` ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[170px]" title={item.email}>
                          {item.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.email, `email-${item.id}`)}
                          className="ml-1 text-slate-400 hover:text-slate-600"
                          title="คัดลอกอีเมล"
                        >
                          {copiedItem === `email-${item.id}` ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Address */}
                  <td className="px-5 py-4">
                    {item.address ? (
                      <div className="flex items-start gap-1.5 max-w-[220px] text-xs text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2" title={item.address}>
                          {item.address}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">ไม่ระบุที่อยู่</span>
                    )}
                  </td>

                  {/* Created At */}
                  <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatDate(item.createAt)}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                        title="แก้ไขข้อมูลพาร์ทเนอร์"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-100 bg-rose-50/50 px-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 cursor-pointer"
                        title="ลบพาร์ทเนอร์"
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
