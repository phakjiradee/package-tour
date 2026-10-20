"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  UserPlus,
  Search,
  X,
  Check,
  Loader2,
  Copy,
  Crown,
} from "lucide-react";
import authService from "@/service/auth";
import Image from "next/image";

export const DEFAULT_USER_AVATAR = "/no-image-user-v1.jpg";

// Mock image avatars from public/
export const MOCK_AVATARS = [
  "/image 1.png",
  "/image 3.png",
  "/image 4.png",
  "/image 5.png",
  "/image 6.png",
  "/image 7.png",
  "/image 8.png",
];

const PRESET_USER_AVATARS = {
  muping: "/image 1.png",
  pooh01: "/image 3.png",
  pooh02: "/image 4.png",
  ormsin: "/image 5.png",
};

export function getUserAvatar(user, fallbackIndex = 0) {
  if (!user) return DEFAULT_USER_AVATAR;
  if (user.avatar) return user.avatar;
  const nameKey = user.name?.toLowerCase().trim();
  if (nameKey && PRESET_USER_AVATARS[nameKey]) {
    return PRESET_USER_AVATARS[nameKey];
  }
  const key = String(user.id || user.name || user.email || fallbackIndex);
  if (!key) return DEFAULT_USER_AVATAR;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (
    MOCK_AVATARS[Math.abs(hash) % MOCK_AVATARS.length] || DEFAULT_USER_AVATAR
  );
}

export function UserAvatar({
  user,
  size = "md",
  className = "",
  showCrown = false,
  fallback = DEFAULT_USER_AVATAR,
}) {
  const avatarSrc = getUserAvatar(user) || fallback;
  const [imgSrc, setImgSrc] = useState(avatarSrc);

  useEffect(() => {
    setImgSrc(getUserAvatar(user) || fallback);
  }, [user, fallback]);

  const sizeClasses =
    {
      xs: "h-5 w-5",
      sm: "h-7 w-7",
      md: "h-8 w-8",
      lg: "h-9 w-9",
      xl: "h-10 w-10",
    }[size] || "h-8 w-8";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white shadow-xs ${sizeClasses} ${className}`}
    >
      <Image
        width={32}
        height={32}
        src={imgSrc || fallback}
        alt={user?.name || "avatar"}
        onError={() => {
          if (imgSrc !== fallback) {
            setImgSrc(fallback);
          }
        }}
        className="h-full w-full object-cover rounded-full"
      />
      {showCrown && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-white ring-1 ring-white z-10">
          <Crown className="h-2 w-2" />
        </span>
      )}
    </div>
  );
}

export default function CollaboratorBox({
  currentUser,
  collaborators = [],
  onAddCollaborator,
  onRemoveCollaborator,
  variant = "sidebar", // "sidebar" or "full"
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isModalOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsModalOpen = controlledOnOpenChange || setInternalIsOpen;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const searchInputRef = useRef(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isModalOpen]);

  // Debounced search for users
  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await authService.searchUsers(searchQuery);
        if (!ignore && res?.users) {
          setSearchResults(res.users);
        }
      } catch (err) {
        console.error("Failed to search users:", err);
      } finally {
        if (!ignore) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSelectUser = (user) => {
    if (!user) return;
    const alreadyAdded = collaborators.some((c) => c.id === user.id);
    if (alreadyAdded) return;
    if (currentUser && currentUser.id === user.id) return;

    onAddCollaborator(user);
    setSearchQuery("");
  };

  const handleRemove = (user) => {
    onRemoveCollaborator(user);
  };

  const handleCopyInviteLink = () => {
    if (typeof window !== "undefined") {
      const inviteUrl = `${window.location.origin}${window.location.pathname}?collab_invite=true`;
      navigator.clipboard?.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isUserCollab = (userId) => {
    return collaborators.some((c) => c.id === userId);
  };

  const isCurrentUser = (userId) => {
    return currentUser && currentUser.id === userId;
  };

  // Render Modal
  const renderModal = () => {
    if (!isModalOpen) return null;

    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[88vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  เพิ่มผู้ร่วมทริป (Collaborators)
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                    {collaborators.length + 1} คน
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ค้นหาเพื่อนเพื่อชวนมาร่วมแชร์ทริปและค่าใช้จ่ายด้วยกัน สไตล์
                  GitHub
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal Body: Search & Results */}
          <div className="p-5 flex-1 overflow-y-auto space-y-5">
            {/* Search Input & Floating Dropdown */}
            <div className="relative">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 block">
                ค้นหาผู้ใช้
              </label>
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="พิมพ์ชื่อผู้ใช้ (@username) หรืออีเมล เช่น pooh, ormsin..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-9 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 shadow-inner focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Floating Dropdown Results - Only shown when searching */}
              {searchQuery.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50/90 border-b border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      ผลการค้นหา &quot;{searchQuery}&quot;
                    </span>
                    {isSearching && (
                      <span className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-medium">
                        <Loader2 className="h-3 w-3 animate-spin" />{" "}
                        กำลังค้นหา...
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {isSearching && searchResults.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        กำลังค้นหาผู้ใช้งานในระบบ...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="py-6 px-4 text-center text-xs text-slate-400">
                        ไม่พบผู้ใช้งานที่ตรงกับ &quot;{searchQuery}&quot;
                      </div>
                    ) : (
                      searchResults.map((u) => {
                        const isAdded = isUserCollab(u.id);
                        const isSelf = isCurrentUser(u.id);

                        return (
                          <div
                            key={u.id}
                            className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <UserAvatar user={u} size="lg" />
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                  @{u.name}
                                </p>
                                <p className="text-xs text-slate-400 truncate">
                                  {u.email}
                                </p>
                              </div>
                            </div>

                            <div>
                              {isSelf ? (
                                <span
                                  title="คุณ (Owner)"
                                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200"
                                >
                                  <Crown className="h-4 w-4" />
                                </span>
                              ) : isAdded ? (
                                <span
                                  title="เพิ่มแล้ว"
                                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200"
                                >
                                  <Check className="h-4 w-4" />
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSelectUser(u)}
                                  title="ชวนร่วมทริป"
                                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs active:scale-95 cursor-pointer"
                                >
                                  <UserPlus className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current Active Trip Members */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  ผู้ร่วมทริปในขณะนี้ ({collaborators.length + 1} ท่าน)
                </span>
                <span className="text-[11px] text-indigo-600 font-medium">
                  {collaborators.length > 0
                    ? `คุณ 1 + Collab ${collaborators.length}`
                    : "คุณ 1 คน"}
                </span>
              </div>

              {/* Compact Overlapping Avatars & Member Chips */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-3">
                {/* 1. Overlapping Avatars Stack (Row 1) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center -space-x-2.5 py-0.5">
                    {/* Owner Avatar */}
                    <UserAvatar
                      user={currentUser || { name: "คุณ" }}
                      size="lg"
                      showCrown
                    />

                    {/* Collaborator Overlapping Avatars */}
                    {collaborators.map((collab) => (
                      <div
                        key={collab.id}
                        title={`@${collab.name} (${collab.email})`}
                        className="group relative cursor-pointer"
                      >
                        <UserAvatar
                          user={collab}
                          size="lg"
                          className="transition-transform group-hover:scale-105 group-hover:z-10"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemove(collab)}
                          title={`นำ @${collab.name} ออก`}
                          className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white ring-1 ring-white shadow-xs z-20 hover:scale-110"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <span className="text-[11px] font-semibold text-slate-400">
                    {collaborators.length + 1} คนในทริปนี้
                  </span>
                </div>

                {/* 2. User Name Boxes / Chips (Row 2 - Placed below avatar stack) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-200/60">
                  {/* Owner Chip */}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 py-0.5 pl-1 pr-2 text-xs font-bold text-indigo-800 border border-indigo-200/60 shadow-2xs">
                    <UserAvatar
                      user={currentUser || { name: "คุณ" }}
                      size="xs"
                    />
                    <span>{currentUser?.name || "คุณ"}</span>
                    <span
                      title="Owner"
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xs"
                    >
                      <Crown className="h-2.5 w-2.5" />
                    </span>
                  </span>

                  {/* Collaborator Chips */}
                  {collaborators.map((collab) => (
                    <span
                      key={collab.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white py-0.5 pl-1 pr-2 text-xs font-medium text-slate-700 border border-slate-200 shadow-2xs hover:border-rose-300 transition-colors"
                    >
                      <UserAvatar user={collab} size="xs" />
                      <span className="font-semibold text-slate-900">
                        @{collab.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemove(collab)}
                        title={`นำ @${collab.name} ออก`}
                        className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/80">
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600">คัดลอกลิงก์แล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>คัดลอกลิงก์ชวนเพื่อน</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              เสร็จสิ้น
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="mb-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3.5">
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                ผู้ร่วมทริป (Collab)
              </span>
            </div>
          </div>

          <span className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
            {collaborators.length + 1} คน
          </span>
        </div>

        {/* Avatar Stack & Action Button */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Overlapping Avatars */}
          <div className="flex items-center -space-x-2 py-0.5">
            {/* Owner Avatar */}
            <div title={`${currentUser?.name || "คุณ"} (Owner)`}>
              <UserAvatar
                user={currentUser || { name: "คุณ" }}
                size="md"
                showCrown
              />
            </div>

            {/* Collaborators Avatars */}
            {collaborators.slice(0, 3).map((collab) => (
              <div key={collab.id} title={`@${collab.name}`}>
                <UserAvatar user={collab} size="md" />
              </div>
            ))}

            {collaborators.length > 3 && (
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 ring-2 ring-white shadow-xs">
                +{collaborators.length - 3}
              </div>
            )}
          </div>

          {/* Modal Trigger Button (Circular with dashed border) */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            title={
              collaborators.length > 0
                ? "จัดการ / ชวนเพิ่ม"
                : "ชวนเพื่อน (Collab)"
            }
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-indigo-300 bg-white text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <UserPlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Render Modal into document.body */}
      {mounted && isModalOpen && createPortal(renderModal(), document.body)}
    </>
  );
}
