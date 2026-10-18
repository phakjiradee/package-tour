"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  Bus,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  LogOut,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Store,
  User,
  Users,
} from "lucide-react";
import supplierService from "@/service/supplier";
import { clearSupplierAuth, getSupplierAuth } from "@/lib/supplier-auth";

export default function SupplierDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [data, setData] = useState({ partner: null, location: null, trips: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all"); // 'all' | 'today' | 'upcoming'

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
      // หาก unauthorized หรือ token หมดอายุ
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

  const handleLogout = () => {
    clearSupplierAuth();
    router.push("/supplier/login");
    router.refresh();
  };

  // Filter trips
  const filteredTrips = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = data.trips;

    if (q) {
      list = list.filter(
        (t) =>
          t.packageName?.toLowerCase().includes(q) ||
          t.busName?.toLowerCase().includes(q) ||
          t.busPlate?.toLowerCase().includes(q) ||
          t.locationName?.toLowerCase().includes(q)
      );
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (selectedFilter === "today") {
      list = list.filter((t) => {
        if (!t.startDate) return false;
        const dStr = new Date(t.startDate).toISOString().split("T")[0];
        return dStr === todayStr;
      });
    } else if (selectedFilter === "upcoming") {
      list = list.filter((t) => {
        if (!t.startDate) return true;
        return new Date(t.startDate) >= now;
      });
    }

    return list;
  }, [data.trips, search, selectedFilter]);

  // Aggregate stats
  const totalBuses = data.trips.reduce((acc, t) => acc + (t.busCount || 1), 0);
  const totalPassengers = data.trips.reduce((acc, t) => acc + (t.passengerCount || 0), 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return "ไม่ระบุวัน";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          {/* Logo & Portal Info */}
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-white sm:text-base">
                  ZENTURA <span className="text-cyan-400">SUPPLIER</span>
                </span>
                <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                  Partner Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                ระบบข้อมูลการมาถึงของรถบัส ณ จุดบริการของคุณ
              </p>
            </div>
          </div>

          {/* Right User & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-white">
                {currentUser?.name || "ผู้ใช้งาน Supplier"}
              </p>
              <p className="text-[11px] text-slate-400">
                {currentUser?.partner?.name || "พาร์ทเนอร์"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-300 transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* Partner & Location Highlight Banner */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-xl relative">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  คู่ค้า / พาร์ทเนอร์ที่สังกัด
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-black text-white">
                {data.partner?.name || currentUser?.partner?.name || "พาร์ทเนอร์"}
              </h2>

              {/* Location Badge */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {data.location?.name ? (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-1.5 text-xs font-bold text-cyan-200">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    <span>จุดบริการที่เชื่อมต่อ: {data.location.name}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/40 px-3.5 py-1.5 text-xs font-bold text-amber-200">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    <span>ยังไม่ได้กำหนด Location ให้พาร์ทเนอร์นี้</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 text-xs font-semibold text-slate-200 shadow-sm transition hover:bg-slate-700 disabled:opacity-50 cursor-pointer self-start md:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>รีเฟรชข้อมูล</span>
            </button>
          </div>
        </div>

        {/* Warning if no location */}
        {!data.location && !loading && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-100">พาร์ทเนอร์ยังไม่ได้เชื่อมต่อสถานที่ (Location)</h4>
                <p className="mt-1 text-xs text-amber-200/90 leading-relaxed">
                  เนื่องจากบัญชีพาร์ทเนอร์นี้ยังไม่มีการระบุสถานที่ จึงยังไม่สามารถระบุเที่ยวรถบัสที่จะเข้ามาจุดบริการของคุณได้
                  กรุณาแจ้งผู้ดูแลระบบ (Admin) ให้ผูกสถานที่ (Location) ในเมนูพาร์ทเนอร์
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Row */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">รถบัสที่จะมาทั้งหมด</span>
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10 text-blue-400">
                <Bus className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-white">{totalBuses} <span className="text-sm font-normal text-slate-400">คัน</span></p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">รอบทริป / กำหนดการ</span>
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-cyan-400">{data.trips.length} <span className="text-sm font-normal text-slate-400">รอบ</span></p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">ผู้โดยสารโดยประมาณ</span>
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-400">{totalPassengers} <span className="text-sm font-normal text-slate-400">คน</span></p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อแพ็กเกจทัวร์, ทะเบียนรถ, ชื่อบัส..."
              className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => setSelectedFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                selectedFilter === "all"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ทริปทั้งหมด ({data.trips.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter("upcoming")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                selectedFilter === "upcoming"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              กำลังจะมาถึง
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter("today")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                selectedFilter === "today"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              เฉพาะวันนี้
            </button>
          </div>
        </div>

        {/* Trips List / Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/50 py-16 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="mt-3 text-sm font-semibold text-slate-300">กำลังตรวจสอบข้อมูลเที่ยวรถบัส...</p>
            <p className="text-xs text-slate-500">กรุณารอสักครู่</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/50 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-900 text-slate-500">
              <Bus className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">ยังไม่มีรถบัสที่กำหนดมาถึงในช่วงนี้</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              {search || selectedFilter !== "all"
                ? "ไม่พบข้อมูลเที่ยวรถที่ตรงกับคำค้นหาหรือตัวกรองที่เลือก"
                : "เมื่อมีการจัดทริปหรือรอบการเดินทางที่แวะสถานที่ของคุณ ข้อมูลรถบัสและเวลาจะแสดงที่นี่อัตโนมัติ"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-lg transition hover:border-slate-700 hover:shadow-cyan-500/5"
              >
                <div>
                  {/* Card Top: Bus Name & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                        <Bus className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm group-hover:text-cyan-300 transition">
                          {trip.busName}
                        </h4>
                        <p className="font-mono text-xs text-slate-400">
                          ทะเบียน: {trip.busPlate}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{trip.busCount} คัน</span>
                    </span>
                  </div>

                  {/* Tour Package Title */}
                  <div className="mt-4 border-t border-slate-800/80 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      แพ็กเกจทัวร์
                    </span>
                    <p className="mt-0.5 font-semibold text-slate-100 text-xs line-clamp-2">
                      {trip.packageName}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="mt-4 space-y-2 rounded-xl bg-slate-900/60 p-3 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                        <span>วันเดินทาง:</span>
                      </div>
                      <span className="font-medium text-slate-200">
                        {formatDate(trip.startDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-cyan-400" />
                        <span>ช่วงเวลาที่มาถึง:</span>
                      </div>
                      <span className="font-mono font-medium text-cyan-300">
                        {trip.timeWindow}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Users className="h-3.5 w-3.5 text-cyan-400" />
                        <span>ผู้โดยสาร:</span>
                      </div>
                      <span className="font-bold text-white">
                        {trip.passengerCount > 0 ? `${trip.passengerCount} ท่าน` : "รอยืนยันยอด"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Location Badge */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-cyan-400" />
                    <span>แวะจุด: <strong>{trip.locationName}</strong></span>
                  </div>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                    แวะวันที่ {trip.stopDays?.join(", ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
