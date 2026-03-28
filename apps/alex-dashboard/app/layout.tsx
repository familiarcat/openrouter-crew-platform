import type { Metadata } from 'next';
import { Inter } from "next/font/google";
import { StateProvider } from '@/lib/state-manager';
import DashboardChrome from '@/components/DashboardChrome';
import './globals.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Alex AI - Vibe Coding Platform',
  description: 'Multi-project management with AI crew guidance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <StateProvider>
          <DashboardChrome />
          <main className="min-h-screen">
            {children}
          </main>
        </StateProvider>
      </body>
    </html>
  );
}
