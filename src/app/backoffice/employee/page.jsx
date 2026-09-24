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
  Check,
  Copy,
  Edit3,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { employeeService } from "@/service/employee";
import { PositionBadge, StatusBadge } from "@/components/ui/Badges";
import { formatThaiDateTime } from "@/lib/date";

const statusOptions = ["ใช้งาน", "พักงาน", "ปิดใช้งาน"];

export default function EmployeePage() {
  const [messageApi, contextHolder] = message.useMessage();

  // Data states
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("ทั้งหมด");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");

  // Modal states for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Success Modal for newly created employee with generated password
  const [createdEmployee, setCreatedEmployee] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Helper to generate a secure, readable temporary password
  const generateTempPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let pwd = "Zt#";
    for (let i = 0; i < 5; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Form values & validation errors
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "Admin",
    status: "ใช้งาน",
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch employees and roles from backend
  const fetchData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      try {
        const [empResult, rolesResult] = await Promise.allSettled([
          employeeService.getAll(),
          employeeService.getRoles(),
        ]);

        const empData =
          empResult.status === "fulfilled" && Array.isArray(empResult.value)
            ? empResult.value
            : [];
        const rolesData =
          rolesResult.status === "fulfilled" && Array.isArray(rolesResult.value)
            ? rolesResult.value
            : [];

        setEmployees(empData);
        setRoles(rolesData);

        if (empResult.status === "rejected") {
          console.error("Employee fetch failed:", empResult.reason);
          messageApi.error("ไม่สามารถโหลดข้อมูลพนักงานได้");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        messageApi.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
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
        const [empResult, rolesResult] = await Promise.allSettled([
          employeeService.getAll(),
          employeeService.getRoles(),
        ]);

        const empData =
          empResult.status === "fulfilled" && Array.isArray(empResult.value)
            ? empResult.value
            : [];
        const rolesData =
          rolesResult.status === "fulfilled" && Array.isArray(rolesResult.value)
            ? rolesResult.value
            : [];

        if (isSubscribed) {
          setEmployees(empData);
          setRoles(rolesData);
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

  // Dynamic positions list
  const availablePositions = useMemo(() => {
    const list = ["ทั้งหมด"];
    const set = new Set();
    roles.forEach((r) => r.name && set.add(r.name));
    employees.forEach((e) => e.position && set.add(e.position));
    if (set.size === 0) {
      ["Admin", "Sales", "Guide", "Support"].forEach((item) => set.add(item));
    }
    set.forEach((val) => list.push(val));
    return list;
  }, [roles, employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !keyword ||
        (employee.name && employee.name.toLowerCase().includes(keyword)) ||
        (employee.email && employee.email.toLowerCase().includes(keyword)) ||
        (employee.phone && employee.phone.includes(keyword));

      const matchesPosition =
        positionFilter === "ทั้งหมด" ||
        employee.position?.toLowerCase() === positionFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "ทั้งหมด" || employee.status === statusFilter;

      return matchesSearch && matchesPosition && matchesStatus;
    });
  }, [employees, positionFilter, search, statusFilter]);

  const clearFilters = () => {
    setSearch("");
    setPositionFilter("ทั้งหมด");
    setStatusFilter("ทั้งหมด");
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      position: roles[0]?.name || "Admin",
      status: "ใช้งาน",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (employee) => {
    setModalMode("edit");
    setEditingId(employee.id);
    setFormData({
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      position: employee.position || "Admin",
      status: employee.status || "ใช้งาน",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "กรุณากรอกชื่อ-นามสกุล";
    }
    if (!formData.email.trim()) {
      errors.email = "กรุณากรอกอีเมล์";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "รูปแบบอีเมล์ไม่ถูกต้อง (เช่น example@zentura.co)";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (modalMode === "create") {
        const tempPassword = generateTempPassword();
        await employeeService.create({
          ...formData,
          password: tempPassword,
        });
        messageApi.success("เพิ่มข้อมูลพนักงานใหม่เรียบร้อยแล้ว");
        setIsModalOpen(false);
        setCreatedEmployee({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          position: formData.position,
          password: tempPassword,
        });
        setCopied(false);
        setIsSuccessModalOpen(true);
      } else {
        await employeeService.update(editingId, formData);
        messageApi.success("แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว");
        setIsModalOpen(false);
      }
      await fetchData(true);
    } catch (error) {
      console.error("Save error:", error);
      const errMsg =
        error.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      messageApi.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete employee
  const handleDelete = async (employee) => {
    try {
      await employeeService.delete(employee.id);
      messageApi.success(`ลบพนักงาน "${employee.name}" สำเร็จแล้ว`);
      await fetchData(true);
    } catch (error) {
      console.error("Delete error:", error);
      messageApi.error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการลบพนักงาน"
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
        title: "ชื่อ-นามสกุล",
        dataIndex: "name",
        key: "name",
        width: 180,
        render: (name) => (
          <span className="text-sm font-semibold text-slate-900">{name}</span>
        ),
      },
      {
        title: "อีเมล์",
        dataIndex: "email",
        key: "email",
        width: 220,
        render: (email) => (
          <span className="text-sm text-slate-600">{email}</span>
        ),
      },
      {
        title: "เบอร์โทร",
        dataIndex: "phone",
        key: "phone",
        width: 140,
        render: (phone) => (
          <span className="text-sm text-slate-600">{phone || "-"}</span>
        ),
      },
      {
        title: "ตำแหน่ง",
        dataIndex: "position",
        key: "position",
        width: 140,
        align: "center",
        render: (pos) => <PositionBadge position={pos} />,
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        key: "status",
        width: 120,
        align: "center",
        render: (status) => <StatusBadge status={status} />,
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
            <Tooltip title="แก้ไขข้อมูล">
              <button
                type="button"
                onClick={() => handleOpenEdit(record)}
                className="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700 cursor-pointer"
                aria-label={`แก้ไข ${record.name}`}
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </Tooltip>

            <Popconfirm
              title="ยืนยันการลบพนักงาน"
              description={`คุณต้องการลบ "${record.name}" ใช่หรือไม่? ข้อมูลจะไม่สามารถกู้คืนได้`}
              onConfirm={() => handleDelete(record)}
              okText="ลบข้อมูล"
              cancelText="ยกเลิก"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="ลบพนักงาน">
                <button
                  type="button"
                  className="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                  aria-label={`ลบ ${record.name}`}
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
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="ค้นหาชื่อ อีเมล์ หรือเบอร์โทร"
              />
            </label>

            {/* Position Filter */}
            <select
              value={positionFilter}
              onChange={(event) => setPositionFilter(event.target.value)}
              className="h-10 w-36 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 cursor-pointer"
            >
              {availablePositions.map((item) => (
                <option key={item} value={item}>
                  {item === "ทั้งหมด" ? "ตำแหน่งทั้งหมด" : item}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 w-36 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 cursor-pointer"
            >
              <option value="ทั้งหมด">สถานะทั้งหมด</option>
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 cursor-pointer"
              title="ล้างตัวกรอง"
            >
              <RotateCcw className="h-4 w-4" />
              เคลียร์
            </button>

            {/* Refresh Data */}
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 cursor-pointer disabled:opacity-60"
              title="รีเฟรชข้อมูลล่าสุด"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin text-cyan-600" : ""}`}
              />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>

            {/* Add Employee Button */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 cursor-pointer shadow-sm ml-auto"
            >
              <Plus className="h-4 w-4" />
              เพิ่มพนักงาน
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
              dataSource={filteredEmployees}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200, y: "calc(100vh - 295px)" }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                showTotal: (total, range) => (
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      แสดง {range[0]}-{range[1]} จากทั้งหมด {total} รายการ
                    </span>
                    {(search ||
                      positionFilter !== "ทั้งหมด" ||
                      statusFilter !== "ทั้งหมด") && (
                      <span className="text-cyan-600 font-medium">
                        (กรองจากทั้งหมด {employees.length} รายการ)
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

      {/* Modal for Create & Edit */}
      <Modal
        open={isModalOpen}
        onCancel={() => !submitting && setIsModalOpen(false)}
        footer={null}
        closable={false}
        destroyOnClose
        centered
        width={540}
        className="[&_.ant-modal-content]:!p-0 [&_.ant-modal-content]:!rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-5 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {modalMode === "create" ? "เพิ่มพนักงานใหม่" : "แก้ไขข้อมูลพนักงาน"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {modalMode === "create"
                ? "กรอกรายละเอียดพนักงานเพื่อเพิ่มเข้าสู่ระบบ"
                : `อัปเดตข้อมูลของ ${formData.name || "พนักงาน"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            disabled={submitting}
            className="inline-grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              ชื่อ-นามสกุล <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: null });
              }}
              placeholder="เช่น Somchai Prasert"
              className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-sm text-slate-800 outline-none transition ${
                formErrors.name
                  ? "border-rose-400 ring-2 ring-rose-100"
                  : "border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              }`}
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-rose-500">{formErrors.name}</p>
            )}
          </div>

          {/* Email & Phone Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                อีเมล์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                }}
                placeholder="somchai@zentura.co"
                className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-sm text-slate-800 outline-none transition ${
                  formErrors.email
                    ? "border-rose-400 ring-2 ring-rose-100"
                    : "border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                }`}
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="081-234-5678"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
          </div>

          {/* Position & Status Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                ตำแหน่ง / บทบาท
              </label>
              <select
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 cursor-pointer"
              >
                {availablePositions
                  .filter((p) => p !== "ทั้งหมด")
                  .map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                สถานะการทำงาน
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 cursor-pointer"
              >
                {statusOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer actions */}
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

      {/* Modal: Employee Created Successfully with Generated Password */}
      <Modal
        open={isSuccessModalOpen}
        onCancel={() => setIsSuccessModalOpen(false)}
        footer={null}
        closable={false}
        destroyOnClose
        centered
        width={500}
        className="[&_.ant-modal-content]:!p-0 [&_.ant-modal-content]:!rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-5 bg-emerald-50/70">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                เพิ่มพนักงานสำเร็จเรียบร้อย!
              </h3>
              <p className="text-xs text-slate-500">
                สร้างบัญชีผู้ใช้และรหัสผ่านเข้าใช้งานครั้งแรกเรียบร้อยแล้ว
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSuccessModalOpen(false)}
            className="inline-grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">ชื่อพนักงาน:</span>
              <span className="font-semibold text-slate-900">{createdEmployee?.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">ตำแหน่ง:</span>
              <PositionBadge position={createdEmployee?.position} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">User (อีเมล์):</span>
              <span className="font-mono font-semibold text-cyan-700">{createdEmployee?.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Password (รหัสชั่วคราว):</span>
              <span className="font-mono font-bold text-slate-950 bg-white px-2.5 py-1 rounded border border-slate-200 tracking-wider">
                {createdEmployee?.password}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ข้อความพร้อมส่งให้พนักงาน:
            </label>
            <div className="relative rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 font-mono whitespace-pre-line leading-relaxed select-all">
              {`สวัสดีคุณ ${createdEmployee?.name || ""} นี่คือรหัสเข้าครั้งแรก
user : ${createdEmployee?.email || ""}
password : ${createdEmployee?.password || ""}

เงื่อนไขการเข้าใช้งาน: คุณล็อคอินแล้วอย่าลืมแก้ไขรหัสผ่านใหม่อีกครั้งเพื่อความปลอดภัยของข้อมูลในระบบ
ลิงก์เข้าสู่ระบบ: ${typeof window !== "undefined" ? window.location.origin : ""}/backoffice/login`}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsSuccessModalOpen(false)}
              className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              ปิด
            </button>
            <button
              type="button"
              onClick={() => {
                const text = `สวัสดีคุณ ${createdEmployee?.name || ""} นี่คือรหัสเข้าครั้งแรก
user : ${createdEmployee?.email || ""}
password : ${createdEmployee?.password || ""}

เงื่อนไขการเข้าใช้งาน: คุณล็อคอินแล้วอย่าลืมแก้ไขรหัสผ่านใหม่อีกครั้งเพื่อความปลอดภัยของข้อมูลในระบบ
ลิงก์เข้าสู่ระบบ: ${typeof window !== "undefined" ? window.location.origin : ""}/backoffice/login`;
                navigator.clipboard.writeText(text);
                setCopied(true);
                messageApi.success("คัดลอกข้อความพร้อมส่งเรียบร้อยแล้ว");
                setTimeout(() => setCopied(false), 2500);
              }}
              className="inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition cursor-pointer shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  คัดลอกแล้ว!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  คัดลอกข้อความ
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
