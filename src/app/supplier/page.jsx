"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bus, CalendarDays, MapPin, RefreshCw, Search, ShieldAlert, Users } from "lucide-react";
import PageHeader from "@/components/backoffice/PageHeader";
import StatCard from "@/components/backoffice/StatCard";
import supplierService from "@/service/supplier";
import { clearSupplierAuth, getSupplierAuth } from "@/lib/supplier-auth";

const filters = [
  { value: "all", label: "ทริปทั้งหมด" },
  { value: "upcoming", label: "กำลังจะมาถึง" },
  { value: "today", label: "เฉพาะวันนี้" },
];

const todayInBangkok = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

export default function SupplierDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [data, setData] = useState({ partner: null, location: null, trips: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await supplierService.getTrips();
      if (!res.success) throw new Error(res.message || "Supplier trips request failed");
      setData({
        partner: res.partner,
        location: res.location,
        trips: Array.isArray(res.trips) ? res.trips : [],
      });
    } catch (err) {
      console.error("Error loading supplier trips:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        clearSupplierAuth();
        router.push("/supplier/login");
      } else {
        setError("โหลดข้อมูลทัวร์ไม่สำเร็จ กรุณาลองรีเฟรชอีกครั้ง");
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
        [trip.packageName, trip.locationName, ...(trip.buses || []).flatMap((bus) => [bus.name, bus.plate])]
          .some((value) => value?.toLowerCase().includes(query))
      );
    }
    const today = todayInBangkok();
    if (selectedFilter === "today") {
      trips = trips.filter((trip) => trip.arrivalDate === today);
    } else if (selectedFilter === "upcoming") {
      trips = trips.filter((trip) => trip.arrivalDate >= today);
    }
    return trips;
  }, [data.trips, search, selectedFilter]);

  const totalAdults = filteredTrips.reduce((count, trip) => count + trip.adultCount, 0);
  const totalChildren = filteredTrips.reduce((count, trip) => count + trip.childCount, 0);
  const formatDate = (date) => date
    ? new Date(`${date}T00:00:00.000Z`).toLocaleDateString("th-TH", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })
    : "ไม่ระบุวัน";

  return (
    <div className="space-y-6">
      <PageHeader
        title="ทัวร์ที่มาจุดบริการ"
        description="ดูทัวร์และจำนวนผู้เดินทางที่ยืนยันแล้ว แยกผู้ใหญ่และเด็กตามวันแวะ"
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

      {!data.location && !loading && !error && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <ShieldAlert size={17} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <h3 className="text-sm font-semibold">พาร์ทเนอร์ยังไม่ได้เชื่อมต่อสถานที่ (Location)</h3>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              กรุณาให้ผู้ดูแลระบบผูก Location ของร้านในเมนูพาร์ทเนอร์ และเลือก Location เดียวกันในกำหนดการของแพ็กเกจ จึงจะแสดงทัวร์ที่แวะร้านนี้ได้
            </p>
          </div>
        </div>
      )}

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="รอบที่แวะจุดบริการ" icon={CalendarDays} value={data.location && !error ? `${filteredTrips.length} รอบ` : "-"} subtitle="ตามตัวกรองที่เลือก" loading={loading} />
        <StatCard title="ผู้ใหญ่" icon={Users} value={data.location && !error ? `${totalAdults} คน` : "-"} subtitle="จากการจองที่ยืนยันแล้ว" loading={loading} />
        <StatCard title="เด็ก" icon={Users} value={data.location && !error ? `${totalChildren} คน` : "-"} subtitle="จากการจองที่ยืนยันแล้ว" loading={loading} />
        <StatCard title="ผู้เดินทางรวม" icon={Users} value={data.location && !error ? `${totalAdults + totalChildren} คน` : "-"} subtitle="ผู้ใหญ่และเด็ก" loading={loading} />
      </div>

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xs" aria-label="รายการทัวร์ที่แวะจุดบริการ">
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="ค้นหาทัวร์"
              placeholder="ค้นหาชื่อทัวร์, ทะเบียนรถ, ชื่อบัส..."
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
            <p className="mt-3 text-sm font-semibold text-zinc-700">กำลังตรวจสอบข้อมูลทัวร์...</p>
            <p className="text-xs text-zinc-400">กรุณารอสักครู่</p>
          </div>
        ) : error ? null : filteredTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-lg bg-zinc-100 text-zinc-400"><Bus size={25} /></span>
            <h3 className="mt-3 text-sm font-semibold text-zinc-900">{data.location ? "ยังไม่มีทัวร์ที่แวะจุดบริการในช่วงนี้" : "ยังไม่สามารถแสดงทัวร์ที่มาร้านได้"}</h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-500">
              {!data.location
                ? "กรุณาให้ผู้ดูแลระบบผูก Location ของร้านและจุดแวะในแพ็กเกจ"
                : search || selectedFilter !== "all"
                  ? "ไม่พบข้อมูลทัวร์ที่ตรงกับคำค้นหาหรือตัวกรองที่เลือก"
                  : "ทัวร์จะแสดงเมื่อแพ็กเกจระบุจุดแวะนี้ในกำหนดการ"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredTrips.map((trip) => (
              <article key={trip.id} className="flex flex-col justify-between rounded-lg border border-zinc-200 bg-white p-4 shadow-2xs">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-blue-50 text-[#0051c8]"><CalendarDays size={18} /></span>
                      <div className="min-w-0">
                        <h4 className="line-clamp-2 text-sm font-semibold text-zinc-900">{trip.packageName}</h4>
                        <p className="text-xs text-zinc-500">วันแวะ {formatDate(trip.arrivalDate)} · วันที่ {trip.stopDay} ของทัวร์</p>
                      </div>
                    </div>
                  </div>
                  <dl className="mt-4 space-y-2 rounded-md bg-zinc-50 p-3 text-xs">
                    <div className="flex justify-between gap-2"><dt className="text-zinc-500">วันออกเดินทาง</dt><dd className="font-medium text-zinc-800">{formatDate(trip.departureDate)}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-zinc-500">ผู้ใหญ่</dt><dd className="font-medium text-zinc-800">{trip.adultCount} คน</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-zinc-500">เด็ก</dt><dd className="font-medium text-zinc-800">{trip.childCount} คน</dd></div>
                    <div className="flex justify-between gap-2 border-t border-zinc-200 pt-2"><dt className="font-semibold text-zinc-700">รวมผู้เดินทาง</dt><dd className="font-semibold text-[#0051c8]">{trip.passengerCount} คน</dd></div>
                  </dl>
                  <p className="mt-3 text-xs text-zinc-500"><Bus size={13} className="mr-1 inline" />รถที่ผูกกับแพ็กเกจ: {(trip.buses || []).length ? trip.buses.map((bus) => `${bus.name}${bus.plate ? ` (${bus.plate})` : ""}`).join(", ") : "ยังไม่ได้กำหนด"}</p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-[11px] text-zinc-500">
                  <span className="flex min-w-0 items-center gap-1"><MapPin size={12} className="shrink-0 text-[#0051c8]" /><span className="truncate">แวะจุด: <strong>{trip.locationName}</strong></span></span>
                  <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px]">{(trip.buses || []).length} คันในแพ็กเกจ</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
