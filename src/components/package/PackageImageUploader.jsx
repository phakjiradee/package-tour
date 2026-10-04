"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Star,
  Trash2,
  Plus,
  ArrowLeft,
  ArrowRight,
  Link as LinkIcon,
  Check,
  AlertCircle
} from "lucide-react";

export default function PackageImageUploader({ images = [], onChange }) {
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  // Handle file upload from computer via API
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError("");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }

    try {
      const res = await fetch("http://localhost:4000/api/upload/multiple", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
      }

      const result = await res.json();
      if (result.success && Array.isArray(result.files)) {
        const currentCount = images.length;
        const newUploaded = result.files.map((f, idx) => ({
          image_url: f.image_url,
          is_cover: currentCount === 0 && idx === 0,
          sort_order: currentCount + idx,
          caption: f.caption || "",
        }));

        onChange([...images, ...newUploaded]);
      }
    } catch (err) {
      console.error(err);
      setUploadError(err.message || "อัปโหลดล้มเหลว");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle URL addition
  const handleAddUrl = (e) => {
    e?.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    const isFirst = images.length === 0;
    const newImage = {
      image_url: trimmed,
      is_cover: isFirst,
      sort_order: images.length,
      caption: "",
    };

    onChange([...images, newImage]);
    setUrlInput("");
  };

  // Set cover image
  const handleSetCover = (index) => {
    const updated = images.map((img, idx) => ({
      ...img,
      is_cover: idx === index,
    }));
    onChange(updated);
  };

  // Remove image
  const handleRemoveImage = (index) => {
    const filtered = images.filter((_, idx) => idx !== index);
    // If the removed image was cover, make the first one cover
    const hasCover = filtered.some((img) => img.is_cover);
    if (!hasCover && filtered.length > 0) {
      filtered[0].is_cover = true;
    }
    // Re-index sort_order
    const reindexed = filtered.map((img, idx) => ({
      ...img,
      sort_order: idx,
    }));
    onChange(reindexed);
  };

  // Move image (reorder)
  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const list = [...images];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const reordered = list.map((img, idx) => ({
      ...img,
      sort_order: idx,
    }));
    onChange(reordered);
  };

  // Update caption
  const handleCaptionChange = (index, text) => {
    const updated = [...images];
    updated[index] = { ...updated[index], caption: text };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone & URL Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            isUploading
              ? "border-blue-300 bg-blue-50/50"
              : "border-slate-200 bg-slate-50/60 hover:border-blue-400 hover:bg-blue-50/30"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-blue-600">
              {isUploading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {isUploading ? "กำลังอัปโหลดรูปภาพ..." : "คลิกเพื่อเลือกรูปภาพจากเครื่อง"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                รองรับไฟล์ PNG, JPG, WEBP (เลือกได้พร้อมกันหลายรูป)
              </p>
            </div>
          </div>
        </div>

        {/* URL Input Box */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <LinkIcon className="h-3.5 w-3.5 text-blue-600" />
              <span>หรือเพิ่มจากลิงก์รูปภาพภายนอก</span>
            </label>
            <p className="text-xs text-slate-400 mt-1">
              ระบุ URL ของรูปภาพ เช่น จาก Unsplash หรือคลังภาพออนไลน์
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddUrl}
              disabled={!urlInput.trim()}
              className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>เพิ่ม</span>
            </button>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Images List / Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            คลังรูปภาพของแพ็กเกจ ({images.length} รูป)
          </span>
          {images.length > 0 && (
            <span className="text-[11px] text-slate-400">
              *คลิกไอคอนรูปดาว ⭐ เพื่อเลือกภาพหน้าปกหลักของทริป
            </span>
          )}
        </div>

        {images.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-slate-400">
            <ImageIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-medium">ยังไม่มีรูปภาพในแพ็กเกจนี้</p>
            <p className="text-[11px] text-slate-400">อัปโหลดรูปภาพด้านบนเพื่อให้แพ็กเกจดูน่าสนใจยิ่งขึ้น</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img, index) => (
              <div
                key={index}
                className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                  img.is_cover
                    ? "border-amber-400 ring-2 ring-amber-300/40"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Image Container */}
                <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={img.image_url}
                    alt={img.caption || `ภาพที่ ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1589394815804-964ce0fa2556?auto=format&fit=crop&w=400&q=80";
                    }}
                  />

                  {/* Cover Badge */}
                  {img.is_cover ? (
                    <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
                      <Star className="h-3 w-3 fill-white" />
                      <span>รูปหน้าปก</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetCover(index)}
                      className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md opacity-90 hover:opacity-100 hover:bg-amber-600 transition"
                    >
                      <Star className="h-3 w-3" />
                      <span>ตั้งเป็นหน้าปก</span>
                    </button>
                  )}

                  {/* Order & Delete Actions */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-600/90 text-white shadow hover:bg-rose-700 transition"
                      title="ลบรูปภาพนี้"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Footer Controls: Caption & Move */}
                <div className="p-3 bg-white space-y-2">
                  <input
                    type="text"
                    placeholder="คำอธิบายรูปภาพ (Caption / Alt)..."
                    value={img.caption || ""}
                    onChange={(e) => handleCaptionChange(index, e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400">
                      ลำดับ #{index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        title="เลื่อนไปข้างหน้า"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 1)}
                        disabled={index === images.length - 1}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        title="เลื่อนไปข้างหลัง"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
