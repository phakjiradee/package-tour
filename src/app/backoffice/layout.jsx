"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import BackofficeNavbar from "@/components/layout/BackofficeNavbar";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoginPage = pathname === "/backoffice/login";
  const isEditorPage =
    pathname.includes("/backoffice/package/create") ||
    (pathname.includes("/backoffice/package/") && pathname.includes("/edit"));

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f7f8f9] text-zinc-900 flex flex-col font-sans antialiased">
      {/* 100% Full-width sticky Topbar */}
      <BackofficeNavbar onToggleMobileMenu={() => setMobileOpen(true)} />

      {/* Workspace Body: Sidebar + Main Content */}
      <div className="relative flex flex-1 min-h-[calc(100vh-48px)]">
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <main
          className={`flex-1 min-w-0 w-full ${
            isEditorPage ? "" : "p-4 sm:p-5 lg:p-6"
          }`}
        >
          {children}
        </main>

      </div>
    </div>
  );
}

