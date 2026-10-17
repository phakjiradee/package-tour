import React from "react";
import CustomerNavbar from "@/components/layout/CustomerNavbar";

export default function CustomerLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <CustomerNavbar />
      <main className="w-full flex-1">
        {children}
      </main>
    </div>
  );
}
