import EmployeeLoginForm from "@/components/auth/EmployeeLoginForm";

export const metadata = { title: "เข้าสู่ระบบไกด์ | Zentura" };

export default function GuideLoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-slate-100/70 p-4">
      <EmployeeLoginForm portal="guide" brandName="Zentura Guide" />
    </div>
  );
}
