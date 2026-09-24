"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ConfigProvider,
  Modal,
  Popconfirm,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  Edit3,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { positionService } from "@/service/position";
import { PositionBadge } from "@/components/ui/Badges";
import { formatThaiDateTime } from "@/lib/date";

export default function PositionPage() {
  const [messageApi, contextHolder] = message.useMessage();

  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    access: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch positions from backend
  const fetchData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      try {
        const data = await positionService.getAll();
        setPositions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching positions:", error);
        messageApi.error("ไม่สามารถโหลดข้อมูลตำแหน่งได้");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [messageApi]
  );

  useEffect(() => {
    let isSubscribed = true;

    const loadInitialData = async () => {
      try {
        const data = await positionService.getAll();
        if (isSubscribed) {
          setPositions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isSubscribed) {
          console.error("Initial load error:", error);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Filtered positions
  const filteredPositions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return positions;

    return positions.filter(
      (pos) =>
        (pos.title && pos.title.toLowerCase().includes(keyword)) ||
        (pos.access && pos.access.toLowerCase().includes(keyword))
    );
  }, [positions, search]);

  const clearFilters = () => {
    setSearch("");
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingId(null);
    setFormData({
      title: "",
      access: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (position) => {
    setModalMode("edit");
    setEditingId(position.id);
    setFormData({
      title: position.title || position.name || "",
      access: position.access || "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = "กรุณากรอกชื่อตำแหน่ง";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (modalMode === "create") {
        await positionService.create({
          title: formData.title.trim(),
          access: formData.access.trim() || "General access",
        });
        messageApi.success("เพิ่มตำแหน่งใหม่เรียบร้อยแล้ว");
      } else {
        await positionService.update(editingId, {
          title: formData.title.trim(),
          access: formData.access.trim() || "General access",
        });
        messageApi.success("แก้ไขข้อมูลตำแหน่งเรียบร้อยแล้ว");
      }
      setIsModalOpen(false);
      await fetchData(true);
    } catch (error) {
      console.error("Save position error:", error);
      messageApi.error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกตำแหน่ง"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete position
  const handleDelete = async (position) => {
    try {
      await positionService.delete(position.id);
      messageApi.success(`ลบตำแหน่ง "${position.title || position.name}" เรียบร้อยแล้ว`);
      await fetchData(true);
    } catch (error) {
      console.error("Delete position error:", error);
      messageApi.error(
        error.response?.data?.message || "ไม่สามารถลบตำแหน่งได้"
      );
    }
  };

  // Table Columns
  const columns = useMemo(
    () => [
      {
        title: "ลำดับ",
        key: "index",
        width: 65,
        align: "center",
        render: (_value, _record, index) => (
          <span className="text-sm font-medium text-slate-500">{index + 1}</span>
        ),
      },
      {
        title: "ชื่อตำแหน่ง",
        dataIndex: "title",
        key: "title",
        width: 180,
        render: (title) => (
          <div className="flex items-center gap-2">
            <PositionBadge position={title} />
          </div>
        ),
      },
      {
        title: "สิทธิ์การเข้าถึง / หน้าที่รับผิดชอบ",
        dataIndex: "access",
        key: "access",
        width: 280,
        render: (access) => (
          <span className="text-sm text-slate-600">
            {access || "General access"}
          </span>
        ),
      },
      {
        title: "จำนวนพนักงาน",
        dataIndex: "employees",
        key: "employees",
        width: 140,
        align: "center",
        render: (count) => (
          <Tag
            bordered={false}
            className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200"
          >
            {count || 0} คน
          </Tag>
        ),
      },
      {
        title: "วันที่สร้าง",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 160,
        render: (date) => (
          <span className="text-sm text-slate-600">
            {formatThaiDateTime(date)}
          </span>
        ),
      },
      {
        title: "วันที่อัพเดต",
        dataIndex: "updatedAt",
        key: "updatedAt",
        width: 160,
        render: (date) => (
          <span className="text-sm text-slate-600">
            {formatThaiDateTime(date)}
          </span>
        ),
      },
      {
        title: "จัดการ",
        key: "action",
        width: 100,
        align: "center",
        fixed: "right",
        render: (_value, record) => (
          <div className="flex items-center justify-center gap-1.5">
            <Tooltip title="แก้ไขตำแหน่ง">
              <button
                type="button"
                onClick={() => handleOpenEdit(record)}
                className="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700 cursor-pointer"
                aria-label={`แก้ไข ${record.title}`}
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </Tooltip>

            <Popconfirm
              title="ยืนยันการลบตำแหน่ง"
              description={
                record.employees > 0
                  ? `ไม่สามารถลบได้ เนื่องจากมีพนักงาน ${record.employees} คนใช้งานตำแหน่งนี้`
                  : `คุณต้องการลบตำแหน่ง "${record.title}" ใช่หรือไม่?`
              }
              onConfirm={() => {
                if (record.employees === 0) {
                  handleDelete(record);
                } else {
                  messageApi.warning(
                    `ไม่สามารถลบได้ มีพนักงาน ${record.employees} คนใช้งานอยู่`
                  );
                }
              }}
              okText={record.employees > 0 ? "รับทราบ" : "ลบข้อมูล"}
              cancelText="ยกเลิก"
              okButtonProps={{ danger: record.employees === 0 }}
            >
              <Tooltip title="ลบตำแหน่ง">
                <button
                  type="button"
                  className="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                  aria-label={`ลบ ${record.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Tooltip>
            </Popconfirm>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      {contextHolder}

      {/* Main card covering full viewport height with sticky internal scrolling */}
      <div className="flex flex-col h-[calc(100vh-7.5rem)] rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header / Filter Toolbar (Fixed at top of card) */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-200 bg-white">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <label className="flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-100 transition">
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="ค้นหาชื่อตำแหน่ง หรือสิทธิ์การเข้าถึง"
              />
            </label>

            {/* Clear Filters */}
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 cursor-pointer"
              title="ล้างตัวกรอง"
            >
              <RotateCcw className="h-4 w-4" />
              ล้างตัวกรอง
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 cursor-pointer disabled:opacity-60"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin text-cyan-600" : ""}`}
              />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>

            {/* Add Position Button */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" />
              เพิ่มตำแหน่ง
            </button>
          </div>
        </div>

        {/* Table Container - Expands to fill remaining height, scrolls internally */}
        <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden">
          <ConfigProvider
            theme={{
              token: {
                fontFamily: "var(--font-anuphan), sans-serif",
                colorText: "#0f172a",
                borderRadius: 8,
              },
              components: {
                Table: {
                  headerBg: "#f8fafc",
                  headerColor: "#475569",
                  headerSplitColor: "#e2e8f0",
                  rowHoverBg: "#f8fafc",
                  cellPaddingBlock: 12,
                  cellPaddingInline: 14,
                },
              },
            }}
          >
            <Table
              className="flex-1 flex flex-col overflow-hidden [&_.ant-spin-nested-loading]:flex-1 [&_.ant-spin-nested-loading]:flex [&_.ant-spin-nested-loading]:flex-col [&_.ant-spin-container]:flex-1 [&_.ant-spin-container]:flex [&_.ant-spin-container]:flex-col [&_.ant-table]:flex-1 [&_.ant-table-container]:flex-1 [&_.ant-table-container]:flex [&_.ant-table-container]:flex-col [&_.ant-table-body]:flex-1 [&_.ant-table-body]:overflow-y-auto"
              columns={columns}
              dataSource={filteredPositions}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1000, y: "calc(100vh - 295px)" }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50"],
                showTotal: (total, range) => (
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      แสดง {range[0]}-{range[1]} จากทั้งหมด {total} รายการ
                    </span>
                    {search && (
                      <span className="text-cyan-600 font-medium">
                        (กรองจากทั้งหมด {positions.length} รายการ)
                      </span>
                    )}
                  </div>
                ),
                className: "!px-5 !py-3 !m-0 border-t border-slate-200 shrink-0",
              }}
            />
          </ConfigProvider>
        </div>
      </div>

      {/* Modal for Create & Edit Position */}
      <Modal
        open={isModalOpen}
        onCancel={() => !submitting && setIsModalOpen(false)}
        footer={null}
        closable={false}
        destroyOnClose
        centered
        width={480}
        className="[&_.ant-modal-content]:!p-0 [&_.ant-modal-content]:!rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-5 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {modalMode === "create" ? "เพิ่มตำแหน่งใหม่" : "แก้ไขตำแหน่ง"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {modalMode === "create"
                ? "กำหนดชื่อตำแหน่งและสิทธิ์การเข้าถึงสำหรับพนักงาน"
                : `แก้ไขรายละเอียดของตำแหน่ง ${formData.title}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            disabled={submitting}
            className="inline-grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Position Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              ชื่อตำแหน่ง <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (formErrors.title) setFormErrors({ ...formErrors, title: null });
              }}
              placeholder="เช่น Tour Guide, Sales Manager"
              className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-sm text-slate-800 outline-none transition ${
                formErrors.title
                  ? "border-rose-400 ring-2 ring-rose-100"
                  : "border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              }`}
            />
            {formErrors.title && (
              <p className="mt-1 text-xs text-rose-500">{formErrors.title}</p>
            )}
          </div>

          {/* Access description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              สิทธิ์การเข้าถึง / หน้าที่ความรับผิดชอบ
            </label>
            <input
              type="text"
              value={formData.access}
              onChange={(e) =>
                setFormData({ ...formData, access: e.target.value })
              }
              placeholder="เช่น Full access, Booking and customer access"
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              ระบุคำอธิบายสิทธิ์หรือขอบเขตงาน เช่น Full access, Assigned tour access
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "บันทึกข้อมูล"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
