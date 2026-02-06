import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';
import DashboardNavigation from '@/components/DashboardNavigation';

export const metadata = {
  title: 'OpenRouter Crew Platform',
  description: 'Unified Dashboard for all domains',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0b0d11] text-white min-h-screen">
        <ThemeProvider>
          <div className="flex min-h-screen">
            <DashboardNavigation />
            <main className="flex-1 ml-64">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
