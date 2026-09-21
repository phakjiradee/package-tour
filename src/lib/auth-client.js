"use client";

const AUTH_KEY = "pt_auth";

let cached;
const listeners = new Set();

function readFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAuth() {
  if (cached === undefined) cached = readFromStorage();
  return cached;
}

function emit() {
  cached = undefined;
  const value = getAuth();
  listeners.forEach((listener) => listener(value));
}

export function setAuth(user) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  emit();
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_KEY);
  emit();
}

export function subscribeAuth(listener) {
  if (typeof window === "undefined") return () => {};
  listeners.add(listener);
  const onExternalChange = () => emit();
  window.addEventListener("storage", onExternalChange);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onExternalChange);
  };
}

export function getAuthServerSnapshot() {
  return null;
}
