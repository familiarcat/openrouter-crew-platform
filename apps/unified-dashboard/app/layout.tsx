import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarWrapper } from "./sidebar-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpenRouter Crew Platform",
  description: "Unified AI Orchestration Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} flex h-screen overflow-hidden bg-[#0b0d11] text-white`}>
        <SidebarWrapper />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}