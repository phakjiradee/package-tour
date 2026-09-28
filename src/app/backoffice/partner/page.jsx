"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  FolderTree,
  Handshake,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import PartnerModal from "@/components/partner/PartnerModal";
import PartnerTypeModal from "@/components/partner/PartnerTypeModal";
import DeleteConfirmModal from "@/components/partner/DeleteConfirmModal";
import PartnerTable from "@/components/partner/PartnerTable";
import { partnerService, partnerTypeService } from "@/service/partner";

export default function PartnerPage() {
  const [partners, setPartners] = useState([]);
  const [partnerTypes, setPartnerTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected item for Edit / Delete
  const [editingPartner, setEditingPartner] = useState(null);
  const [deletingPartner, setDeletingPartner] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Re-fetch data on demand (silent background update)
  const refreshData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [partnersRes, typesRes] = await Promise.all([
        partnerService.getAll(),
        partnerTypeService.getAll(),
      ]);

      setPartners(Array.isArray(partnersRes) ? partnersRes : []);
      setPartnerTypes(Array.isArray(typesRes) ? typesRes : []);
    } catch (err) {
      console.error("Error refreshing partners/types:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      try {
        const [partnersRes, typesRes] = await Promise.all([
          partnerService.getAll(),
          partnerTypeService.getAll(),
        ]);
        if (isSubscribed) {
          setPartners(Array.isArray(partnersRes) ? partnersRes : []);
          setPartnerTypes(Array.isArray(typesRes) ? typesRes : []);
        }
      } catch (err) {
        if (isSubscribed) {
          console.error("Error fetching partners/types:", err);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Handle Partner Add / Update
  const handleSavePartner = async (payload) => {
    if (editingPartner) {
      await partnerService.update(editingPartner.id, payload);
      showToast("แก้ไขข้อมูลพาร์ทเนอร์เรียบร้อยแล้ว");
    } else {
      await partnerService.create(payload);
      showToast("เพิ่มพาร์ทเนอร์ใหม่เรียบร้อยแล้ว");
    }
    await refreshData();
  };

  // Handle Partner Delete
  const handleConfirmDelete = async () => {
    if (!deletingPartner) return;
    try {
      setDeleteLoading(true);
      await partnerService.delete(deletingPartner.id);
      showToast("ลบพาร์ทเนอร์เรียบร้อยแล้ว");
      setIsDeleteModalOpen(false);
      setDeletingPartner(null);
      await refreshData();
    } catch (err) {
      console.error("Delete partner error:", err);
      alert(err.response?.data?.message || "เกิดข้อผิดพลาดในการลบพาร์ทเนอร์");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Partner Types
  const handleCreateType = async (payload) => {
    await partnerTypeService.create(payload);
    showToast("เพิ่มประเภทพาร์ทเนอร์ใหม่แล้ว");
    await refreshData();
  };

  const handleUpdateType = async (id, payload) => {
    await partnerTypeService.update(id, payload);
    showToast("แก้ไขประเภทพาร์ทเนอร์แล้ว");
    await refreshData();
  };

  const handleDeleteType = async (id) => {
    await partnerTypeService.delete(id);
    showToast("ลบประเภทพาร์ทเนอร์แล้ว");
    await refreshData();
  };

  // Top category calculation
  const topType = (() => {
    if (partners.length === 0 || partnerTypes.length === 0) return null;
    const counts = {};
    partners.forEach((pt) => {
      const typeName = pt.pt_type?.name || "ไม่ระบุ";
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

  const partnersWithAddressCount = partners.filter(
    (pt) => pt.address && pt.address.trim()
  ).length;

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
              <Handshake className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  จัดการพาร์ทเนอร์ (Partners)
                </h1>
                <span className="rounded-full bg-cyan-100/80 px-2.5 py-0.5 text-xs font-semibold text-cyan-800">
                  {partners.length} ราย
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                จัดการข้อมูลคู่ค้าทางธุรกิจ โรงแรม ยานพาหนะ ร้านอาหาร และประเภทพาร์ทเนอร์สำหรับแพ็กเกจทัวร์
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={refreshData}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin text-cyan-600" : ""
                }`}
              />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTypeModalOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 text-xs font-semibold text-purple-700 shadow-xs transition hover:bg-purple-100 hover:text-purple-800 cursor-pointer"
            >
              <FolderTree className="h-4 w-4" />
              จัดการประเภท ({partnerTypes.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingPartner(null);
                setIsPartnerModalOpen(true);
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              เพิ่มพาร์ทเนอร์ใหม่
            </button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-3.5 rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100/70 text-cyan-700">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                พาร์ทเนอร์ทั้งหมด
              </p>
              <p className="text-lg font-bold text-slate-900">
                {partners.length} ราย
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100/70 text-purple-700">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                ประเภทพาร์ทเนอร์
              </p>
              <p className="text-lg font-bold text-slate-900">
                {partnerTypes.length} หมวดหมู่
              </p>
            </div>
          </div>

          

          <div className="flex items-center gap-3.5 rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100/70 text-emerald-700">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                ระบุที่อยู่ชัดเจน
              </p>
              <p className="text-lg font-bold text-slate-900">
                {partnersWithAddressCount} / {partners.length} ราย
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <PartnerTable
        partners={partners}
        partnerTypes={partnerTypes}
        loading={loading}
        onAddNew={() => {
          setEditingPartner(null);
          setIsPartnerModalOpen(true);
        }}
        onEdit={(partner) => {
          setEditingPartner(partner);
          setIsPartnerModalOpen(true);
        }}
        onDelete={(partner) => {
          setDeletingPartner(partner);
          setIsDeleteModalOpen(true);
        }}
      />

      {/* Partner Modal (Create / Edit) */}
      {isPartnerModalOpen && (
        <PartnerModal
          key={editingPartner ? `edit-${editingPartner.id}` : "create"}
          isOpen={isPartnerModalOpen}
          onClose={() => {
            setIsPartnerModalOpen(false);
            setEditingPartner(null);
          }}
          onSubmit={handleSavePartner}
          initialData={editingPartner}
          partnerTypes={partnerTypes}
          onOpenTypeModal={() => setIsTypeModalOpen(true)}
        />
      )}

      {/* Partner Type Modal */}
      <PartnerTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        partnerTypes={partnerTypes}
        onCreateType={handleCreateType}
        onUpdateType={handleUpdateType}
        onDeleteType={handleDeleteType}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingPartner(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="ยืนยันการลบพาร์ทเนอร์"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบพาร์ทเนอร์ "${deletingPartner?.name}"? ข้อมูลพาร์ทเนอร์นี้จะถูกลบออกจากระบบ`}
      />
    </div>
  );
}
