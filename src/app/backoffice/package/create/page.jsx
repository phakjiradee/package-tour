"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Hotel,
  MapPin,
  Plus,
  Save,
  Trash2,
  Utensils,
  Map,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Handshake,
  Building2,
  X,
  Phone,
  Mail,
  Sparkles,
  CheckCircle2,
  EyeOff,
  Ban,
  Plane,
  UserCheck,
  Crown,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Archive,
  FileText,
  XCircle,
} from "lucide-react";
import PartnerModal from "@/components/partner/PartnerModal";
import { partnerService, partnerTypeService } from "@/service/partner";
import { locationService } from "@/service/location";
import { employeeService } from "@/service/employee";

import PackageInsurancePicker from "@/components/package/PackageInsurancePicker";
import PackageImageUploader from "@/components/package/PackageImageUploader";
import FeedbackModal from "@/components/ui/FeedbackModal";
import Dropdown, { GuideDropdown } from "@/components/ui/Dropdown";
import { formatThaiDateRange } from "@/lib/date";
import { DatePicker, ConfigProvider } from "antd";
const { RangePicker } = DatePicker;
import dayjs from "dayjs";

const formatPrice = (val) => {
  if (val === null || val === undefined || val === "") return "";
  const str = String(val).replace(/,/g, "");
  const clean = str.replace(/[^0-9.]/g, "");
  if (!clean) return "";

  const parts = clean.split(".");
  const intPart = (parts[0].replace(/^0+(?=\d)/, "") || "0").replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ","
  );
  if (parts.length > 1) {
    const decPart = parts.slice(1).join("").slice(0, 2);
    return `${intPart}.${decPart}`;
  }
  return intPart;
};

const unformatPrice = (val) => {
  if (val === null || val === undefined || val === "") return "";
  return String(val).replace(/,/g, "");
};

export default function CreatePackagePage() {
  const router = useRouter();

  const [packageData, setPackageData] = useState({
    name: "",
    description: "",
    location_id: "",
    partner_id: "",
    partner_ids: [],
    bus_ids: [],
    insurance_plan_id: null,
    price: "",
    status: "Draft",
    booking_start_date: "",
    booking_end_date: "",
    start_date: "",
    end_date: "",
    image: "",
    images: [],
    guides: [],
    addons: [],
    days: [
      {
        id: 1,
        day_num: 1,
        title: "",
        dt: "",
        description: "",
        hotel: "",
        id_location: "",
        meals: [],
        activities: [],
        isExpanded: true,
      },
    ],
  });

  const [partnersList, setPartnersList] = useState([]);
  const [partnerTypes, setPartnerTypes] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modern Feedback Modal State
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    confirmText: "ตกลง",
    cancelText: null,
    onConfirm: null,
  });

  const showFeedback = ({
    type = "success",
    title,
    message,
    confirmText = "ตกลง",
    cancelText = null,
    confirmBtnClass = null,
    cancelBtnClass = null,
    onConfirm = null,
  }) => {
    setFeedbackModal({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      confirmBtnClass,
      cancelBtnClass,
      onConfirm: onConfirm || null,
    });
  };

  useEffect(() => {
    let ignore = false;
    async function loadInitialData() {
      try {
        const [partners, types, locations, employees] = await Promise.all([
          partnerService.getAll().catch(() => []),
          partnerTypeService.getAll().catch(() => []),
          locationService.getAll().catch(() => []),
          employeeService.getAll().catch(() => []),
        ]);
        if (!ignore) {
          setPartnersList(Array.isArray(partners) ? partners : []);
          setPartnerTypes(Array.isArray(types) ? types : []);
          setLocationsList(Array.isArray(locations) ? locations : []);
          setEmployeesList(Array.isArray(employees) ? employees : []);
        }
      } catch (error) {
        console.error("Failed to load initial data", error);
      }
    }
    loadInitialData();
    return () => {
      ignore = true;
    };
  }, []);

  const handlePackageChange = (field, value) => {
    setPackageData((prev) => {
      // ตรวจสอบวันสิ้นสุดการจอง ไม่ให้เกินวันเริ่มเดินทาง
      if (field === "booking_end_date" && value) {
        const travelStart = prev.days[0]?.dt || prev.start_date;
        if (travelStart && value > travelStart) {
          showFeedback({
            type: "warning",
            title: "วันสิ้นสุดการจองไม่ถูกต้อง",
            message: `วันสิ้นสุดการจองต้องไม่เกินวันเริ่มเดินทาง (${travelStart}) ระบบได้ปรับให้เป็นวันที่ ${travelStart} โดยอัตโนมัติ`,
          });
          return { ...prev, [field]: travelStart };
        }
      }

      // ตรวจสอบวันเปิดรับจอง ไม่ให้เกินวันเริ่มเดินทาง
      if (field === "booking_start_date" && value) {
        const travelStart = prev.days[0]?.dt || prev.start_date;
        if (travelStart && value > travelStart) {
          showFeedback({
            type: "warning",
            title: "วันเปิดรับจองไม่ถูกต้อง",
            message: `วันที่เปิดรับจองต้องอยู่ก่อนวันเริ่มเดินทาง (${travelStart})`,
          });
          return { ...prev, [field]: travelStart };
        }
      }

      return { ...prev, [field]: value };
    });
  };

  // Helper to generate array of YYYY-MM-DD from start to end in UTC
  const getDatesInRange = (startDateStr, endDateStr) => {
    if (!startDateStr) return [];
    if (!endDateStr) return [startDateStr];

    const [sy, sm, sd] = startDateStr.split("-").map(Number);
    const [ey, em, ed] = endDateStr.split("-").map(Number);

    const start = new Date(Date.UTC(sy, sm - 1, sd));
    const end = new Date(Date.UTC(ey, em - 1, ed));

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    if (end < start) return [startDateStr];

    const dates = [];
    const current = new Date(start);
    let count = 0;
    while (current <= end && count < 60) {
      const y = current.getUTCFullYear();
      const m = String(current.getUTCMonth() + 1).padStart(2, "0");
      const d = String(current.getUTCDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
      current.setUTCDate(current.getUTCDate() + 1);
      count++;
    }
    return dates;
  };

  const handleTravelDateRangeChange = (newStartDate, newEndDate) => {
    setPackageData((prev) => {
      const dateList = getDatesInRange(newStartDate, newEndDate);

      const newDays = dateList.map((dtStr, idx) => {
        const existing = prev.days && prev.days[idx];
        if (existing) {
          return {
            ...existing,
            day_num: idx + 1,
            dt: dtStr,
          };
        }
        return {
          id: Date.now() + idx,
          day_num: idx + 1,
          title: "",
          dt: dtStr,
          description: "",
          hotel: "",
          id_location: "",
          meals: [],
          activities: [],
          isExpanded: true,
        };
      });

      let bStart = prev.booking_start_date;
      let bEnd = prev.booking_end_date;
      if (bEnd && bEnd > newStartDate) {
        bEnd = newStartDate;
      }
      if (bStart && bStart > newStartDate) {
        bStart = newStartDate;
      }

      return {
        ...prev,
        start_date: newStartDate,
        end_date: newEndDate,
        booking_start_date: bStart,
        booking_end_date: bEnd,
        days: newDays,
      };
    });
  };

  const handleBookingDateRangeChange = (newStart, newEnd) => {
    setPackageData((prev) => {
      const travelStart = prev.start_date || prev.days[0]?.dt;
      let finalEnd = newEnd;
      if (travelStart && finalEnd > travelStart) {
        finalEnd = travelStart;
        showFeedback({
          type: "warning",
          title: "วันสิ้นสุดการจองไม่ถูกต้อง",
          message: `วันสิ้นสุดการจองต้องไม่เกินวันเริ่มเดินทาง (${travelStart}) ระบบได้ปรับให้เป็นวันที่ ${travelStart} โดยอัตโนมัติ`,
        });
      }
      let finalStart = newStart;
      if (travelStart && finalStart > travelStart) {
        finalStart = travelStart;
      }
      return {
        ...prev,
        booking_start_date: finalStart,
        booking_end_date: finalEnd,
      };
    });
  };

  const handleTravelStartDateChange = (newStartDate) => {
    if (!newStartDate) {
      setPackageData((prev) => ({
        ...prev,
        start_date: "",
        days: prev.days.map((d) => ({ ...d, dt: "" })),
      }));
      return;
    }

    setPackageData((prev) => {
      let newEndDate = prev.end_date;
      const dayCount = prev.days?.length || 1;

      // ถ้ายังไม่มีวันสิ้นสุด หรือวันสิ้นสุดน้อยกว่าวันเริ่มต้น ให้คำนวณวันสิ้นสุดตามจำนวนวันเดิม
      if (!newEndDate || newEndDate < newStartDate) {
        const [sy, sm, sd] = newStartDate.split("-").map(Number);
        const endD = new Date(Date.UTC(sy, sm - 1, sd + (dayCount - 1)));
        const ey = endD.getUTCFullYear();
        const em = String(endD.getUTCMonth() + 1).padStart(2, "0");
        const ed = String(endD.getUTCDate()).padStart(2, "0");
        newEndDate = `${ey}-${em}-${ed}`;
      }

      const dateList = getDatesInRange(newStartDate, newEndDate);

      const newDays = dateList.map((dtStr, idx) => {
        const existing = prev.days && prev.days[idx];
        if (existing) {
          return {
            ...existing,
            day_num: idx + 1,
            dt: dtStr,
          };
        }
        return {
          id: Date.now() + idx,
          day_num: idx + 1,
          title: "",
          dt: dtStr,
          description: "",
          hotel: "",
          id_location: "",
          meals: [],
          activities: [],
          isExpanded: true,
        };
      });

      let bStart = prev.booking_start_date;
      let bEnd = prev.booking_end_date;
      if (bEnd && bEnd > newStartDate) {
        bEnd = newStartDate;
      }
      if (bStart && bStart > newStartDate) {
        bStart = newStartDate;
      }

      return {
        ...prev,
        start_date: newStartDate,
        end_date: newEndDate,
        booking_start_date: bStart,
        booking_end_date: bEnd,
        days: newDays,
      };
    });
  };

  const handleTravelEndDateChange = (newEndDate) => {
    if (!newEndDate) {
      setPackageData((prev) => ({
        ...prev,
        end_date: "",
      }));
      return;
    }

    setPackageData((prev) => {
      let effectiveStartDate = prev.start_date;
      if (!effectiveStartDate || effectiveStartDate > newEndDate) {
        effectiveStartDate = newEndDate;
      }

      const dateList = getDatesInRange(effectiveStartDate, newEndDate);

      const newDays = dateList.map((dtStr, idx) => {
        const existing = prev.days && prev.days[idx];
        if (existing) {
          return {
            ...existing,
            day_num: idx + 1,
            dt: dtStr,
          };
        }
        return {
          id: Date.now() + idx,
          day_num: idx + 1,
          title: "",
          dt: dtStr,
          description: "",
          hotel: "",
          id_location: "",
          meals: [],
          activities: [],
          isExpanded: true,
        };
      });

      let bStart = prev.booking_start_date;
      let bEnd = prev.booking_end_date;
      if (bEnd && bEnd > effectiveStartDate) {
        bEnd = effectiveStartDate;
      }
      if (bStart && bStart > effectiveStartDate) {
        bStart = effectiveStartDate;
      }

      return {
        ...prev,
        start_date: effectiveStartDate,
        end_date: newEndDate,
        booking_start_date: bStart,
        booking_end_date: bEnd,
        days: newDays,
      };
    });
  };

  const handleClearTravelDates = () => {
    setPackageData((prev) => ({
      ...prev,
      start_date: "",
      end_date: "",
      days: prev.days.map((d) => ({ ...d, dt: "" })),
    }));
  };

  const handleBookingStartDateChange = (val) => {
    setPackageData((prev) => {
      const travelStart = prev.start_date || prev.days[0]?.dt;
      if (val && travelStart && val > travelStart) {
        showFeedback({
          type: "warning",
          title: "วันเปิดรับจองไม่ถูกต้อง",
          message: `วันที่เปิดรับจองต้องอยู่ก่อนวันเริ่มเดินทาง (${travelStart})`,
        });
        return { ...prev, booking_start_date: travelStart };
      }
      let bEnd = prev.booking_end_date;
      if (val && bEnd && val > bEnd) {
        bEnd = val;
      }
      return { ...prev, booking_start_date: val, booking_end_date: bEnd };
    });
  };

  const handleBookingEndDateChange = (val) => {
    setPackageData((prev) => {
      const travelStart = prev.start_date || prev.days[0]?.dt;
      if (val && travelStart && val > travelStart) {
        showFeedback({
          type: "warning",
          title: "วันสิ้นสุดการจองไม่ถูกต้อง",
          message: `วันสิ้นสุดการจองต้องไม่เกินวันเริ่มเดินทาง (${travelStart}) ระบบได้ปรับให้เป็นวันที่ ${travelStart} โดยอัตโนมัติ`,
        });
        return { ...prev, booking_end_date: travelStart };
      }
      return { ...prev, booking_end_date: val };
    });
  };

  const handleClearBookingDates = () => {
    setPackageData((prev) => ({
      ...prev,
      booking_start_date: "",
      booking_end_date: "",
    }));
  };

  const handleTogglePartner = (partnerId) => {
    const pId = Number(partnerId);
    setPackageData((prev) => {
      const currentIds = prev.partner_ids || [];
      const exists = currentIds.includes(pId);
      const newIds = exists
        ? currentIds.filter((id) => id !== pId)
        : [...currentIds, pId];
      return {
        ...prev,
        partner_ids: newIds,
        partner_id: newIds.length > 0 ? String(newIds[0]) : "",
      };
    });
  };

  const handleAssignPartner = (partnerId) => {
    if (!partnerId) return;
    const pId = Number(partnerId);
    setPackageData((prev) => {
      const currentIds = prev.partner_ids || [];
      if (currentIds.includes(pId)) return prev;
      const newIds = [...currentIds, pId];
      return {
        ...prev,
        partner_ids: newIds,
        partner_id: newIds.length > 0 ? String(newIds[0]) : "",
      };
    });
  };

  const handleRemovePartner = (partnerId) => {
    const pId = Number(partnerId);
    setPackageData((prev) => {
      const currentIds = prev.partner_ids || [];
      const newIds = currentIds.filter((id) => id !== pId);
      return {
        ...prev,
        partner_ids: newIds,
        partner_id: newIds.length > 0 ? String(newIds[0]) : "",
      };
    });
  };

  const partnerDropdownOptions = useMemo(() => {
    return (partnersList || []).map((partner) => {
      const isSelected = (packageData.partner_ids || []).includes(partner.id);
      return {
        value: partner.id,
        label: partner.name,
        subLabel: partner.phone
          ? `โทร: ${partner.phone}`
          : partner.address || "",
        badge: isSelected ? "เลือกแล้ว" : partner.pt_type?.name,
        badgeVariant: isSelected ? "warning" : "neutral",
        disabled: isSelected,
        disabledReason: isSelected ? "เลือกแล้วในรายการนี้" : "",
        keywords: [
          partner.name,
          partner.phone || "",
          partner.pt_type?.name || "",
          partner.address || "",
        ],
      };
    });
  }, [partnersList, packageData.partner_ids]);

  const handleCreatePartner = async (formData) => {
    try {
      const newPartner = await partnerService.create(formData);
      const updatedList = await partnerService.getAll();
      setPartnersList(Array.isArray(updatedList) ? updatedList : []);
      if (newPartner?.id) {
        setPackageData((prev) => {
          const currentIds = prev.partner_ids || [];
          const newIds = [...currentIds, Number(newPartner.id)];
          return {
            ...prev,
            partner_ids: newIds,
            partner_id: String(newPartner.id),
          };
        });
      }
      setIsPartnerModalOpen(false);
    } catch (error) {
      console.error("Create partner error:", error);
      showFeedback({
        type: "error",
        title: "สร้างพาร์ทเนอร์ไม่สำเร็จ",
        message:
          error.response?.data?.message ||
          "ไม่สามารถสร้างพาร์ทเนอร์ได้ โปรดตรวจสอบข้อมูล",
      });
    }
  };

  const addAddon = () => {
    setPackageData((prev) => ({
      ...prev,
      addons: [
        ...(prev.addons || []),
        {
          id: Date.now() + Math.random(),
          addon_name: "",
          price: "",
          max_limit: 20,
          status: 1,
        },
      ],
    }));
  };

  const updateAddon = (index, field, value) => {
    setPackageData((prev) => {
      const newAddons = [...(prev.addons || [])];
      newAddons[index] = { ...newAddons[index], [field]: value };
      return { ...prev, addons: newAddons };
    });
  };

  const removeAddon = (index) => {
    setPackageData((prev) => ({
      ...prev,
      addons: (prev.addons || []).filter((_, i) => i !== index),
    }));
  };

  // Helper ตรวจสอบว่าไกด์มีงานซ้อนกับแพ็กเกจอื่นในวันเดินทางเดียวกันหรือไม่
  const checkGuideConflict = (emp) => {
    if (!emp || !emp.assignments || emp.assignments.length === 0) return null;
    const travelStart = packageData.start_date || packageData.days[0]?.dt;
    const travelEnd =
      packageData.end_date ||
      [...packageData.days].reverse().find((d) => d.dt)?.dt ||
      travelStart;
    if (!travelStart) return null;

    const sA = new Date(travelStart.split("T")[0]).getTime();
    const eA = new Date((travelEnd || travelStart).split("T")[0]).getTime();

    for (const assign of emp.assignments) {
      if (!assign.start_date) continue;

      const sB = new Date(String(assign.start_date).split("T")[0]).getTime();
      const eB = new Date(
        String(assign.end_date || assign.start_date).split("T")[0],
      ).getTime();

      // ช่วงวันทับซ้อนกัน: sA <= eB && eA >= sB
      if (sA <= eB && eA >= sB) {
        return assign;
      }
    }
    return null;
  };

  const guidesList = useMemo(() => {
    return employeesList.filter(
      (e) => e.role === "ไกด์" || e.position === "ไกด์",
    );
  }, [employeesList]);

  const handleAssignGuide = (empId) => {
    if (!empId) return;
    const idStr = String(empId);
    if ((packageData.guides || []).some((g) => String(g.emp_id) === idStr)) {
      return;
    }
    setPackageData((prev) => ({
      ...prev,
      guides: [
        ...(prev.guides || []),
        {
          emp_id: idStr,
          role:
            !prev.guides || prev.guides.length === 0
              ? "LEAD_GUIDE"
              : "ASSISTANT_GUIDE",
        },
      ],
    }));
  };

  const updateGuide = (index, field, value) => {
    setPackageData((prev) => {
      const newGuides = [...(prev.guides || [])];
      newGuides[index] = { ...newGuides[index], [field]: value };
      return { ...prev, guides: newGuides };
    });
  };

  const removeGuide = (index) => {
    setPackageData((prev) => ({
      ...prev,
      guides: (prev.guides || []).filter((_, i) => i !== index),
    }));
  };

  const handleDayChange = (dayIndex, field, value) => {
    setPackageData((prev) => {
      const newDays = [...prev.days];
      newDays[dayIndex] = { ...newDays[dayIndex], [field]: value };

      if (field === "dt") {
        // หากเปลี่ยนวันที่ของวันนี้ ให้ปรับวันถัดไปไม่ให้ต่ำกว่าวันนี้
        if (value) {
          for (let i = dayIndex + 1; i < newDays.length; i++) {
            if (newDays[i].dt && newDays[i].dt < value) {
              newDays[i] = { ...newDays[i], dt: value };
            }
          }
        }

        // วันเริ่มเดินทาง = วันที่ของ Day 1
        const firstDayDt = newDays[0]?.dt || "";
        // วันสิ้นสุดเดินทาง = วันที่ของวันสุดท้ายที่มีการกำหนดวันที่
        const lastDayDt =
          [...newDays].reverse().find((d) => d.dt)?.dt || firstDayDt;

        let bStart = prev.booking_start_date;
        let bEnd = prev.booking_end_date;

        // ถ้าวันเริ่มเดินทางถูกกำหนด ให้ล็อควันจองไม่ให้เกินวันเริ่มเดินทาง
        if (firstDayDt) {
          if (bEnd && bEnd > firstDayDt) {
            bEnd = firstDayDt;
          }
          if (bStart && bStart > firstDayDt) {
            bStart = firstDayDt;
          }
        }

        return {
          ...prev,
          days: newDays,
          start_date: firstDayDt,
          end_date: lastDayDt,
          booking_start_date: bStart,
          booking_end_date: bEnd,
        };
      }

      return { ...prev, days: newDays };
    });
  };

  const toggleDayExpand = (dayIndex) => {
    setPackageData((prev) => {
      const newDays = [...prev.days];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        isExpanded: !newDays[dayIndex].isExpanded,
      };
      return { ...prev, days: newDays };
    });
  };

  const addDay = () => {
    setPackageData((prev) => {
      const lastDay = prev.days[prev.days.length - 1];
      let nextDt = "";
      if (lastDay && lastDay.dt) {
        const d = new Date(lastDay.dt);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 1);
          nextDt = d.toISOString().split("T")[0];
        }
      }

      const newDays = [
        ...prev.days,
        {
          id: Date.now() + Math.random(),
          day_num: prev.days.length + 1,
          title: "",
          dt: nextDt,
          description: "",
          hotel: "",
          id_location: "",
          meals: [],
          activities: [],
          isExpanded: true,
        },
      ];

      const firstDayDt = newDays[0]?.dt || "";
      const lastDayDt =
        [...newDays].reverse().find((d) => d.dt)?.dt || firstDayDt;

      return {
        ...prev,
        days: newDays,
        start_date: firstDayDt,
        end_date: lastDayDt,
      };
    });
  };

  const removeDay = (indexToRemove) => {
    setPackageData((prev) => {
      const newDays = prev.days.filter((_, i) => i !== indexToRemove);
      const updatedDays = newDays.map((day, i) => ({ ...day, day_num: i + 1 }));
      const firstDayDt = updatedDays[0]?.dt || "";
      const lastDayDt =
        [...updatedDays].reverse().find((d) => d.dt)?.dt || firstDayDt;
      return {
        ...prev,
        days: updatedDays,
        start_date: firstDayDt,
        end_date: lastDayDt,
      };
    });
  };

  const addActivity = (dayIndex) => {
    setPackageData((prev) => {
      const newDays = [...prev.days];
      const newActivities = [
        ...newDays[dayIndex].activities,
        {
          id: Date.now() + Math.random(),
          time: "",
          activity: "",
          status: "include",
          landmark: "",
        },
      ];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        activities: newActivities,
        isExpanded: true,
      };
      return { ...prev, days: newDays };
    });
  };

  const updateActivity = (dayIndex, actIndex, field, value) => {
    setPackageData((prev) => {
      const newDays = [...prev.days];
      const newActivities = [...newDays[dayIndex].activities];
      newActivities[actIndex] = { ...newActivities[actIndex], [field]: value };
      newDays[dayIndex] = { ...newDays[dayIndex], activities: newActivities };
      return { ...prev, days: newDays };
    });
  };

  const removeActivity = (dayIndex, actIndex) => {
    setPackageData((prev) => {
      const newDays = [...prev.days];
      const newActivities = newDays[dayIndex].activities.filter(
        (_, i) => i !== actIndex,
      );
      newDays[dayIndex] = { ...newDays[dayIndex], activities: newActivities };
      return { ...prev, days: newDays };
    });
  };

  const toggleMeal = (dayIndex, mealType) => {
    setPackageData((prev) => {
      const newDays = [...prev.days];
      const meals = [...newDays[dayIndex].meals];
      if (meals.includes(mealType)) {
        newDays[dayIndex] = {
          ...newDays[dayIndex],
          meals: meals.filter((m) => m !== mealType),
        };
      } else {
        newDays[dayIndex] = {
          ...newDays[dayIndex],
          meals: [...meals, mealType],
        };
      }
      return { ...prev, days: newDays };
    });
  };

  const handleSave = async () => {
    if (!packageData.name.trim()) {
      showFeedback({
        type: "warning",
        title: "กรุณาระบุชื่อแพ็กเกจ",
        message:
          "กรุณากรอกชื่อแพ็กเกจท่องเที่ยว (Package Title) ก่อนทำการบันทึก",
      });
      return;
    }

    if (!packageData.insurance_plan_id) {
      showFeedback({
        type: "warning",
        title: "กรุณาเลือกแผนประกัน",
        message: "แพ็กเกจหนึ่งรายการต้องเลือกแผนประกันหนึ่งแผนก่อนบันทึก",
      });
      return;
    }

    // ตรวจสอบบุคลากร: ต้องเป็น role 'ไกด์' เท่านั้น และไม่มีงานซ้อนในวันเวลาเดียวกัน
    if (Array.isArray(packageData.guides) && packageData.guides.length > 0) {
      const selectedEmpIds = packageData.guides
        .map((g) => g.emp_id)
        .filter(Boolean);
      const uniqueIds = new Set(selectedEmpIds);
      if (uniqueIds.size !== selectedEmpIds.length) {
        showFeedback({
          type: "warning",
          title: "มีรายชื่อไกด์ซ้ำกัน",
          message:
            "คุณได้เลือกไกด์คนเดียวกันซ้ำในรายการ กรุณาเลือกไกด์ที่ไม่ซ้ำกันก่อนบันทึก",
        });
        return;
      }

      for (const g of packageData.guides) {
        if (!g.emp_id) {
          showFeedback({
            type: "warning",
            title: "กรุณาเลือกไกด์ให้ครบถ้วน",
            message:
              "มีรายการมอบหมายงานที่ยังไม่ได้เลือกไกด์ กรุณาเลือกไกด์หรือลบรายการที่ไม่ใช้ออก",
          });
          return;
        }

        const emp = employeesList.find(
          (e) => String(e.id) === String(g.emp_id),
        );
        if (emp && emp.role !== "ไกด์" && emp.position !== "ไกด์") {
          showFeedback({
            type: "error",
            title: "บทบาทไม่ถูกต้อง",
            message: `พนักงาน "${emp.name}" (ตำแหน่ง: ${emp.position || emp.role}) ไม่ได้อยู่ในตำแหน่งไกด์ สามารถมอบหมายได้เฉพาะผู้ที่มีตำแหน่ง 'ไกด์' เท่านั้น`,
          });
          return;
        }

        const conflict = checkGuideConflict(emp);
        if (conflict) {
          showFeedback({
            type: "error",
            title: "ตารางงานซ้อนทับ",
            message: `ไกด์ "${emp.name}" ไม่สามารถรับงานได้ เนื่องจากมีงานซ้อนกับแพ็กเกจ "${conflict.package_name}" ในช่วงวันเดินทางเดียวกัน`,
          });
          return;
        }
      }
    }

    try {
      setIsSaving(true);
      const payload = {
        ...packageData,
        price: parseFloat(unformatPrice(packageData.price)) || 0,
      };
      const res = await fetch("http://localhost:4000/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback({
          type: "success",
          title: "สร้างแพ็กเกจสำเร็จเรียบร้อยแล้ว!",
          message:
            "แพ็กเกจใหม่ถูกบันทึกเข้าสู่ระบบเรียบร้อยแล้ว พร้อมสำหรับการเผยแพร่",
          confirmText: "ไปยังหน้ารายการ",
          onConfirm: () => router.push("/backoffice/package"),
        });
      } else {
        showFeedback({
          type: "error",
          title: "บันทึกไม่สำเร็จ",
          message:
            data.message ||
            data.error ||
            "เกิดข้อผิดพลาดในการสร้างแพ็กเกจ กรุณาลองใหม่อีกครั้ง",
        });
      }
    } catch (error) {
      console.error(error);
      showFeedback({
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    showFeedback({
      type: "warning",
      title: "ยืนยันการยกเลิกการสร้างแพ็กเกจ",
      message:
        "ข้อมูลที่คุณกรอกอาจไม่ได้รับการบันทึก คุณแน่ใจหรือไม่ว่าต้องการยกเลิกและกลับไปยังหน้ารายการ?",
      confirmText: "ใช่, ยกเลิกและออก",
      cancelText: "กลับไปแก้ไขต่อ",
      onConfirm: () => {
        setFeedbackModal((prev) => ({ ...prev, isOpen: false }));
        router.push("/backoffice/package");
      },
    });
  };

  const totalDays = packageData.days.length;
  const totalActivities = packageData.days.reduce(
    (sum, day) => sum + day.activities.length,
    0,
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sticky Top Header */}
      <header className="sticky top-12 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleCancelClick}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 cursor-pointer"
            title="ย้อนกลับ"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                สร้างแพ็กเกจทัวร์ใหม่
              </h1>
              {packageData.status === "Published" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200 shadow-2xs">
                  <CheckCircle2
                    size={12.5}
                    className="text-emerald-600 shrink-0"
                  />
                  <span>เปิดขาย</span>
                </span>
              )}
              {packageData.status === "Draft" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200 shadow-2xs">
                  <FileText size={12.5} className="text-amber-600 shrink-0" />
                  <span>ฉบับร่าง</span>
                </span>
              )}
              {packageData.status === "Closed" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200 shadow-2xs">
                  <XCircle size={12.5} className="text-rose-600 shrink-0" />
                  <span>ปิดรับจอง</span>
                </span>
              )}
              {packageData.status === "Archived" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs">
                  <Archive size={12.5} className="text-slate-500 shrink-0" />
                  <span>เก็บถาวร</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancelClick}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "กำลังบันทึก..." : "บันทึกแพ็กเกจ"}
          </button>
        </div>
      </header>



      {/* Main Layout Workspace */}
      <div className="w-full p-6 lg:flex lg:gap-8 lg:p-8">
        {/* Left Column: Canvas (Overview + Partners + Timeline Builder) */}
        <div className="flex-1 space-y-8 pb-20">
          {/* SECTION: Overview */}
          <section id="overview" className="scroll-mt-44">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  ข้อมูลพื้นฐานแพ็กเกจ
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  ระบุชื่อ รายละเอียด และจุดหมายปลายทางหลักของโปรแกรมทัวร์
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="space-y-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    ชื่อแพ็กเกจท่องเที่ยว{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={packageData.name}
                    onChange={(e) =>
                      handlePackageChange("name", e.target.value)
                    }
                    placeholder="เช่น ทริป 3 วัน 2 คืน: มนต์เสน่ห์ทะเลกระบี่ & ดำน้ำ 4 เกาะ ทะเลแหวก"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    รายละเอียดและจุดเด่นของแพ็กเกจ
                  </label>
                  <textarea
                    rows={4}
                    value={packageData.description}
                    onChange={(e) =>
                      handlePackageChange("description", e.target.value)
                    }
                    placeholder="ระบุภาพรวมของโปรแกรมทัวร์ ไฮไลท์สำคัญ และประสบการณ์พิเศษที่นักท่องเที่ยวจะได้รับ..."
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      จุดหมายปลายทางหลัก
                    </label>
                    <Dropdown
                      value={packageData.location_id}
                      onChange={(e) => {
                        const val = e?.target ? e.target.value : e;
                        handlePackageChange("location_id", val);
                      }}
                      options={locationsList.map((loc) => ({
                        value: loc.id,
                        label:
                          `${loc.name} ${loc.lct_type?.name ? `(${loc.lct_type.name})` : ""}`.trim(),
                      }))}
                      placeholder="เลือกจุดหมายปลายทางหลัก"
                      searchPlaceholder="ค้นหาจุดหมายปลายทาง..."
                      clearable={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION: Gallery */}
          <section id="gallery" className="scroll-mt-44">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-indigo-600" />
                  รูปภาพและสื่อประกอบ
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  อัปโหลดรูปภาพความละเอียดสูงสำหรับแสดงในหน้ารายละเอียดและใช้เป็นภาพหน้าปกของทริป
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <PackageImageUploader
                images={packageData.images || []}
                onChange={(updatedImages) => {
                  const cover =
                    updatedImages.find((img) => img.is_cover) ||
                    updatedImages[0];
                  setPackageData((prev) => ({
                    ...prev,
                    images: updatedImages,
                    image: cover ? cover.image_url : prev.image,
                  }));
                }}
              />
            </div>
          </section>

          {/* SECTION: Partners */}
          <section id="partners" className="scroll-mt-44">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-indigo-600" />
                  พันธมิตรและผู้ให้บริการร่วม
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  เชื่อมโยงโรงแรม ที่พัก รถรับส่ง
                  หรือบริการที่เกี่ยวข้องกับแพ็กเกจนี้
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPartnerModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                เพิ่มพันธมิตรใหม่
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {/* Dropdown to assign partner directly into the list */}
              <div className="mb-5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                <label className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Handshake className="h-4 w-4 text-indigo-600" />
                  <span>เลือกพันธมิตรและผู้ให้บริการร่วม</span>
                </label>
                <Dropdown
                  value=""
                  onChange={(e) => {
                    const partnerId = e?.target ? e.target.value : e;
                    handleAssignPartner(partnerId);
                  }}
                  options={partnerDropdownOptions}
                  placeholder="+ ค้นหาหรือเลือกพันธมิตรเพื่อเพิ่มในรายการ..."
                  searchPlaceholder="ค้นหาชื่อพันธมิตร, เบอร์โทร, ประเภท..."
                  className="w-full"
                />
                {partnersList.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1.5">
                    ⚠️ ยังไม่มีข้อมูลผู้ให้บริการในระบบ สามารถกดปุ่ม
                    &quot;เพิ่มพันธมิตรใหม่&quot; ด้านบนเพื่อสร้างได้ทันที
                  </p>
                )}
              </div>

              {/* Header for list items */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    รายชื่อผู้ให้บริการร่วมที่เลือก
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {(packageData.partner_ids || []).length} แห่ง
                  </span>
                </div>
              </div>

              {/* List Items */}
              {!packageData.partner_ids ||
              packageData.partner_ids.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-8 px-4 text-center mt-3">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Handshake className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    ยังไม่มีการเลือกผู้ให้บริการร่วม
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เลือกพันธมิตรจากเมนูดรอปดาวน์ด้านบนเพื่อเพิ่มลงในรายการทันที
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs mt-3">
                  {packageData.partner_ids.map((partnerId, index) => {
                    const partner = partnersList.find(
                      (p) => p.id === partnerId,
                    );
                    if (!partner) return null;

                    return (
                      <div
                        key={partner.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-colors hover:bg-slate-50/70"
                      >
                        {/* Partner Info Left */}
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500 shrink-0">
                            {index + 1}
                          </span>

                          <div className="h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-900 text-sm truncate">
                                {partner.name}
                              </p>
                              {partner.pt_type?.name && (
                                <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                  {partner.pt_type.name}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-500 flex-wrap">
                              {partner.phone ? (
                                <span className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                                  <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                  {partner.phone}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  ไม่มีเบอร์โทร
                                </span>
                              )}

                              {partner.address && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[11px] text-slate-500 truncate max-w-sm">
                                    {partner.address}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Delete button */}
                        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePartner(partner.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="ลบออกจากรายการ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>


          {/* SECTION: Tour Guides & Staff Assignment */}
          <section id="guides" className="scroll-mt-44">
            <div className="flex items-center justify-between gap-4 mb-4 mt-8">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-indigo-600 shrink-0" />
                  <span>ทีมงานและไกด์ประจำแพ็กเกจ (Assigned Guides)</span>
                </h2>
                <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
                  มอบหมายไกด์นำเที่ยวหลัก ไกด์ผู้ช่วย หรือผู้ประสานงานประจำทริป
                  เพื่อดูแลนักท่องเที่ยวตลอดการเดินทาง (เฉพาะ Role
                  &apos;ไกด์&apos; และไม่มีงานซ้อนในวันเวลาเดียวกัน)
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {/* Dropdown to assign guide directly into the list */}
              <div className="mb-5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                <label className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-indigo-600" />
                  <span>
                    เลือกไกด์นำเที่ยวเพื่อมอบหมายงาน (Role ไกด์เท่านั้น)
                  </span>
                </label>
                <Dropdown
                  type="guide"
                  value=""
                  onChange={(e) => {
                    const empId = e?.target ? e.target.value : e;
                    handleAssignGuide(empId);
                  }}
                  guidesList={guidesList}
                  assignedGuides={packageData.guides}
                  checkConflict={checkGuideConflict}
                  placeholder="+ ค้นหาหรือเลือกไกด์นำเที่ยวเพื่อมอบหมาย..."
                  searchPlaceholder="ค้นหาชื่อไกด์, เบอร์โทร..."
                  className="w-full"
                />
                {guidesList.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1.5">
                    ⚠️ ไม่พบพนักงานที่มีบทบาท &apos;ไกด์&apos; ในระบบ
                  </p>
                )}
              </div>

              {/* Header for list items */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    รายชื่อไกด์ที่มอบหมาย
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {(packageData.guides || []).length} ท่าน
                  </span>
                </div>
              </div>

              {/* List Items */}
              {!packageData.guides || packageData.guides.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-8 px-4 text-center mt-3">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    ยังไม่มีการมอบหมายไกด์
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เลือกไกด์จากเมนูดรอปดาวน์ด้านบนเพื่อเพิ่มลงในรายการทันที
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs mt-3">
                  {packageData.guides.map((guide, index) => {
                    const selectedEmp = employeesList.find(
                      (e) => e.id === parseInt(guide.emp_id),
                    );
                    const currentConflict = checkGuideConflict(selectedEmp);
                    const isLead = guide.role === "LEAD_GUIDE";

                    return (
                      <div
                        key={guide.emp_id || index}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-colors hover:bg-slate-50/70"
                      >
                        {/* Guide Info Left */}
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500 shrink-0">
                            {index + 1}
                          </span>

                          <div
                            className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                              isLead
                                ? "bg-amber-100 text-amber-900 border border-amber-200"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            }`}
                          >
                            {selectedEmp?.name
                              ? selectedEmp.name.slice(0, 2)
                              : "ไกด์"}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-900 text-sm truncate">
                                {selectedEmp?.name ||
                                  `รหัสพนักงาน #${guide.emp_id}`}
                              </p>
                              {isLead && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                  <Crown className="h-3 w-3 text-amber-600" />
                                  <span>หัวหน้าทริป (Lead Guide)</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-500 flex-wrap">
                              {selectedEmp?.phone ? (
                                <span className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                                  <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                  {selectedEmp.phone}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  ไม่มีเบอร์โทร
                                </span>
                              )}

                              <span className="text-slate-300">•</span>

                              {currentConflict ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                  <AlertCircle className="h-3 w-3 shrink-0 text-rose-600" />
                                  ติดงานแพ็กเกจ &quot;
                                  {currentConflict.package_name}&quot;
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                                  พร้อมรับงาน (ตารางว่าง)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Role selection using global Dropdown + Delete */}
                        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                          <div className="w-56">
                            <Dropdown
                              value={guide.role || "LEAD_GUIDE"}
                              onChange={(val) => {
                                const roleVal = val?.target
                                  ? val.target.value
                                  : val;
                                updateGuide(index, "role", roleVal);
                              }}
                              options={[
                                {
                                  value: "LEAD_GUIDE",
                                  label: "ไกด์หลัก (Lead Guide)",
                                },
                                {
                                  value: "ASSISTANT_GUIDE",
                                  label: "ไกด์ผู้ช่วย (Assistant Guide)",
                                },
                                {
                                  value: "COORDINATOR",
                                  label: "ผู้ประสานงานทริป (Coordinator)",
                                },
                              ]}
                              searchable={false}
                              clearable={false}
                              placeholder="เลือกหน้าที่"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeGuide(index)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="ลบออกจากรายการ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <PackageInsurancePicker selected={packageData.insurance_plan_id} onChange={(insurance_plan_id) => setPackageData((prev) => ({ ...prev, insurance_plan_id }))} />

          {/* SECTION: Add-on Packages */}
          <section id="addons" className="scroll-mt-44">
            <div className="flex items-center justify-between mb-4 mt-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  บริการเสริมและตัวเลือกพิเศษ
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  ระบุบริการที่ลูกค้าสามารถเลือกซื้อเพิ่มได้ระหว่างทำการจอง
                  (เช่น อุปกรณ์พิเศษหรือรถรับส่ง)
                </p>
              </div>
              <button
                type="button"
                onClick={addAddon}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                เพิ่มบริการเสริม
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {!packageData.addons || packageData.addons.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-sm text-slate-500 mb-3">
                    ยังไม่มีบริการเสริมสำหรับแพ็กเกจนี้
                  </p>
                  <button
                    type="button"
                    onClick={addAddon}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    เพิ่มบริการเสริมแรก
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {packageData.addons.map((addon, index) => (
                    <div
                      key={addon.id || index}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1 min-w-[180px]">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                          ชื่อบริการเสริม
                        </label>
                        <input
                          type="text"
                          value={addon.addon_name}
                          onChange={(e) =>
                            updateAddon(index, "addon_name", e.target.value)
                          }
                          placeholder="เช่น รถตู้รับ-ส่งสนามบิน, อุปกรณ์พิเศษ"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="w-full sm:w-36">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                          ราคา (บาท)
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-xs text-slate-400 font-semibold">
                              ฿
                            </span>
                          </div>
                          <input
                            type="number"
                            value={addon.price}
                            onChange={(e) =>
                              updateAddon(index, "price", e.target.value)
                            }
                            placeholder="0.00"
                            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="w-full sm:w-28">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                          จำกัดสูงสุด (ชุด)
                        </label>
                        <input
                          type="number"
                          value={addon.max_limit}
                          onChange={(e) =>
                            updateAddon(index, "max_limit", e.target.value)
                          }
                          placeholder="20"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="w-full sm:w-36">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                          สถานะการเปิดรับ
                        </label>
                        <select
                          value={addon.status}
                          onChange={(e) =>
                            updateAddon(index, "status", Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white py-2 px-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 font-medium"
                        >
                          <option value={1}>เปิดให้เลือกซื้อ</option>
                          <option value={0}>ปิดรับชั่วคราว</option>
                        </select>
                      </div>

                      <div className="flex items-end justify-end sm:pt-4">
                        <button
                          type="button"
                          onClick={() => removeAddon(index)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="ลบ Addon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* SECTION: กำหนดช่วงเวลาเปิดรับจองและช่วงเวลาเดินทาง */}
          <section id="schedule" className="scroll-mt-44">
            <div className="flex items-center justify-between mb-4 mt-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  ช่วงเวลาเปิดรับจองและกำหนดการเดินทาง
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  กำหนดช่วงเวลาเปิดให้ลูกค้าทำการจอง และช่วงเวลาเดินทางของทัวร์ (ระบบจะสร้างและเรียงไทม์ไลน์วันเดินทางให้อัตโนมัติ)
                </p>
              </div>
            </div>

            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: "#4f46e5",
                  borderRadius: 12,
                  fontFamily: "var(--font-anuphan), sans-serif",
                },
              }}
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* กล่องย่อยที่ 1: ช่วงเวลาเปิดรับจอง (Booking Period) */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-600" />
                        <span>ช่วงเวลาเปิดรับจอง</span>
                      </label>
                      {(packageData.booking_start_date ||
                        packageData.booking_end_date) && (
                        <button
                          type="button"
                          onClick={handleClearBookingDates}
                          className="text-[11px] font-medium text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          ล้างวันที่
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="block text-xs font-medium text-slate-600">
                          ระบุช่วงวันที่เปิดรับจอง
                        </span>
                        {(packageData.start_date || packageData.days[0]?.dt) && (
                          <span className="text-[10px] text-amber-700 font-semibold">
                            ล็อคไม่เกินวันเริ่มเดินทาง
                          </span>
                        )}
                      </div>
                      <RangePicker
                        value={[
                          packageData.booking_start_date
                            ? dayjs(packageData.booking_start_date)
                            : null,
                          packageData.booking_end_date
                            ? dayjs(packageData.booking_end_date)
                            : null,
                        ]}
                        onChange={(dates) => {
                          if (!dates || !dates[0] || !dates[1]) {
                            handleClearBookingDates();
                            return;
                          }
                          handleBookingDateRangeChange(
                            dates[0].format("YYYY-MM-DD"),
                            dates[1].format("YYYY-MM-DD"),
                          );
                        }}
                        disabledDate={(current) => {
                          if (!current) return false;
                          const travelStart =
                            packageData.start_date || packageData.days[0]?.dt;
                          if (!travelStart) return false;
                          return current.isAfter(dayjs(travelStart), "day");
                        }}
                        format="DD/MM/YYYY"
                        placeholder={["เปิดรับจองตั้งแต่วันที่", "สิ้นสุดการจอง"]}
                        size="large"
                        className="w-full rounded-xl py-2.5 px-3 text-xs shadow-2xs border-slate-300"
                        allowClear
                      />
                    </div>
                  </div>

                  {/* กล่องย่อยที่ 2: ช่วงเวลาเดินทาง (Travel Period) */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <Plane className="h-4 w-4 text-indigo-600" />
                        <span>ช่วงเวลาเดินทาง</span>
                      </label>
                      {(packageData.start_date || packageData.end_date) && (
                        <button
                          type="button"
                          onClick={handleClearTravelDates}
                          className="text-[11px] font-medium text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          ล้างวันเดินทาง
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="block text-xs font-medium text-slate-600">
                          เดินทาง
                        </span>
                        <span className="text-[10px] text-indigo-600 font-semibold">
                          สร้าง Timeline อัตโนมัติ
                        </span>
                      </div>
                      <RangePicker
                        value={[
                          packageData.start_date
                            ? dayjs(packageData.start_date)
                            : null,
                          packageData.end_date
                            ? dayjs(packageData.end_date)
                            : null,
                        ]}
                        onChange={(dates) => {
                          if (!dates || !dates[0] || !dates[1]) {
                            handleClearTravelDates();
                            return;
                          }
                          handleTravelDateRangeChange(
                            dates[0].format("YYYY-MM-DD"),
                            dates[1].format("YYYY-MM-DD"),
                          );
                        }}
                        format="DD/MM/YYYY"
                        placeholder={["วันเริ่มเดินทาง", "วันสิ้นสุดเดินทาง"]}
                        size="large"
                        className="w-full rounded-xl py-2.5 px-3 text-xs shadow-2xs border-slate-300"
                        allowClear
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ConfigProvider>
          </section>

          {/* SECTION: Itinerary Builder */}
          <section id="itinerary" className="scroll-mt-44">
            <div className="flex items-center justify-between mb-4 mt-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  แผนการเดินทางและกิจกรรม
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  กำหนดรายละเอียด กิจกรรม ที่พัก
                  และมื้ออาหารในแต่ละวันอย่างเป็นลำดับ
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="space-y-6 relative z-10">
                {packageData.days.map((day, dayIndex) => (
                  <div key={day.id} className="flex gap-4 sm:gap-6">
                    {/* Day indicator node */}
                    <div className="hidden sm:flex flex-col items-center pt-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-white bg-indigo-600 text-white shadow-md font-bold text-sm">
                        D{day.day_num}
                      </div>
                    </div>

                    {/* Day Card */}
                    <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300">
                      {/* Card Header */}
                      <div
                        className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-4 sm:px-6 cursor-pointer select-none"
                        onClick={() => toggleDayExpand(dayIndex)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 sm:hidden">
                            <span className="text-xs font-bold">
                              D{day.day_num}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 text-base">
                              {day.title || `วันที่ ${day.day_num}`}
                            </h3>
                            <div className="flex items-center gap-3 mt-0.5 text-xs font-medium text-slate-500">
                              {day.dt && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> {day.dt}
                                </span>
                              )}
                              {day.hotel && (
                                <span className="flex items-center gap-1">
                                  <Hotel className="h-3 w-3" /> {day.hotel}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDay(dayIndex);
                            }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="ลบวันนี้"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="rounded-lg p-2 text-slate-400">
                            {day.isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      {day.isExpanded && (
                        <div className="p-5 sm:p-6 space-y-6 bg-white">
                          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                ไฮไลท์ประจำวัน
                              </label>
                              <input
                                type="text"
                                value={day.title}
                                onChange={(e) =>
                                  handleDayChange(
                                    dayIndex,
                                    "title",
                                    e.target.value,
                                  )
                                }
                                placeholder="เช่น ออกเดินทางสู่กระบี่ • ล่องเรือหางยาวชมทะเลแหวก"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                  วันที่เดินทาง{" "}
                                  {dayIndex === 0
                                    ? "(วันแรก / วันเริ่มเดินทาง)"
                                    : ""}
                                </label>
                                {dayIndex > 0 &&
                                  (packageData.days[dayIndex - 1]?.dt ||
                                    packageData.days[0]?.dt) && (
                                    <span className="text-[10px] text-indigo-600 font-semibold">
                                      ล็อคไม่ต่ำกว่า{" "}
                                      {packageData.days[dayIndex - 1]?.dt ||
                                        packageData.days[0]?.dt}
                                    </span>
                                  )}
                              </div>
                              <DatePicker
                                value={day.dt ? dayjs(day.dt) : null}
                                onChange={(date) =>
                                  handleDayChange(
                                    dayIndex,
                                    "dt",
                                    date ? date.format("YYYY-MM-DD") : "",
                                  )
                                }
                                format="DD/MM/YYYY"
                                placeholder="เลือกวันที่เดินทาง"
                                size="middle"
                                className="w-full rounded-lg border-slate-300 py-1.5 px-3 text-sm"
                                minDate={
                                  dayIndex > 0 &&
                                  (packageData.days[dayIndex - 1]?.dt ||
                                    packageData.days[0]?.dt)
                                    ? dayjs(
                                        packageData.days[dayIndex - 1]?.dt ||
                                          packageData.days[0]?.dt,
                                      )
                                    : undefined
                                }
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                รายละเอียดและกำหนดการประจำวัน
                              </label>
                              <textarea
                                rows={2}
                                value={day.description}
                                onChange={(e) =>
                                  handleDayChange(
                                    dayIndex,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                placeholder="ระบุกำหนดการและกิจกรรมสำคัญในวันนี้อย่างกระชับ..."
                                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          <hr className="border-slate-100" />

                          {/* Logistics (Location, Hotel & Meals) */}
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div>
                              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <Map className="h-3.5 w-3.5" /> จุดท่องเที่ยว /
                                ปลายทางของวันนี้
                              </label>
                              <select
                                value={day.id_location || day.location_id || ""}
                                onChange={(e) =>
                                  handleDayChange(
                                    dayIndex,
                                    "id_location",
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="">
                                  ตามจุดหมายหลักของแพ็กเกจ
                                </option>
                                {locationsList.map((loc) => (
                                  <option key={loc.id} value={loc.id}>
                                    {loc.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <Hotel className="h-3.5 w-3.5" /> โรงแรม /
                                ที่พัก
                              </label>
                              <input
                                type="text"
                                value={day.hotel}
                                onChange={(e) =>
                                  handleDayChange(
                                    dayIndex,
                                    "hotel",
                                    e.target.value,
                                  )
                                }
                                placeholder="เช่น อ่าวนาง คลิฟฟ์ บีช รีสอร์ท หรือระบุชื่อที่พัก"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <Utensils className="h-3.5 w-3.5" />{" "}
                                มื้ออาหารที่รวมในทริป
                              </label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {[
                                  { key: "Breakfast", label: "อาหารเช้า" },
                                  { key: "Lunch", label: "อาหารกลางวัน" },
                                  { key: "Dinner", label: "อาหารเย็น" },
                                ].map(({ key, label }) => {
                                  const isSelected = day.meals.includes(key);
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => toggleMeal(dayIndex, key)}
                                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                        isSelected
                                          ? "border-indigo-600 bg-indigo-600 text-white"
                                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                      }`}
                                    >
                                      {isSelected && (
                                        <Check className="h-3 w-3" />
                                      )}
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Activities Sub-Timeline */}
                          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/50 p-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-b border-slate-200/60">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" />{" "}
                                กำหนดการและกิจกรรม ({day.activities.length})
                              </h4>
                              <button
                                type="button"
                                onClick={() => addActivity(dayIndex)}
                                className="mt-2 sm:mt-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" /> เพิ่มกิจกรรม
                              </button>
                            </div>

                            <div className="p-3 space-y-3">
                              {day.activities.length === 0 ? (
                                <p className="text-center py-4 text-xs text-slate-400">
                                  ยังไม่มีกิจกรรมในวันนี้ กด
                                  &quot;เพิ่มกิจกรรม&quot;
                                  ด้านบนเพื่อระบุกิจกรรม
                                </p>
                              ) : (
                                day.activities.map((act, actIndex) => (
                                  <div
                                    key={act.id}
                                    className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xs"
                                  >
                                    <div className="w-full sm:w-28">
                                      <input
                                        type="text"
                                        value={act.time}
                                        onChange={(e) =>
                                          updateActivity(
                                            dayIndex,
                                            actIndex,
                                            "time",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="09:00 - 10:30"
                                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-indigo-500"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={act.activity}
                                        onChange={(e) =>
                                          updateActivity(
                                            dayIndex,
                                            actIndex,
                                            "activity",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="รายละเอียดกิจกรรม เช่น ดำน้ำตื้นชมปะการังเกาะไก่"
                                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                                      />
                                    </div>
                                    <div className="w-full sm:w-36">
                                      <input
                                        type="text"
                                        value={act.landmark}
                                        onChange={(e) =>
                                          updateActivity(
                                            dayIndex,
                                            actIndex,
                                            "landmark",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="สถานที่ / จุดแวะพัก"
                                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={act.status}
                                        onChange={(e) =>
                                          updateActivity(
                                            dayIndex,
                                            actIndex,
                                            "status",
                                            e.target.value,
                                          )
                                        }
                                        className="rounded-md border border-slate-300 py-1.5 px-2 text-xs outline-none focus:border-indigo-500 bg-white"
                                      >
                                        <option value="include">
                                          รวมในรายการทัวร์
                                        </option>
                                        <option value="optional">
                                          กิจกรรมทางเลือก (Optional)
                                        </option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeActivity(dayIndex, actIndex)
                                        }
                                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100"
                                        title="ลบกิจกรรม"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}


              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Summary Panel */}
        <aside className="w-full lg:w-96 xl:w-105 shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* Pricing Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">
                ราคาและสถานะการขาย
              </h3>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  ราคาเริ่มต้นต่อท่าน (บาท)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="font-medium text-slate-400">฿</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={packageData.price}
                    onChange={(e) =>
                      handlePackageChange("price", formatPrice(e.target.value))
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-9 pr-4 text-lg font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  สถานะแพ็กเกจ
                </label>
                <select
                  value={packageData.status}
                  onChange={(e) =>
                    handlePackageChange("status", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                >
                  <option value="Published">เปิดขาย (ให้จองบนเว็บไซต์)</option>
                  <option value="Draft">ฉบับร่าง (ซ่อนไม่ให้ลูกค้าเห็น)</option>
                  <option value="Closed">ปิดรับจอง (ชั่วคราว / เต็ม)</option>
                  <option value="Archived">
                    เก็บถาวร (ซ่อนออกจากเว็บไซต์)
                  </option>
                </select>

                {/* Status Meaning / Impact Helper Box */}
                <div
                  className={`mt-2.5 rounded-xl border p-3 text-xs transition-all ${
                    packageData.status === "Published"
                      ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
                      : packageData.status === "Draft"
                        ? "border-amber-200 bg-amber-50/90 text-amber-950"
                        : packageData.status === "Closed"
                          ? "border-rose-200 bg-rose-50/90 text-rose-950"
                          : "border-slate-200 bg-slate-100/90 text-slate-900"
                  }`}
                >
                  {packageData.status === "Published" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>เปิดขาย & เปิดให้จองบนเว็บไซต์</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-emerald-700">
                        • <strong>หน้ารวมทัวร์:</strong>{" "}
                        ลูกค้าค้นหาและเห็นแพ็กเกจนี้ได้ตามปกติ
                        <br />• <strong>ระบบการจอง:</strong> ปุ่ม
                        &quot;จองแพ็กเกจนี้&quot; เปิดใช้งาน สามารถส่งคำขอจองได้
                      </p>
                    </div>
                  )}

                  {packageData.status === "Draft" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800">
                        <EyeOff className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>ฉบับร่าง — ซ่อนจากลูกค้า</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-700">
                        • <strong>หน้ารวมทัวร์:</strong> ซ่อนทันที
                        ลูกค้าจะไม่เห็นในหน้ารายการหรือผลค้นหา
                        <br />• <strong>ระบบการจอง:</strong> ปิดการจอง
                        (หากเข้าผ่านลิงก์ตรงจะขึ้นเตือนว่าเป็นฉบับร่าง)
                      </p>
                    </div>
                  )}

                  {packageData.status === "Closed" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800">
                        <Ban className="h-4 w-4 text-rose-600 shrink-0" />
                        <span>ปิดรับจองชั่วคราว / ที่นั่งเต็ม</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-rose-700">
                        • <strong>หน้ารวมทัวร์:</strong> ยังคงแสดงให้ลูกค้าชมได้
                        แต่ขึ้นป้าย &quot;ปิดรับจองแล้ว&quot;
                        <br />• <strong>ระบบการจอง:</strong> ปุ่มจองถูกปิด
                        (Disabled) ไม่สามารถกดส่งคำขอจองได้
                      </p>
                    </div>
                  )}

                  {packageData.status === "Archived" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Archive className="h-4 w-4 text-slate-600 shrink-0" />
                        <span>เก็บถาวร — ซ่อนออกจากเว็บไซต์</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600">
                        • <strong>หน้ารวมทัวร์:</strong>{" "}
                        ซ่อนออกจากเว็บไซต์ทั้งหมด
                        <br />• <strong>ระบบการจอง:</strong> ปิดการจองถาวร
                        เหมาะสำหรับแพ็กเกจที่ยกเลิกแล้ว
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* สรุปกำหนดวันเดินทาง & วันเปิดจอง (Quick Link) */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                    <span>กำหนดการและวันจอง</span>
                  </label>
                  <a
                    href="#schedule"
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    ตั้งค่า
                  </a>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-0.5">
                      <Plane className="h-3.5 w-3.5 text-indigo-600" />
                      <span>วันเดินทาง ({packageData.days?.length || 0} วัน)</span>
                    </div>
                    <p className="font-semibold text-slate-800 text-xs">
                      {packageData.start_date || packageData.days[0]?.dt
                        ? formatThaiDateRange(
                            packageData.start_date || packageData.days[0]?.dt,
                            packageData.end_date ||
                              [...packageData.days]
                                .reverse()
                                .find((d) => d.dt)?.dt,
                          )
                        : "ยังไม่ได้ระบุวันเดินทาง"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-0.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>ช่วงเปิดรับจอง</span>
                    </div>
                    <p className="font-medium text-slate-600 text-xs">
                      {packageData.booking_start_date ||
                      packageData.booking_end_date
                        ? formatThaiDateRange(
                            packageData.booking_start_date,
                            packageData.booking_end_date,
                          )
                        : "เปิดรับจองตลอดเวลา"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tour Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">
                สรุปภาพรวมโปรแกรมทัวร์
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm font-medium text-slate-600">
                    ระยะเวลาเดินทาง
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {totalDays} วัน
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm font-medium text-slate-600">
                    กิจกรรมตลอดทริป
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {totalActivities} จุด
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm font-medium text-slate-600">
                    ผู้ให้บริการร่วม
                  </span>
                  <span className="text-sm font-bold text-indigo-600">
                    {(packageData.partner_ids || []).length} ราย
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm font-medium text-slate-600">
                    ไกด์ประจำแพ็กเกจ
                  </span>
                  <span className="text-sm font-bold text-indigo-600">
                    {(packageData.guides || []).length} ท่าน
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm font-medium text-slate-600">
                    บริการเสริมพิเศษ
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {(packageData.addons || []).length} รายการ
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm font-medium text-slate-600">
                    วันเดินทาง
                  </span>
                  <span className="text-xs font-bold text-indigo-900 text-right">
                    {packageData.days[0]?.dt
                      ? formatThaiDateRange(
                          packageData.days[0]?.dt,
                          [...packageData.days].reverse().find((d) => d.dt)?.dt,
                        )
                      : "ระบุในแพลนวันแรก"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm font-medium text-slate-600">
                    ช่วงเวลาเปิดจอง
                  </span>
                  <span className="text-xs font-semibold text-slate-800 text-right">
                    {packageData.booking_start_date ||
                    packageData.booking_end_date
                      ? formatThaiDateRange(
                          packageData.booking_start_date,
                          packageData.booking_end_date,
                          { shortMonth: true },
                        )
                      : "เปิดจองตลอด"}
                  </span>
                </div>

                {/* Mini Outline */}
                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    ลำดับโปรแกรมเดินทาง
                  </p>
                  <ul className="space-y-2.5">
                    {packageData.days.map((day) => (
                      <li
                        key={day.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-bold text-indigo-700">
                          D{day.day_num}
                        </span>
                        <span className="text-slate-600 truncate flex-1">
                          {day.title || "ไม่ได้ระบุชื่อวัน"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Partner Creation Modal */}
      <PartnerModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        onSubmit={handleCreatePartner}
        partnerTypes={partnerTypes}
      />

      {/* Modern Feedback / Alert Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal((prev) => ({ ...prev, isOpen: false }))}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        confirmText={feedbackModal.confirmText}
        cancelText={feedbackModal.cancelText}
        confirmBtnClass={feedbackModal.confirmBtnClass}
        cancelBtnClass={feedbackModal.cancelBtnClass}
        onConfirm={feedbackModal.onConfirm}
        onCancel={() =>
          setFeedbackModal((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </div>
  );
}
