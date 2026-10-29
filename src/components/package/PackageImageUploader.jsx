"use client";

import React, { useState, useRef } from "react";
import { getBackofficeToken } from "@/lib/backoffice-auth";
import {
  Upload,
  Image as ImageIcon,
  Star,
  Trash2,
  AlertCircle,
  Plus,
} from "lucide-react";

export default function PackageImageUploader({ images = [], onChange }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  // Common upload handler for both input and drag-and-drop
  const uploadFiles = async (files) => {
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
        headers: { Authorization: `Bearer ${getBackofficeToken() || ""}` },
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

  const handleFileUpload = (e) => {
    uploadFiles(e.target.files);
  };

  // Drag and Drop Handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
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
    const hasCover = filtered.some((img) => img.is_cover);
    if (!hasCover && filtered.length > 0) {
      filtered[0].is_cover = true;
    }
    const reindexed = filtered.map((img, idx) => ({
      ...img,
      sort_order: idx,
    }));
    onChange(reindexed);
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative space-y-4"
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-indigo-500 bg-indigo-50/95 p-6 backdrop-blur-xs transition-all pointer-events-none">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md text-indigo-600 animate-bounce">
            <Upload className="h-7 w-7" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-indigo-900">
              ปล่อยไฟล์ที่นี่เพื่ออัปโหลด
            </p>
            <p className="text-xs text-indigo-600 mt-0.5">
              รองรับไฟล์รูปภาพ PNG, JPG, WEBP
            </p>
          </div>
        </div>
      )}

      {/* Upload Zone (Visible only when no images uploaded yet) */}
      {images.length === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            isUploading
              ? "border-indigo-300 bg-indigo-50/50"
              : "border-slate-200 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/30"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-indigo-600">
              {isUploading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {isUploading
                  ? "กำลังอัปโหลดรูปภาพ..."
                  : "คลิกหรือลากไฟล์มาวางที่นี่เพื่ออัปโหลด"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                รองรับไฟล์ PNG, JPG, WEBP (เลือกหรือลากวางได้พร้อมกันหลายรูป)
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Images List / Grid */}
      {images.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                คลังรูปภาพของแพ็กเกจ ({images.length} รูป)
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition cursor-pointer disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{isUploading ? "กำลังอัปโหลด..." : "เพิ่มรูปภาพ"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div
                key={index}
                className={`group relative aspect-video w-full overflow-hidden rounded-2xl border bg-slate-100 shadow-xs transition-all ${
                  img.is_cover
                    ? "border-amber-400 ring-2 ring-amber-300/40"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt={img.caption || `ภาพที่ ${index + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://images.unsplash.com/photo-1589394815804-964ce0fa2556?auto=format&fit=crop&w=400&q=80";
                  }}
                />

                {/* Cover Badge / Button */}
                {img.is_cover ? (
                  <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
                    <Star className="h-3 w-3 fill-white" />
                    <span>รูปหน้าปก</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetCover(index)}
                    className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-slate-900/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md hover:bg-amber-600 transition shadow-xs cursor-pointer"
                  >
                    <Star className="h-3 w-3" />
                    <span>ตั้งเป็นหน้าปก</span>
                  </button>
                )}

                {/* Delete Action */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-600/90 text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
                    title="ลบรูปภาพนี้"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add More Tile */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="group aspect-video w-full flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30 text-slate-400 hover:text-indigo-600 transition cursor-pointer disabled:opacity-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs group-hover:scale-110 transition-transform">
                {isUploading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </div>
              <span className="text-xs font-semibold">
                {isUploading ? "กำลังอัปโหลด..." : "เพิ่มรูปภาพ"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
