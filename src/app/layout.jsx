import { Anuphan } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["latin", "thai"],
  display: "swap",
});

export const metadata = {
  title: "Package Tour",
  description: "ระบบจองและจัดการแพ็กเกจทัวร์",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="th"
      className={`${anuphan.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
