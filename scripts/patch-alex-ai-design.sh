#!/bin/bash

echo "🎨 Applying Universal Design System to Alex AI Dashboard..."

# 1. Overwrite globals.css with Unified Theme
# This replaces the custom RGB gradients with the platform's flat dark theme
cat > domains/alex-ai-universal/dashboard/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Unified Design System Tokens */
  --background: #0b0d11;
  --foreground: #ffffff;
  --card-bg: #16181d;
  --card: #16181d;
  --border: rgba(255, 255, 255, 0.1);
  --radius: 0.75rem;
  --accent: #60a5fa;
  --text-muted: #9ca3af;
  --text: #ffffff;

  /* Legacy/Specific Alex AI Vars (Preserved for component compatibility) */
  --alex-purple: #7c5cff;
  --alex-blue: #0077b6;
  --alex-gold: #c9a227;
}

html,
body {
  height: 100%;
  background: var(--background);
  color: var(--foreground);
}
EOF

# 2. Update layout.tsx to use new tokens and Inter font
# This removes conflicting stylesheets and applies the background color to the body
cat > domains/alex-ai-universal/dashboard/app/layout.tsx << 'EOF'
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
EOF

echo "✅ Patch applied successfully."