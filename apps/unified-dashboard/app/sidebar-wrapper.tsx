'use client';

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const UniversalNavigation = dynamic(
  () => import("@openrouter-crew/shared-ui-components/navigation").then((mod) => mod.UniversalNavigation),
  { ssr: false }
);

export function SidebarWrapper() {
  const pathname = usePathname();

  return (
    <aside suppressHydrationWarning className="flex-shrink-0 h-full border-r border-white/10 bg-[var(--card-bg)] w-64">
      <UniversalNavigation variant="sidebar" currentPath={pathname} />
    </aside>
  );
}