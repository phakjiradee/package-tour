"use client";

import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Grid,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
  Maximize2
} from "lucide-react";

export default function PackageGallery({ images = [], fallbackImage, packageName }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Normalize image list
  const galleryImages = images && images.length > 0
    ? images
    : fallbackImage
      ? [{ image_url: fallbackImage, is_cover: true, caption: packageName }]
      : [];

  const total = galleryImages.length;

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
      if (e.key === "ArrowRight") setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, total]);

  if (total === 0) {
    return (
      <div className="flex h-72 sm:h-96 w-full items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
        <Compass className="h-12 w-12 stroke-[1.5]" />
      </div>
    );
  }

  // 1 Image layout
  if (total === 1) {
    return (
      <>
        <div
          onClick={() => openLightbox(0)}
          className="group relative h-80 sm:h-[420px] w-full cursor-pointer overflow-hidden rounded-3xl bg-slate-100 shadow-sm"
        >
          <img
            src={galleryImages[0].image_url}
            alt={galleryImages[0].caption || packageName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <button className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md shadow-md">
            <Maximize2 className="h-3.5 w-3.5" />
            <span>ดูรูปขนาดเต็ม</span>
          </button>
        </div>

        {/* Lightbox Modal */}
        {lightboxOpen && renderLightbox()}
      </>
    );
  }

  // Multi-image Mosaic layout (2-5+ images)
  const coverImage = galleryImages[0];
  const secondaryImages = galleryImages.slice(1, 5);

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 h-[340px] sm:h-[430px]">
          {/* Main Cover Image (takes 2 cols on md+) */}
          <div
            onClick={() => openLightbox(0)}
            className="group relative md:col-span-2 h-full cursor-pointer overflow-hidden rounded-2xl bg-slate-100"
          >
            <img
              src={coverImage.image_url}
              alt={coverImage.caption || packageName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
          </div>

          {/* Secondary images (takes 2 cols on md+, split into 2x2 grid) */}
          <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2.5 h-full">
            {secondaryImages.map((img, idx) => {
              const actualIdx = idx + 1;
              const isLastVisible = idx === 3 && total > 5;
              const remainingCount = total - 5;

              return (
                <div
                  key={actualIdx}
                  onClick={() => openLightbox(actualIdx)}
                  className="group relative h-[208px] cursor-pointer overflow-hidden rounded-2xl bg-slate-100"
                >
                  <img
                    src={img.image_url}
                    alt={img.caption || `ภาพที่ ${actualIdx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />

                  {isLastVisible && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs text-white">
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-bold">+{remainingCount}</span>
                        <span className="text-xs font-medium">ดูรูปเพิ่มเติม</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* View All Photos Button */}
        <button
          onClick={() => openLightbox(0)}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-xs font-bold text-slate-800 backdrop-blur-md shadow-lg hover:bg-white hover:scale-105 transition-all"
        >
          <Grid className="h-4 w-4" />
          <span>ดูรูปทั้งหมด ({total} รูป)</span>
        </button>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && renderLightbox()}
    </>
  );

  function renderLightbox() {
    const current = galleryImages[currentIndex];

    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 text-white backdrop-blur-md animate-fadeIn">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide">
              {currentIndex + 1} / {total}
            </span>
            {current.is_cover && (
              <span className="rounded-full bg-amber-500/30 border border-amber-400/50 px-2.5 py-0.5 text-[11px] font-medium text-amber-200">
                รูปหน้าปก
              </span>
            )}
          </div>
          <button
            onClick={() => setLightboxOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Middle: Main Image with Prev/Next buttons */}
        <div className="relative flex flex-1 items-center justify-center px-4 py-2">
          {/* Previous Button */}
          {total > 1 && (
            <button
              onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1))}
              className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <div className="max-h-[75vh] max-w-[90vw] flex items-center justify-center">
            <img
              src={current.image_url}
              alt={current.caption || packageName}
              className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl transition-all duration-300"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";
              }}
            />
          </div>

          {/* Next Button */}
          {total > 1 && (
            <button
              onClick={() => setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0))}
              className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Bottom Bar: Caption & Thumbnails */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/40 space-y-3">
          {current.caption && (
            <p className="text-center text-xs text-slate-300 font-light max-w-xl mx-auto">
              {current.caption}
            </p>
          )}

          {/* Thumbnail list */}
          {total > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg transition-all ${
                    idx === currentIndex
                      ? "ring-2 ring-white scale-105 opacity-100"
                      : "opacity-40 hover:opacity-75"
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}
