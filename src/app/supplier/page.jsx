"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bus, CalendarDays, Clock3, MapPin, RefreshCw, Search, ShieldAlert, Users } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import StatCard from "@/components/backoffice/StatCard";
import supplierService from "@/service/supplier";
import { clearSupplierAuth, getSupplierAuth } from "@/lib/supplier-auth";

const filters = [
  { value: "all", label: "ทริปทั้งหมด" },
  { value: "upcoming", label: "กำลังจะมาถึง" },
  { value: "today", label: "เฉพาะวันนี้" },
];

export default function SupplierDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [data, setData] = useState({ partner: null, location: null, trips: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await supplierService.getTrips();
      if (res.success) {
        setData({
          partner: res.partner,
          location: res.location,
          trips: Array.isArray(res.trips) ? res.trips : [],
        });
      }
    } catch (err) {
      console.error("Error loading supplier trips:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        clearSupplierAuth();
        router.push("/supplier/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentUser(getSupplierAuth());
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const filteredTrips = useMemo(() => {
    const query = search.trim().toLowerCase();
    let trips = data.trips;
    if (query) {
      trips = trips.filter((trip) =>
        [trip.packageName, trip.busName, trip.busPlate, trip.locationName]
          .some((value) => value?.toLowerCase().includes(query))
      );
    }
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    if (selectedFilter === "today") {
      trips = trips.filter((trip) => trip.startDate && new Date(trip.startDate).toISOString().split("T")[0] === today);
    } else if (selectedFilter === "upcoming") {
      trips = trips.filter((trip) => !trip.startDate || new Date(trip.startDate) >= now);
    }
    return trips;
  }, [data.trips, search, selectedFilter]);

  const totalBuses = data.trips.reduce((count, trip) => count + (trip.busCount || 1), 0);
  const totalPassengers = data.trips.reduce((count, trip) => count + (trip.passengerCount || 0), 0);
  const formatDate = (date) => date
    ? new Date(date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
    : "ไม่ระบุวัน";

  return (
    <div className="space-y-6">
      <PageHeader
        title="เที่ยวรถบัส"
        description="ตรวจสอบเที่ยวรถบัสและกำหนดการที่จะมาถึงจุดบริการของคุณ"
        actions={
          <button type="button" onClick={loadData} disabled={loading} className="btn-secondary h-8 rounded-lg px-3 text-xs cursor-pointer">
            <RefreshCw size={13} className={loading ? "animate-spin text-zinc-500" : "text-zinc-500"} />
            <span>รีเฟรช</span>
          </button>
        }
      />

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-2xs sm:p-5" aria-label="ข้อมูลพาร์ทเนอร์">
        <p className="text-[11px] font-medium text-zinc-500">คู่ค้า / พาร์ทเนอร์ที่สังกัด</p>
        <h2 className="mt-1 text-lg font-semibold text-zinc-900">
          {data.partner?.name || currentUser?.partner?.name || "พาร์ทเนอร์"}
        </h2>
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {data.location?.name ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-medium text-[#0051c8]">
              <MapPin size={13} />จุดบริการที่เชื่อมต่อ: {data.location.name}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-medium text-amber-800">
              <ShieldAlert size={13} />ยังไม่ได้กำหนด Location ให้พาร์ทเนอร์นี้
            </span>
          )}
        </div>
      </section>

      {!data.location && !loading && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <ShieldAlert size={17} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <h3 className="text-sm font-semibold">พาร์ทเนอร์ยังไม่ได้เชื่อมต่อสถานที่ (Location)</h3>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              เนื่องจากบัญชีพาร์ทเนอร์นี้ยังไม่มีการระบุสถานที่ จึงยังไม่สามารถระบุเที่ยวรถบัสที่จะเข้ามาจุดบริการของคุณได้ กรุณาแจ้งผู้ดูแลระบบ (Admin) ให้ผูกสถานที่ (Location) ในเมนูพาร์ทเนอร์
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title="รถบัสที่จะมาทั้งหมด" icon={Bus} value={`${totalBuses} คัน`} subtitle="รถบัสตามทริปที่กำหนด" loading={loading} />
        <StatCard title="รอบทริป / กำหนดการ" icon={CalendarDays} value={`${data.trips.length} รอบ`} subtitle="รอบการเดินทางทั้งหมด" loading={loading} />
        <StatCard title="ผู้โดยสารโดยประมาณ" icon={Users} value={`${totalPassengers} คน`} subtitle="จากทริปทั้งหมด" loading={loading} />
      </div>

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xs" aria-label="รายการเที่ยวรถบัส">
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="ค้นหาเที่ยวรถบัส"
              placeholder="ค้นหาชื่อแพ็กเกจทัวร์, ทะเบียนรถ, ชื่อบัส..."
              className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 p-1">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setSelectedFilter(filter.value)}
                aria-pressed={selectedFilter === filter.value}
                className={selectedFilter === filter.value
                  ? "rounded bg-white px-2.5 py-1 text-xs font-semibold text-zinc-900 shadow-2xs cursor-pointer"
                  : "rounded px-2.5 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 cursor-pointer"}
              >
                {filter.label}{filter.value === "all" ? ` (${data.trips.length})` : ""}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <RefreshCw size={28} className="animate-spin text-[#0051c8]" />
            <p className="mt-3 text-sm font-semibold text-zinc-700">กำลังตรวจสอบข้อมูลเที่ยวรถบัส...</p>
            <p className="text-xs text-zinc-400">กรุณารอสักครู่</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-lg bg-zinc-100 text-zinc-400"><Bus size={25} /></span>
            <h3 className="mt-3 text-sm font-semibold text-zinc-900">ยังไม่มีรถบัสที่กำหนดมาถึงในช่วงนี้</h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-500">
              {search || selectedFilter !== "all"
                ? "ไม่พบข้อมูลเที่ยวรถที่ตรงกับคำค้นหาหรือตัวกรองที่เลือก"
                : "เมื่อมีการจัดทริปหรือรอบการเดินทางที่แวะสถานที่ของคุณ ข้อมูลรถบัสและเวลาจะแสดงที่นี่อัตโนมัติ"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredTrips.map((trip) => (
              <article key={trip.id} className="flex flex-col justify-between rounded-lg border border-zinc-200 bg-white p-4 shadow-2xs">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-blue-50 text-[#0051c8]"><Bus size={18} /></span>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-zinc-900">{trip.busName}</h4>
                        <p className="text-xs text-zinc-500">ทะเบียน: {trip.busPlate}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{trip.busCount} คัน</span>
                  </div>
                  <div className="mt-4 border-t border-zinc-100 pt-3">
                    <p className="text-[11px] font-medium text-zinc-400">แพ็กเกจทัวร์</p>
                    <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-zinc-800">{trip.packageName}</p>
                  </div>
                  <dl className="mt-4 space-y-2 rounded-md bg-zinc-50 p-3 text-xs">
                    <div className="flex justify-between gap-2"><dt className="flex items-center gap-1.5 text-zinc-500"><CalendarDays size={13} />วันเดินทาง</dt><dd className="font-medium text-zinc-800">{formatDate(trip.startDate)}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="flex items-center gap-1.5 text-zinc-500"><Clock3 size={13} />ช่วงเวลาที่มาถึง</dt><dd className="font-medium text-[#0051c8]">{trip.timeWindow}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="flex items-center gap-1.5 text-zinc-500"><Users size={13} />ผู้โดยสาร</dt><dd className="font-medium text-zinc-800">{trip.passengerCount > 0 ? `${trip.passengerCount} ท่าน` : "รอยืนยันยอด"}</dd></div>
                  </dl>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-[11px] text-zinc-500">
                  <span className="flex min-w-0 items-center gap-1"><MapPin size={12} className="shrink-0 text-[#0051c8]" /><span className="truncate">แวะจุด: <strong>{trip.locationName}</strong></span></span>
                  <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px]">แวะวันที่ {trip.stopDays?.join(", ")}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
