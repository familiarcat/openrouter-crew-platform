import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "./app-shell";

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
      <body suppressHydrationWarning className="antialiased">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
