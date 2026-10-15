import React, { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "เข้าสู่ระบบ | Zentura",
  description: "เข้าสู่ระบบบัญชีของคุณ",
};

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-linear-to-b from-white via-white">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-teal-100/30 blur-3xl" />
      <Suspense
        fallback={
          <div className="min-h-96 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        }
      >
        <AuthForm mode="sign-in" />
      </Suspense>
    </div>
  );
}
