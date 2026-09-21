import React from 'react';
import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: 'สมัครสมาชิก | Package Tour',
  description: 'สร้างบัญชีผู้ใช้ใหม่สำหรับ Package Tour',
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-8 bg-zinc-50/50 dark:bg-zinc-900/50">
      <AuthForm mode="sign-up" />
    </div>
  );
}