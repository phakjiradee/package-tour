"use client";

import GuideNavbar from "@/components/layout/GuideNavbar";

export default function GuideWorkerLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f7f8f9] text-zinc-900 flex flex-col font-sans antialiased pb-14 md:pb-0">
      <GuideNavbar />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-5 lg:p-6">
        {children}
      </main>
    </div>
  );
}
