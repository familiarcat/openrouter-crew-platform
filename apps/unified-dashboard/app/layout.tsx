import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UniversalNavigation } from "@openrouter-crew/shared-ui-components/navigation";

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
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.className} flex h-screen overflow-hidden`}>
        <aside suppressHydrationWarning className="flex-shrink-0 h-full border-r border-white/10 bg-[#16181d] w-64">
          <UniversalNavigation variant="sidebar" />
        </aside>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}