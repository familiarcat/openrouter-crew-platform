import React from 'react';
import { SidebarWrapper } from "./sidebar-wrapper";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <SidebarWrapper />
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}