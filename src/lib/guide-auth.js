"use client";

export function setGuideAuth(user, token) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("gd_token", token);
  window.localStorage.setItem("gd_user", JSON.stringify(user));
  document.cookie = `gd_token=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
}

export function getGuideAuth() {
  if (typeof window === "undefined") return null;
  try {
    const user = window.localStorage.getItem("gd_user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function getGuideToken() {
  return typeof window === "undefined" ? null : window.localStorage.getItem("gd_token");
}

export function clearGuideAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("gd_token");
  window.localStorage.removeItem("gd_user");
  document.cookie = "gd_token=; path=/; max-age=0; SameSite=Lax";
}
