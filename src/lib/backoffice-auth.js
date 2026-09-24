"use client";

const BO_TOKEN_KEY = "bo_token";
const BO_USER_KEY = "bo_user";

/**
 * Set backoffice authenticated employee and token
 * Stores in localStorage and sets a Cookie for Next.js middleware
 */
export function setBackofficeAuth(user, token) {
  if (typeof window === "undefined") return;

  if (token) {
    window.localStorage.setItem(BO_TOKEN_KEY, token);
    // Set cookie for Next.js middleware (30 days expiry)
    document.cookie = `${BO_TOKEN_KEY}=${encodeURIComponent(
      token
    )}; path=/; max-age=2592000; SameSite=Lax`;
  }

  if (user) {
    window.localStorage.setItem(BO_USER_KEY, JSON.stringify(user));
  }
}

/**
 * Clear backoffice employee session and delete cookie
 */
export function clearBackofficeAuth() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(BO_TOKEN_KEY);
  window.localStorage.removeItem(BO_USER_KEY);

  // Clear cookie for middleware
  document.cookie = `${BO_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Get stored backoffice employee profile
 */
export function getBackofficeAuth() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BO_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Get stored backoffice token
 */
export function getBackofficeToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(BO_TOKEN_KEY);
}

const backofficeAuth = {
  setBackofficeAuth,
  clearBackofficeAuth,
  getBackofficeAuth,
  getBackofficeToken,
};

export default backofficeAuth;
