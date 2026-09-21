import React from "react";
import CustomerNavbar from "@/components/layout/CustomerNavbar";

export default function CustomerLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <CustomerNavbar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
