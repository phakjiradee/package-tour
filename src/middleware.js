import { NextResponse } from "next/server";

// The API verifies signatures and current roles. This check keeps a token for one
// portal from opening a different portal's UI, including after its expiry.
function tokenMatches(token, portal) {
  if (!token) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      (character) => character.charCodeAt(0)
    )));
    if (!Number.isSafeInteger(payload.exp) || payload.exp * 1000 <= Date.now()) return false;
    if (payload.portal !== portal) return false;
    if (portal === "supplier") return Number.isInteger(payload.id) && !!payload.email;
    if (payload.isEmployee !== true) return false;
    const role = String(payload.role || "").trim().toLowerCase();
    if (portal === "guide") return role === "ไกด์" || role === "guide";
    return role !== "ไกด์" && role !== "guide" && role !== "suppler" && role !== "supplier" && role !== "user";
  } catch {
    return false;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const portal = pathname.startsWith("/backoffice") ? "backoffice"
    : pathname.startsWith("/supplier") ? "supplier" : "guide";
  const cookieName = { backoffice: "bo_token", supplier: "sp_token", guide: "gd_token" }[portal];
  const loginPath = { backoffice: "/backoffice/login", supplier: "/supplier/login", guide: "/worker/login" }[portal];
  const homePath = { backoffice: "/backoffice/dashboard", supplier: "/supplier", guide: "/worker/assignment" }[portal];
  const token = request.cookies.get(cookieName)?.value;
  const valid = tokenMatches(token, portal);

  if (pathname === loginPath) {
    if (valid) return NextResponse.redirect(new URL(homePath, request.url));
    const response = NextResponse.next();
    if (token) response.cookies.delete(cookieName);
    return response;
  }
  if (valid) return NextResponse.next();
  const url = new URL(loginPath, request.url);
  url.searchParams.set("from", pathname);
  const response = NextResponse.redirect(url);
  if (token) response.cookies.delete(cookieName);
  return response;
}

export const config = {
  matcher: ["/backoffice/:path*", "/supplier/:path*", "/worker/:path*"],
};
