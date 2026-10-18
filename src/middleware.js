import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect all /backoffice routes (พนักงานทั่วไป / แอดมิน)
  if (pathname.startsWith("/backoffice")) {
    const isLoginPage = pathname === "/backoffice/login";
    const boToken = request.cookies.get("bo_token")?.value;

    // 1. If user is already logged in as employee and visits /backoffice/login -> redirect to dashboard
    if (isLoginPage) {
      if (boToken) {
        return NextResponse.redirect(new URL("/backoffice/dashboard", request.url));
      }
      return NextResponse.next();
    }

    // 2. If user is NOT logged in and attempts to access backoffice pages -> redirect to /backoffice/login
    if (!boToken) {
      const loginUrl = new URL("/backoffice/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect all /supplier routes (สำหรับ Supplier โดยเฉพาะ แยกขาดจาก backoffice)
  if (pathname.startsWith("/supplier")) {
    const isLoginPage = pathname === "/supplier/login";
    const spToken = request.cookies.get("sp_token")?.value;

    // 1. If supplier is already logged in and visits /supplier/login -> redirect to /supplier
    if (isLoginPage) {
      if (spToken) {
        return NextResponse.redirect(new URL("/supplier", request.url));
      }
      return NextResponse.next();
    }

    // 2. If supplier is NOT logged in and attempts to access supplier portal -> redirect to /supplier/login
    if (!spToken) {
      const loginUrl = new URL("/supplier/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/backoffice/:path*", "/supplier/:path*"],
};
