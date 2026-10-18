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
import PageHeader from "@/components/backoffice/PageHeader";
import StatCard from "@/components/backoffice/StatCard";
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
    let ignore = false;
    const run = async () => {
      await fetchData();
    };
    run();
    return () => {
      ignore = true;
    };
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

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 shadow-xl transition-all animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <PageHeader
        title="จัดการสถานที่"
        titleEn="Locations"
        description="จุดหมายปลายทาง แหล่งท่องเที่ยว และจัดหมวดหมู่ประเภทสถานที่สำหรับแพ็กเกจทัวร์"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="btn-secondary h-8 px-3 text-xs rounded-lg cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw
                size={13}
                className={refreshing ? "animate-spin text-zinc-500" : "text-zinc-500"}
              />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTypeModalOpen(true)}
              className="btn-secondary h-8 px-3 text-xs rounded-lg cursor-pointer"
            >
              <FolderTree size={13} className="text-purple-600" />
              <span>จัดการประเภท ({locationTypes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingLocation(null);
                setIsLocationModalOpen(true);
              }}
              className="btn-primary h-8 px-3.5 text-xs rounded-lg cursor-pointer"
            >
              <Plus size={13} />
              <span>เพิ่มสถานที่ใหม่</span>
            </button>
          </div>
        }
      />

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          title="สถานที่ทั้งหมด"
          value={`${locations.length} แห่ง`}
          icon={MapPin}
          subtitle="จุดหมายปลายทางในระบบ"
        />

        <StatCard
          title="ประเภทสถานที่"
          value={`${locationTypes.length} หมวดหมู่`}
          icon={Layers}
          subtitle="หมวดหมู่สถานที่ท่องเที่ยว"
        />
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
