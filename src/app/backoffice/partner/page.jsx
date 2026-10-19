"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  FolderTree,
  Handshake,
  Layers,
  Lock,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import PartnerModal from "@/components/partner/PartnerModal";
import PartnerTypeModal from "@/components/partner/PartnerTypeModal";
import DeleteConfirmModal from "@/components/partner/DeleteConfirmModal";
import PartnerTable from "@/components/partner/PartnerTable";
import PageHeader from "@/components/backoffice/PageHeader";
import StatCard from "@/components/backoffice/StatCard";
import { partnerService, partnerTypeService } from "@/service/partner";
import supplierService from "@/service/supplier";

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
  const [accessPartner, setAccessPartner] = useState(null);
  const [accessPassword, setAccessPassword] = useState("");
  const [accessError, setAccessError] = useState("");
  const [accessLoading, setAccessLoading] = useState(false);

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

  const handleSetSupplierAccess = async (event) => {
    event.preventDefault();
    if (!accessPartner) return;
    if (accessPassword.length < 6) {
      setAccessError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    try {
      setAccessLoading(true);
      setAccessError("");
      const result = await supplierService.admin.setPartnerAccess(accessPartner.id, accessPassword);
      setAccessPartner(null);
      setAccessPassword("");
      showToast(result.data?.status === "ปิดใช้งาน"
        ? "ตั้งรหัสแล้ว แต่บัญชีถูกปิดใช้งาน กรุณาเปิดที่หน้าบัญชี Supplier"
        : "ตั้งรหัส Supplier สำเร็จ ร้านใช้อีเมลพาร์ทเนอร์เข้าระบบได้แล้ว");
    } catch (error) {
      setAccessError(error.response?.data?.message || "ไม่สามารถตั้งรหัส Supplier ได้");
    } finally {
      setAccessLoading(false);
    }
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
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 shadow-xl transition-all animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <PageHeader
        title="จัดการพาร์ทเนอร์"
        titleEn="Partners"
        description="จัดการข้อมูลคู่ค้าทางธุรกิจ โรงแรม ยานพาหนะ และประเภทพาร์ทเนอร์สำหรับแพ็กเกจทัวร์"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refreshData}
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
              <span>จัดการประเภท ({partnerTypes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingPartner(null);
                setIsPartnerModalOpen(true);
              }}
              className="btn-primary h-8 px-3.5 text-xs rounded-lg cursor-pointer"
            >
              <Plus size={13} />
              <span>เพิ่มพาร์ทเนอร์ใหม่</span>
            </button>
          </div>
        }
      />

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          title="พาร์ทเนอร์ทั้งหมด"
          value={`${partners.length} ราย`}
          icon={Handshake}
          subtitle="คู่ค้าและพันธมิตรในระบบ"
        />

        <StatCard
          title="ประเภทพาร์ทเนอร์"
          value={`${partnerTypes.length} หมวดหมู่`}
          icon={Layers}
          subtitle="หมวดหมู่ธุรกิจ"
        />

        <StatCard
          title="ระบุที่อยู่ชัดเจน"
          value={`${partnersWithAddressCount} ราย`}
          icon={MapPin}
          subtitle={`จากทั้งหมด ${partners.length} ราย`}
        />
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
        onSetSupplierPassword={(partner) => {
          setAccessPartner(partner);
          setAccessPassword("");
          setAccessError("");
        }}
      />

      {accessPartner && (
        <div role="dialog" aria-modal="true" aria-label="ตั้งรหัสเข้าระบบ Supplier" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form onSubmit={handleSetSupplierAccess} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900">ตั้งรหัสเข้าระบบ Supplier</h2>
              <p className="mt-1 text-sm text-slate-600">{accessPartner.name}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              <p>อีเมลเข้าระบบ: <strong>{accessPartner.email}</strong></p>
              <p>Location: <strong>{accessPartner.location?.name || "ยังไม่ได้ผูก"}</strong></p>
            </div>
            {!accessPartner.location && (
              <p className="text-xs text-amber-700">ตั้งรหัสได้เลย แต่ร้านจะยังไม่เห็นเที่ยวรถจนกว่าจะเลือก Location ในหน้าแก้ไขพาร์ทเนอร์</p>
            )}
            <p className="text-xs text-slate-500">หากร้านมีบัญชี Supplier อยู่แล้ว การบันทึกจะเปลี่ยนรหัสของบัญชีนั้น</p>
            <label className="block text-sm font-medium text-slate-700">
              รหัสผ่านร้าน (อย่างน้อย 6 ตัวอักษร)
              <span className="relative mt-1 flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={accessPassword}
                  onChange={(event) => setAccessPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-blue-500"
                />
              </span>
            </label>
            {accessError && <p role="alert" className="text-sm text-rose-600">{accessError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAccessPartner(null)} className="btn-secondary px-4 py-2 text-sm">ยกเลิก</button>
              <button type="submit" disabled={accessLoading} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                {accessLoading ? "กำลังบันทึก..." : "บันทึกรหัสร้าน"}
              </button>
            </div>
          </form>
        </div>
      )}

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
