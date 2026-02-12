'use client';

import dynamic from "next/dynamic";

const UniversalNavigation = dynamic(
  () => import("@openrouter-crew/shared-ui-components/navigation").then((mod) => mod.UniversalNavigation),
  { ssr: false }
);

export function SidebarWrapper() {
  return (
    <aside suppressHydrationWarning className="flex-shrink-0 h-full border-r border-white/10 bg-[#16181d] w-64">
      <UniversalNavigation variant="sidebar" />
    </aside>
  );
}