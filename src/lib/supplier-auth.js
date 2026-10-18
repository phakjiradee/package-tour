"use client";

const SP_TOKEN_KEY = "sp_token";
const SP_USER_KEY = "sp_user";

/**
 * Set supplier authenticated session and token
 * Stores in localStorage and sets a Cookie for Next.js middleware
 */
export function setSupplierAuth(user, token) {
  if (typeof window === "undefined") return;

  if (token) {
    window.localStorage.setItem(SP_TOKEN_KEY, token);
    // Set cookie for Next.js middleware (30 days expiry)
    document.cookie = `${SP_TOKEN_KEY}=${encodeURIComponent(
      token
    )}; path=/; max-age=2592000; SameSite=Lax`;
  }

  if (user) {
    window.localStorage.setItem(SP_USER_KEY, JSON.stringify(user));
  }
}

/**
 * Clear supplier session and delete cookie
 */
export function clearSupplierAuth() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(SP_TOKEN_KEY);
  window.localStorage.removeItem(SP_USER_KEY);

  // Clear cookie for middleware
  document.cookie = `${SP_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Get stored supplier profile
 */
export function getSupplierAuth() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SP_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Get stored supplier token
 */
export function getSupplierToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SP_TOKEN_KEY);
}

const supplierAuth = {
  setSupplierAuth,
  clearSupplierAuth,
  getSupplierAuth,
  getSupplierToken,
};

export default supplierAuth;
