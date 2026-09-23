import React from "react";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: "สมัครสมาชิก | Zentura",
  description: "สร้างบัญชีผู้ใช้ใหม่สำหรับ Zentura",
};

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-linear-to-b from-white via-white">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-teal-100/30 blur-3xl" />
      <AuthForm mode="sign-up" />
    </div>
  );
}
