"use client";

import { usePathname } from "next/navigation";
import BackofficeNavbar from "@/components/layout/BackofficeNavbar";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/backoffice/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <BackofficeNavbar />
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
