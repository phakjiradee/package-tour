"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  FolderTree,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import LocationModal from "@/components/location/LocationModal";
import LocationTypeModal from "@/components/location/LocationTypeModal";
import DeleteConfirmModal from "@/components/location/DeleteConfirmModal";
import LocationTable from "@/components/location/LocationTable";
import { locationService, locationTypeService } from "@/service/location";

export default function LocationPage() {
  const [locations, setLocations] = useState([]);
  const [locationTypes, setLocationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected item for Edit / Delete
  const [editingLocation, setEditingLocation] = useState(null);
  const [deletingLocation, setDeletingLocation] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch all data
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [locationsRes, typesRes] = await Promise.all([
        locationService.getAll(),
        locationTypeService.getAll(),
      ]);

      setLocations(Array.isArray(locationsRes) ? locationsRes : []);
      setLocationTypes(Array.isArray(typesRes) ? typesRes : []);
    } catch (err) {
      console.error("Error fetching locations/types:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Location Add / Update
  const handleSaveLocation = async (payload) => {
    if (editingLocation) {
      await locationService.update(editingLocation.id, payload);
      showToast("แก้ไขข้อมูลสถานที่เรียบร้อยแล้ว");
    } else {
      await locationService.create(payload);
      showToast("เพิ่มสถานที่ใหม่เรียบร้อยแล้ว");
    }
    await fetchData(true);
  };

  // Handle Location Delete
  const handleConfirmDelete = async () => {
    if (!deletingLocation) return;
    try {
      setDeleteLoading(true);
      await locationService.delete(deletingLocation.id);
      showToast("ลบสถานที่เรียบร้อยแล้ว");
      setIsDeleteModalOpen(false);
      setDeletingLocation(null);
      await fetchData(true);
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "เกิดข้อผิดพลาดในการลบสถานที่");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Location Types
  const handleCreateType = async (payload) => {
    await locationTypeService.create(payload);
    showToast("เพิ่มประเภทสถานที่ใหม่แล้ว");
    await fetchData(true);
  };

  const handleUpdateType = async (id, payload) => {
    await locationTypeService.update(id, payload);
    showToast("แก้ไขประเภทสถานที่แล้ว");
    await fetchData(true);
  };

  const handleDeleteType = async (id) => {
    await locationTypeService.delete(id);
    showToast("ลบประเภทสถานที่แล้ว");
    await fetchData(true);
  };

  // Top category calculation
  const topType = (() => {
    if (locations.length === 0 || locationTypes.length === 0) return null;
    const counts = {};
    locations.forEach((loc) => {
      const typeName = loc.lct_type?.name || "ไม่ระบุ";
      counts[typeName] = (counts[typeName] || 0) + 1;
    });
    let topName = "";
    let topCount = 0;
    Object.entries(counts).forEach(([name, count]) => {
      if (count > topCount) {
        topName = name;
        topCount = count;
      }
    });
    return { name: topName, count: topCount };
  })();

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xl transition-all animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  จัดการสถานที่ (Locations)
                </h1>
                <span className="rounded-full bg-cyan-100/80 px-2.5 py-0.5 text-xs font-semibold text-cyan-800">
                  {locations.length} แห่ง
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                จัดการข้อมูลจุดหมายปลายทาง แหล่งท่องเที่ยว และจัดหมวดหมู่ประเภทสถานที่สำหรับแพ็กเกจทัวร์
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-cyan-600" : ""}`} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTypeModalOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 text-xs font-semibold text-purple-700 shadow-xs transition hover:bg-purple-100 hover:text-purple-800"
            >
              <FolderTree className="h-4 w-4" />
              จัดการประเภท ({locationTypes.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingLocation(null);
                setIsLocationModalOpen(true);
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              เพิ่มสถานที่ใหม่
            </button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-3.5 rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100/70 text-cyan-700">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">สถานที่ทั้งหมด</p>
              <p className="text-lg font-bold text-slate-900">{locations.length} แห่ง</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100/70 text-purple-700">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">ประเภทสถานที่</p>
              <p className="text-lg font-bold text-slate-900">{locationTypes.length} หมวดหมู่</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100/70 text-amber-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">หมวดหมู่ยอดนิยม</p>
              <p className="text-lg font-bold text-slate-900 truncate">
                {topType ? `${topType.name} (${topType.count})` : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <LocationTable
        locations={locations}
        locationTypes={locationTypes}
        loading={loading}
        onAddNew={() => {
          setEditingLocation(null);
          setIsLocationModalOpen(true);
        }}
        onEdit={(location) => {
          setEditingLocation(location);
          setIsLocationModalOpen(true);
        }}
        onDelete={(location) => {
          setDeletingLocation(location);
          setIsDeleteModalOpen(true);
        }}
      />

      {/* Location Modal (Create / Edit) */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false);
          setEditingLocation(null);
        }}
        onSubmit={handleSaveLocation}
        initialData={editingLocation}
        locationTypes={locationTypes}
        onOpenTypeModal={() => setIsTypeModalOpen(true)}
      />

      {/* Location Type Modal */}
      <LocationTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        locationTypes={locationTypes}
        onCreateType={handleCreateType}
        onUpdateType={handleUpdateType}
        onDeleteType={handleDeleteType}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingLocation(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="ยืนยันการลบสถานที่"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบสถานที่ "${deletingLocation?.name}"? ข้อมูลสถานที่นี้จะถูกลบออกจากระบบ`}
      />
    </div>
  );
}
