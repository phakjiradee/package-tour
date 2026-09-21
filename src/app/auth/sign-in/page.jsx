import React from 'react';
import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: 'เข้าสู่ระบบ | Package Tour',
  description: 'เข้าสู่ระบบบัญชีของคุณ',
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-8 bg-zinc-50/50 dark:bg-zinc-900/50">
      <AuthForm mode="sign-in" />
    </div>
  );
}