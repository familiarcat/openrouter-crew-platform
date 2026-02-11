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
      <body className={`${inter.className} flex h-screen overflow-hidden bg-gray-50`}>
        <aside className="flex-shrink-0 h-full border-r bg-white w-64">
          <UniversalNavigation variant="sidebar" />
        </aside>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </body>
    </html>
  );
}