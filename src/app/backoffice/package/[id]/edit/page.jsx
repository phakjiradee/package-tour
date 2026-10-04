"use client";

import React, { useState, useEffect } from "react";
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
  Sparkles,
  CheckCircle2,
  EyeOff,
  Ban,
  Archive
} from "lucide-react";
import PartnerModal from "@/components/partner/PartnerModal";
import { partnerService, partnerTypeService } from "@/service/partner";
import { locationService } from "@/service/location";
import PackageImageUploader from "@/components/package/PackageImageUploader";
import FeedbackModal from "@/components/ui/FeedbackModal";

export default function EditPackagePage({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const id = unwrappedParams?.id;

  const [packageData, setPackageData] = useState({
    name: "",
    description: "",
    location_id: "",
    partner_id: "",
    partner_ids: [],
    price: "",
    status: "Draft",
    image: "",
    images: [],
    addons: [],
    days: [],
  });

  const [partnersList, setPartnersList] = useState([]);
  const [partnerTypes, setPartnerTypes] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
    async function loadData() {
      if (!id) return;
      try {
        const [pkgRes, partners, types, locations] = await Promise.all([
          fetch(`http://localhost:4000/api/packages/${id}`),
          partnerService.getAll().catch(() => []),
          partnerTypeService.getAll().catch(() => []),
          locationService.getAll().catch(() => []),
        ]);

        if (!ignore) {
          setPartnersList(Array.isArray(partners) ? partners : []);
          setPartnerTypes(Array.isArray(types) ? types : []);
          setLocationsList(Array.isArray(locations) ? locations : []);
        }

        if (pkgRes.ok) {
          const data = await pkgRes.json();
          if (!ignore) {
            const mappedDays = (data.dayplans || []).map((dp) => ({
              id: dp.id,
              day_num: dp.day_num,
              title: dp.title || "",
              dt: dp.dt || "",
              description: dp.description || "",
              hotel: dp.hotel || "",
              id_location: dp.location_id || "",
              meals: dp.meals ? dp.meals.map((m) => m.meal?.type_name) : [],
              activities: dp.activities || [],
              isExpanded: false,
            }));

            const initialPartnerIds = (data.partners && data.partners.length > 0)
              ? data.partners.map((p) => p.partner_id)
              : (data.partner_id ? [data.partner_id] : []);

            const mappedAddons = (data.addons || []).map((ad) => ({
              id: ad.id,
              addon_name: ad.addon_name || "",
              price: ad.price !== null && ad.price !== undefined ? String(ad.price) : "",
              max_limit: ad.max_limit || 20,
              status: ad.status !== undefined ? ad.status : 1,
              booking_id: ad.booking_id || null,
            }));

            setPackageData({
              name: data.name || "",
              description: data.description || "",
              location_id: data.location_id ? String(data.location_id) : "",
              partner_id: data.partner_id ? String(data.partner_id) : "",
              partner_ids: initialPartnerIds,
              price: data.price !== null && data.price !== undefined ? String(data.price) : "",
              status: data.status || "Draft",
              image: data.image || "",
              images: Array.isArray(data.images) && data.images.length > 0
                ? data.images
                : (data.image ? [{ image_url: data.image, is_cover: true, sort_order: 0, caption: "" }] : []),
              addons: mappedAddons,
              days: mappedDays,
            });
          }
        }
      } catch (error) {
        console.error("Failed to load edit data:", error);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handlePackageChange = (field, value) => {
    setPackageData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTogglePartner = (partnerId) => {
    const pId = Number(partnerId);
    setPackageData((prev) => {
      const currentIds = prev.partner_ids || [];
      const exists = currentIds.includes(pId);
      const newIds = exists ? currentIds.filter((item) => item !== pId) : [...currentIds, pId];
      return {
        ...prev,
        partner_ids: newIds,
        partner_id: newIds.length > 0 ? String(newIds[0]) : "",
      };
    });
  };

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
        message: error.response?.data?.message || "ไม่สามารถสร้างพาร์ทเนอร์ได้ โปรดตรวจสอบข้อมูล",
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

  const handleDayChange = (dayIndex, field, value) => {
    setPackageData((prev) => {
      const newDays = [...prev.days];
      newDays[dayIndex] = { ...newDays[dayIndex], [field]: value };
      return { ...prev, days: newDays };
    });
  };

  const toggleDayExpand = (dayIndex) => {
    setPackageData((prev) => {
      const newDays = [...prev.days];
      newDays[dayIndex] = { ...newDays[dayIndex], isExpanded: !newDays[dayIndex].isExpanded };
      return { ...prev, days: newDays };
    });
  };

  const addDay = () => {
    setPackageData((prev) => ({
      ...prev,
      days: [
        ...prev.days,
        {
          id: Date.now() + Math.random(),
          day_num: prev.days.length + 1,
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
    }));
  };

  const removeDay = (indexToRemove) => {
    setPackageData((prev) => {
      const newDays = prev.days.filter((_, i) => i !== indexToRemove);
      const updatedDays = newDays.map((day, i) => ({ ...day, day_num: i + 1 }));
      return { ...prev, days: updatedDays };
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
      newDays[dayIndex] = { ...newDays[dayIndex], activities: newActivities, isExpanded: true };
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
      const newActivities = newDays[dayIndex].activities.filter((_, i) => i !== actIndex);
      newDays[dayIndex] = { ...newDays[dayIndex], activities: newActivities };
      return { ...prev, days: newDays };
    });
  };

  const toggleMeal = (dayIndex, mealType) => {
    setPackageData((prev) => {
      const newDays = [...prev.days];
      const meals = [...newDays[dayIndex].meals];
      if (meals.includes(mealType)) {
        newDays[dayIndex] = { ...newDays[dayIndex], meals: meals.filter((m) => m !== mealType) };
      } else {
        newDays[dayIndex] = { ...newDays[dayIndex], meals: [...meals, mealType] };
      }
      return { ...prev, days: newDays };
    });
  };

  const handleSave = async () => {
    if (!packageData.name.trim()) {
      showFeedback({
        type: "warning",
        title: "กรุณาระบุชื่อแพ็กเกจ",
        message: "กรุณากรอกชื่อแพ็กเกจท่องเที่ยว (Package Title) ก่อนทำการบันทึก",
      });
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(`http://localhost:4000/api/packages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packageData),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback({
          type: "success",
          title: "อัปเดตแพ็กเกจเรียบร้อยแล้ว!",
          message: "ข้อมูลและการเปลี่ยนแปลงทั้งหมดถูกบันทึกเข้าสู่ระบบอย่างสมบูรณ์",
          confirmText: "กลับหน้ารายการ",
          cancelText: "แก้ไขต่อในหน้านี้",
          onConfirm: () => router.push("/backoffice/package"),
        });
      } else {
        showFeedback({
          type: "error",
          title: "อัปเดตไม่สำเร็จ",
          message: data.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="text-sm font-medium text-slate-500">กำลังโหลดข้อมูลแพ็กเกจ...</p>
        </div>
      </div>
    );
  }

  const handleCancelClick = () => {
    showFeedback({
      type: "warning",
      title: "ยืนยันการยกเลิกการแก้ไข",
      message: "การเปลี่ยนแปลงที่คุณทำไว้จะไม่ได้รับการบันทึก คุณแน่ใจหรือไม่ว่าต้องการยกเลิกและกลับไปยังหน้ารายการ?",
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
    0
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sticky Top Header */}
      <header className="sticky top-16 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 shadow-xs backdrop-blur-md">
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
                แก้ไขแพ็กเกจทัวร์ #{id}
              </h1>
              {packageData.status === "Published" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Published (เปิดขาย & ให้จอง)
                </span>
              )}
              {packageData.status === "Draft" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                  Draft (ฉบับร่าง - ซ่อน)
                </span>
              )}
              {packageData.status === "Closed" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                  Closed (ปิดรับจอง)
                </span>
              )}
              {packageData.status === "Archived" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                  Archived (เก็บถาวร)
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
            {isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
        </div>
      </header>

      {/* Quick Navigation Anchor Bar */}
      <div className="sticky top-32 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 py-2 flex items-center gap-2 overflow-x-auto text-xs font-semibold shadow-xs">
        <a href="#overview" className="rounded-lg px-3 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
          1. ข้อมูลพื้นฐาน
        </a>
        <a href="#gallery" className="rounded-lg px-3 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-indigo-600" />
          2. รูปภาพ ({packageData.images?.length || 0})
        </a>
        <a href="#partners" className="rounded-lg px-3 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
          3. ผู้ให้บริการร่วม ({packageData.partner_ids?.length || 0})
        </a>
        <a href="#addons" className="rounded-lg px-3 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          4. บริการเสริมพิเศษ ({packageData.addons?.length || 0})
        </a>
        <a href="#itinerary" className="rounded-lg px-3 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
          5. แผนการเดินทาง ({packageData.days?.length || 0} วัน)
        </a>
      </div>

      {/* Main Layout Workspace */}
      <div className="mx-auto max-w-7xl p-6 lg:flex lg:gap-8 lg:p-8">
        
        {/* Left Column: Canvas */}
        <div className="flex-1 space-y-8 pb-20">
          
          {/* SECTION: Overview */}
          <section id="overview" className="scroll-mt-44">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">ข้อมูลพื้นฐานแพ็กเกจ</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  ระบุชื่อ รายละเอียด และจุดหมายปลายทางหลักของโปรแกรมทัวร์
                </p>
              </div>
            </div>
            
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="space-y-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    ชื่อแพ็กเกจท่องเที่ยว <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={packageData.name}
                    onChange={(e) => handlePackageChange("name", e.target.value)}
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
                    onChange={(e) => handlePackageChange("description", e.target.value)}
                    placeholder="ระบุภาพรวมของโปรแกรมทัวร์ ไฮไลท์สำคัญ และประสบการณ์พิเศษที่นักท่องเที่ยวจะได้รับ..."
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      จุดหมายปลายทางหลัก
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Map className="h-4 w-4 text-slate-400" />
                      </div>
                      <select
                        value={packageData.location_id}
                        onChange={(e) => handlePackageChange("location_id", e.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">เลือกจุดหมายปลายทางหลัก</option>
                        {locationsList.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} {loc.lct_type?.name ? `(${loc.lct_type.name})` : ""}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
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
                  const cover = updatedImages.find((img) => img.is_cover) || updatedImages[0];
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
                  เลือกและเชื่อมโยงพันธมิตรธุรกิจ เช่น โรงแรม, เรือนำเที่ยว, หรือร้านอาหารที่ร่วมในรายการนี้
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPartnerModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                เพิ่มพันธมิตรใหม่
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    เลือกผู้ให้บริการที่ร่วมในแพ็กเกจนี้
                  </label>
                  {partnersList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400">
                      ยังไม่มีข้อมูลพันธมิตรในระบบ สามารถกดปุ่ม &quot;เพิ่มพันธมิตรใหม่&quot; ด้านบนเพื่อสร้างข้อมูลได้ทันที
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {partnersList.map((partner) => {
                        const isSelected = (packageData.partner_ids || []).includes(partner.id);
                        return (
                          <div
                            key={partner.id}
                            onClick={() => handleTogglePartner(partner.id)}
                            className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50/60 shadow-sm ring-1 ring-indigo-600"
                                : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-semibold text-sm text-slate-900 truncate">
                                  {partner.name}
                                </span>
                              </div>
                              {partner.pt_type?.name && (
                                <span className="inline-block rounded-md bg-slate-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-700 mb-1.5">
                                  {partner.pt_type.name}
                                </span>
                              )}
                              <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400" /> {partner.phone}
                              </div>
                            </div>
                            <div
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                                isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Partners Summary Chips */}
                {(packageData.partner_ids || []).length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      ผู้ให้บริการร่วมที่เลือก ({(packageData.partner_ids || []).length} แห่ง)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {partnersList
                        .filter((p) => (packageData.partner_ids || []).includes(p.id))
                        .map((partner) => (
                          <span
                            key={partner.id}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-900 shadow-sm"
                          >
                            <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                            <span>{partner.name}</span>
                            {partner.pt_type?.name && (
                              <span className="rounded bg-indigo-200/60 px-1.5 py-0.5 text-[10px] text-indigo-800">
                                {partner.pt_type.name}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePartner(partner.id);
                              }}
                              className="ml-1 text-indigo-400 hover:text-indigo-800 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SECTION: Add-on Packages */}
          <section id="addons" className="scroll-mt-44">
            <div className="flex items-center justify-between mb-4 mt-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  บริการเสริมและตัวเลือกพิเศษ
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  กำหนดบริการเสริมหรือแพ็กเกจอัปเกรดที่ลูกค้าสามารถเลือกซื้อเพิ่มได้พร้อมการจอง
                </p>
              </div>
              <button
                type="button"
                onClick={addAddon}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-xs"
              >
                <Plus className="h-4 w-4" />
                เพิ่มบริการเสริม
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {(!packageData.addons || packageData.addons.length === 0) ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-sm text-slate-500 mb-3">ยังไม่มีบริการเสริมสำหรับแพ็กเกจนี้</p>
                  <button
                    type="button"
                    onClick={addAddon}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
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
                          ชื่อบริการเสริม / แพ็กเกจเสริม
                        </label>
                        <input
                          type="text"
                          value={addon.addon_name}
                          onChange={(e) => updateAddon(index, "addon_name", e.target.value)}
                          placeholder="เช่น บริการรถรับ-ส่งส่วนตัวสนามบิน, ประกันอุบัติเหตุพิเศษ"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="w-full sm:w-36">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                          ราคา / หน่วย (บาท)
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-xs text-slate-400 font-semibold">฿</span>
                          </div>
                          <input
                            type="number"
                            value={addon.price}
                            onChange={(e) => updateAddon(index, "price", e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="w-full sm:w-32">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                          โควตาจำกัด (ต่อทริป)
                        </label>
                        <input
                          type="number"
                          value={addon.max_limit}
                          onChange={(e) => updateAddon(index, "max_limit", e.target.value)}
                          placeholder="20"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="w-full sm:w-36">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                          สถานะการขาย
                        </label>
                        <select
                          value={addon.status}
                          onChange={(e) => updateAddon(index, "status", Number(e.target.value))}
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

          {/* SECTION: Itinerary Builder */}
          <section id="itinerary" className="scroll-mt-44">
            <div className="flex items-center justify-between mb-4 mt-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900">แผนการเดินทางและกิจกรรม</h2>
                <p className="text-sm text-slate-500 mt-1">กำหนดตารางกิจกรรม รายการท่องเที่ยว อาหาร และที่พักในแต่ละวันอย่างละเอียด</p>
              </div>
            </div>

            <div className="relative">
              <div className="space-y-6 relative z-10">
                {packageData.days.map((day, dayIndex) => (
                  <div key={day.id || dayIndex} className="flex gap-4 sm:gap-6">
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
                            <span className="text-xs font-bold">D{day.day_num}</span>
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
                            {day.isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
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
                                onChange={(e) => handleDayChange(dayIndex, "title", e.target.value)}
                                placeholder="เช่น ออกเดินทางสู่กระบี่ • ล่องเรือหางยาวชมทะเลแหวก"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                วันที่เดินทาง
                              </label>
                              <input
                                type="date"
                                value={day.dt}
                                onChange={(e) => handleDayChange(dayIndex, "dt", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                รายละเอียดและกำหนดการประจำวัน
                              </label>
                              <textarea
                                rows={2}
                                value={day.description}
                                onChange={(e) => handleDayChange(dayIndex, "description", e.target.value)}
                                placeholder="ระบุกำหนดการและกิจกรรมสำคัญในวันนี้อย่างกระชับ..."
                                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          <hr className="border-slate-100" />

                          {/* Logistics (Location, Hotel & Meals) */}
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Map className="h-3.5 w-3.5" /> จุดท่องเที่ยว / ปลายทางของวันนี้
                              </label>
                              <select
                                value={day.id_location || day.location_id || ""}
                                onChange={(e) => handleDayChange(dayIndex, "id_location", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="">ตามจุดหมายหลักของแพ็กเกจ</option>
                                {locationsList.map((loc) => (
                                  <option key={loc.id} value={loc.id}>
                                    {loc.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Hotel className="h-3.5 w-3.5" /> โรงแรม / ที่พัก
                              </label>
                              <input
                                type="text"
                                value={day.hotel}
                                onChange={(e) => handleDayChange(dayIndex, "hotel", e.target.value)}
                                placeholder="เช่น อ่าวนาง คลิฟฟ์ บีช รีสอร์ท หรือระบุชื่อที่พัก"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Utensils className="h-3.5 w-3.5" /> มื้ออาหารที่รวมในทริป
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
                                      {isSelected && <Check className="h-3 w-3" />}
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
                                <Clock className="h-3.5 w-3.5" /> กำหนดการและกิจกรรม ({day.activities.length})
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
                                <p className="text-center py-4 text-xs text-slate-400">ยังไม่มีกิจกรรมในวันนี้ กด &quot;เพิ่มกิจกรรม&quot; ด้านบนเพื่อระบุกิจกรรม</p>
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
                                        onChange={(e) => updateActivity(dayIndex, actIndex, "time", e.target.value)}
                                        placeholder="09:00 - 10:30"
                                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-indigo-500"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={act.activity}
                                        onChange={(e) => updateActivity(dayIndex, actIndex, "activity", e.target.value)}
                                        placeholder="รายละเอียดกิจกรรม เช่น ดำน้ำตื้นชมปะการังเกาะไก่"
                                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                                      />
                                    </div>
                                    <div className="w-full sm:w-36">
                                      <input
                                        type="text"
                                        value={act.landmark}
                                        onChange={(e) => updateActivity(dayIndex, actIndex, "landmark", e.target.value)}
                                        placeholder="สถานที่ / จุดแวะพัก"
                                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={act.status}
                                        onChange={(e) => updateActivity(dayIndex, actIndex, "status", e.target.value)}
                                        className="rounded-md border border-slate-300 py-1.5 px-2 text-xs outline-none focus:border-indigo-500 bg-white"
                                      >
                                        <option value="include">รวมในรายการทัวร์</option>
                                        <option value="optional">กิจกรรมทางเลือก (Optional)</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => removeActivity(dayIndex, actIndex)}
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

                <div className="flex items-center justify-center pt-4">
                  <button
                    type="button"
                    onClick={addDay}
                    className="flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 py-8 text-indigo-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 mb-2">
                      <Plus className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">เพิ่มวันเดินทางถัดไป</span>
                    <span className="text-xs text-indigo-400 mt-1">ขยายโปรแกรมการเดินทางสำหรับวันต่อไป</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Summary Panel */}
        <aside className="w-full lg:w-80 shrink-0">
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
                    type="number"
                    value={packageData.price}
                    onChange={(e) => handlePackageChange("price", e.target.value)}
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
                  onChange={(e) => handlePackageChange("status", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                >
                  <option value="Published">Published (เปิดขาย & ให้จองบนเว็บไซต์)</option>
                  <option value="Draft">Draft (ฉบับร่าง — ซ่อนไม่ให้ลูกค้าเห็น)</option>
                  <option value="Closed">Closed (ปิดรับจองชั่วคราว / เต็ม)</option>
                  <option value="Archived">Archived (เก็บถาวร — ซ่อนออกจากเว็บไซต์)</option>
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
                        • <strong>หน้ารวมทัวร์:</strong> ลูกค้าค้นหาและเห็นแพ็กเกจนี้ได้ตามปกติ<br />
                        • <strong>ระบบการจอง:</strong> ปุ่ม "จองแพ็กเกจนี้" เปิดใช้งาน สามารถส่งคำขอจองได้
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
                        • <strong>หน้ารวมทัวร์:</strong> ซ่อนทันที ลูกค้าจะไม่เห็นในหน้ารายการหรือผลค้นหา<br />
                        • <strong>ระบบการจอง:</strong> ปิดการจอง (หากเข้าผ่านลิงก์ตรงจะขึ้นเตือนว่าเป็นฉบับร่าง)
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
                        • <strong>หน้ารวมทัวร์:</strong> ยังคงแสดงให้ลูกค้าชมได้ แต่ขึ้นป้าย "ปิดรับจองแล้ว"<br />
                        • <strong>ระบบการจอง:</strong> ปุ่มจองถูกปิด (Disabled) ไม่สามารถกดส่งคำขอจองได้
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
                        • <strong>หน้ารวมทัวร์:</strong> ซ่อนออกจากเว็บไซต์ทั้งหมด<br />
                        • <strong>ระบบการจอง:</strong> ปิดการจองถาวร เหมาะสำหรับแพ็กเกจที่ยกเลิกแล้ว
                      </p>
                    </div>
                  )}
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
                  <span className="text-sm font-medium text-slate-600">ระยะเวลาเดินทาง</span>
                  <span className="text-sm font-bold text-slate-900">
                    {totalDays} วัน
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm font-medium text-slate-600">กิจกรรมตลอดทริป</span>
                  <span className="text-sm font-bold text-slate-900">
                    {totalActivities} จุด
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm font-medium text-slate-600">ผู้ให้บริการร่วม</span>
                  <span className="text-sm font-bold text-indigo-600">
                    {(packageData.partner_ids || []).length} ราย
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm font-medium text-slate-600">บริการเสริมพิเศษ</span>
                  <span className="text-sm font-bold text-slate-900">
                    {(packageData.addons || []).length} รายการ
                  </span>
                </div>
                
                {/* Mini Outline */}
                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    ลำดับโปรแกรมเดินทาง
                  </p>
                  <ul className="space-y-2.5">
                    {packageData.days.map((day, idx) => (
                      <li key={day.id || idx} className="flex items-center gap-2 text-xs">
                        <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-bold text-indigo-700">
                          D{day.day_num}
                        </span>
                        <span className="text-slate-600 truncate flex-1">
                          {day.title || "ยังไม่ได้ระบุไฮไลท์ประจำวัน"}
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
        onCancel={() => setFeedbackModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
