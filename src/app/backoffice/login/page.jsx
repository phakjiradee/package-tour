import React from "react";
import EmployeeLoginForm from "@/components/auth/EmployeeLoginForm";

export const metadata = {
  title: "เข้าสู่ระบบพนักงาน | Zentura Backoffice",
  description: "เข้าสู่ระบบบริหารจัดการ Backoffice สำหรับพนักงานและผู้ดูแลระบบ",
};

export default function BackofficeLoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-100/70 p-4">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" />
      <EmployeeLoginForm />
    </div>
  );
}
