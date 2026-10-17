"use client";

import React from "react";

export default function VideoHeader({
  videoSrc = "/header-airplane.mp4",
  poster = "/hero-sky-clouds.jpg",
  className = "",
  showBottomGradient = true,
}) {
  return (
    <div
      className={`relative w-full h-[65vh] sm:h-[78vh] lg:h-[88vh] min-h-[440px] overflow-hidden bg-slate-900 ${className}`}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={poster}
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
        <source
          src="/Airplane_floating_with_drifting_…_20261018025718.mp4"
          type="video/mp4"
        />
      </video>

      {/* Bottom white transparent gradient overlay */}
      {showBottomGradient && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-44 lg:h-56 bg-linear-to-t from-white via-white/60 to-transparent" />
      )}
    </div>
  );
}
