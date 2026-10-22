"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bus, CalendarDays, Check, RefreshCw, Search, Users } from "lucide-react";
import SeatMap from "@/components/bus/SeatMap";
import { seatingService } from "@/service/seating";

export default function BackofficeSeatingPage() {
  const [bookings, setBookings] = useState([]);
  const [detail, setDetail] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [activePassenger, setActivePassenger] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBookings = useCallback(async () => {
    try {
      setBookings(await seatingService.getPaidBookings());
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "โหลดรายการจองไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadBookings, 0);
    return () => clearTimeout(timer);
  }, [loadBookings]);

  const openBooking = async (id) => {
    setLoadingDetail(true);
    setMessage("");
    setError("");
    try {
      const result = await seatingService.getBooking(id);
      setDetail(result);
      setAssignments(result.assignments.map(({ passenger_index, bus_id, seat_code }) => ({ passenger_index, bus_id, seat_code })));
      setActivePassenger(0);
    } catch (err) {
      setError(err.response?.data?.message || "โหลดผังที่นั่งไม่สำเร็จ");
    } finally {
      setLoadingDetail(false);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter((booking) => [booking.booking_code, booking.contact_name, booking.package.name]
      .some((value) => value?.toLowerCase().includes(query)));
  }, [bookings, search]);

  const chooseSeat = (busId, seatCode) => {
    if (detail.taken.some((seat) => seat.bus_id === busId && seat.seat_code === seatCode)) return;
    if (assignments.some((seat) => seat.bus_id === busId && seat.seat_code === seatCode && seat.passenger_index !== activePassenger)) return;
    setAssignments((current) => {
      const previous = current.find((seat) => seat.passenger_index === activePassenger);
      const others = current.filter((seat) => seat.passenger_index !== activePassenger);
      return previous?.bus_id === busId && previous?.seat_code === seatCode
        ? others
        : [...others, { passenger_index: activePassenger, bus_id: busId, seat_code: seatCode }];
    });
    setMessage("");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await seatingService.save(detail.booking.id, assignments);
      await openBooking(detail.booking.id);
      await loadBookings();
      setMessage("บันทึกที่นั่งแล้ว");
    } catch (err) {
      setError(err.response?.data?.message || "บันทึกที่นั่งไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const selected = assignments.find((seat) => seat.passenger_index === activePassenger);

  return (
    <div className="flex flex-col gap-5 xl:h-[calc(100dvh-6rem)] xl:overflow-hidden">
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

      <div className="grid gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <div className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 xl:h-full">
          <div className="flex shrink-0 items-center justify-between">
            <h2 className="font-semibold text-zinc-900">การจองที่ชำระแล้ว</h2>
            <button type="button" onClick={loadBookings} aria-label="โหลดรายการใหม่" className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100"><RefreshCw size={16} /></button>
          </div>
          <label className="mt-3 flex shrink-0 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-zinc-400">
            <Search size={15} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหารหัส ชื่อ หรือแพ็กเกจ" className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none" />
          </label>
          <div className="thin-scrollbar mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {loading ? <p className="p-4 text-sm text-zinc-500">กำลังโหลด...</p> : filtered.length === 0 ? <p className="p-4 text-sm text-zinc-500">ไม่มีการจองที่ชำระแล้ว</p> : filtered.map((booking) => (
              <button key={booking.id} type="button" onClick={() => openBooking(booking.id)} className={`w-full rounded-lg border p-3 text-left transition ${detail?.booking.id === booking.id ? "border-blue-400 bg-blue-50" : "border-zinc-200 hover:border-blue-300"}`}>
                <p className="text-sm font-semibold text-zinc-900">{booking.booking_code}</p>
                <p className="mt-1 text-xs text-zinc-600">{booking.contact_name} · {booking.package.name}</p>
                <p className="mt-1 text-xs text-zinc-500">จัดแล้ว {booking.assigned_count}/{booking.passenger_count} ที่นั่ง</p>
              </button>
            ))}
          </div>
        </div>

        <div className="thin-scrollbar h-[calc(100dvh-6rem)] min-h-0 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 xl:h-full">
          {loadingDetail ? <p className="py-16 text-center text-sm text-zinc-500">กำลังโหลดผังที่นั่ง...</p> : !detail ? (
            <p className="py-16 text-center text-sm text-zinc-500">เลือกการจองทางซ้ายเพื่อจัดที่นั่ง</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">{detail.booking.package_name}</h2>
                  <p className="mt-1 text-sm text-zinc-600">{detail.booking.contact_name} · {detail.booking.booking_code}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500"><CalendarDays size={14} /> {new Date(detail.booking.travel_date).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "medium" })}</p>
                </div>
                <button type="button" onClick={save} disabled={saving || detail.buses.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><Check size={16} /> {saving ? "กำลังบันทึก..." : "บันทึกที่นั่ง"}</button>
              </div>

              {detail.buses.length === 0 ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">แพ็กเกจนี้ยังไม่ได้เลือกรถบัส กรุณาไปหน้าแก้ไขแพ็กเกจก่อน</p> : (
                <>
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 font-semibold text-zinc-900"><Users size={16} /> ผู้โดยสาร ({detail.booking.passenger_count})</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: detail.booking.passenger_count }, (_, index) => {
                        const seat = assignments.find((item) => item.passenger_index === index);
                        const bus = detail.buses.find((item) => item.id === seat?.bus_id);
                        return <button key={index} type="button" onClick={() => setActivePassenger(index)} className={`rounded-lg border px-3 py-2 text-left text-sm ${activePassenger === index ? "border-blue-500 bg-blue-50 text-blue-800" : "border-zinc-200 text-zinc-700 hover:border-blue-300"}`}>
                          <span className="font-medium">{detail.booking.travelers[index]?.full_name || `ผู้โดยสาร ${index + 1}`}</span>
                          <span className="ml-2 text-xs">{seat ? `${bus?.name || "รถ"} ${seat.seat_code.toUpperCase()}` : "ยังไม่มีที่นั่ง"}</span>
                        </button>;
                      })}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">เลือกผู้โดยสารที่ต้องการจัดที่นั่งก่อน สีเทาคือที่นั่งที่มีผู้ใช้แล้วในรถคันนี้และวันเดินทางเดียวกัน คนละวันสามารถใช้ที่นั่งเดิมได้ กดที่นั่งเดิมอีกครั้งเพื่อลบการเลือก</p>
                  {selected && <button type="button" onClick={() => setAssignments((current) => current.filter((seat) => seat.passenger_index !== activePassenger))} className="text-xs font-semibold text-rose-600 hover:underline">ลบที่นั่งของผู้โดยสารที่เลือก</button>}
                  <div className="space-y-5">
                    {detail.buses.map((bus) => {
                      const taken = detail.taken.filter((seat) => seat.bus_id === bus.id).map((seat) => seat.seat_code);
                      taken.push(...assignments.filter((seat) => seat.bus_id === bus.id && seat.passenger_index !== activePassenger).map((seat) => seat.seat_code));
                      return <div key={bus.id} className="rounded-xl border border-zinc-200 p-4">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Bus size={17} className="text-blue-600" />
                          <h3 className="font-semibold text-zinc-900">{bus.name}</h3>
                          <span className="text-xs text-zinc-500">{bus.plate || "ไม่ระบุทะเบียน"} · {bus.seat_count} ที่นั่ง</span>
                          {bus.status !== "ACTIVE" && <span className="text-xs text-amber-700">รถหยุดใช้</span>}
                        </div>
                        <div className="overflow-x-auto"><SeatMap layout={bus.layout} taken={taken} selected={selected?.bus_id === bus.id ? [selected.seat_code] : []} onToggle={bus.status === "ACTIVE" ? (code) => chooseSeat(bus.id, code) : undefined} /></div>
                      </div>;
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
