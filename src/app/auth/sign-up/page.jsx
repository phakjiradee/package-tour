import React from "react";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: "สมัครสมาชิก | Package Tour",
  description: "สร้างบัญชีผู้ใช้ใหม่สำหรับ Package Tour",
};

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-blue-50 p-4 sm:p-8">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl" />
      <AuthForm mode="sign-up" />
    </div>
  );
}
