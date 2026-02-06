#!/bin/bash

# ==============================================================================
# Enhance Unified Dashboard
#
# Scaffolds the Unified Dashboard with:
# 1. Robust Mock Data System (Source of Truth)
# 2. Theme Context & Provider
# 3. Enhanced Navigation & Layout
# 4. Feature-rich Landing Page UI
# ==============================================================================

set -e

echo "🚀 Enhancing Unified Dashboard UI and Data Structures..."

# Ensure directories exist
mkdir -p apps/unified-dashboard/lib
mkdir -p apps/unified-dashboard/components/layout
mkdir -p apps/unified-dashboard/app

# ------------------------------------------------------------------------------
# 1. Unified Mock Data System (Source of Truth)
# ------------------------------------------------------------------------------
echo "📦 Generating Unified Mock Data System..."
cat > apps/unified-dashboard/lib/unified-mock-data.ts <<EOF
/**
 * Unified Data Structure for E2E Testing
 * 
 * Schema Review:
 * - Domains: Top-level boundaries acting as tenants.
 * - Projects: Work units belonging to a domain.
 * - Metrics: Aggregated health and performance stats.
 * 
 * This structure supports:
 * - CRUD operations (Create, Read, Update, Delete projects)
 * - Filtering and Aggregation (by domain, status)
 * - Health Monitoring (uptime, error rates)
 */

export type DomainId = 'dj-booking' | 'product-factory' | 'alex-ai-universal';
export type ProjectStatus = 'active' | 'draft' | 'completed' | 'archived' | 'maintenance';
export type HealthStatus = 'healthy' | 'degraded' | 'critical';

export interface DomainConfig {
  id: DomainId;
  name: string;
  description: string;
  color: string;
  icon: string;
  port: number;
}

export interface Project {
  id: string;
  domainId: DomainId;
  name: string;
  description: string;
  status: ProjectStatus;
  budget: {
    allocated: number;
    spent: number;
    currency: string;
  };
  team: {
    leads: string[];
    size: number;
  };
  metrics: {
    uptime: number;
    requestsPerMin: number;
    errorRate: number;
  };
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  projectId?: string;
  domainId: DomainId;
  type: 'deployment' | 'alert' | 'creation' | 'update';
  message: string;
  timestamp: string;
}

// --- Mock Data Generation ---

export const DOMAINS: DomainConfig[] = [
  {
    id: 'dj-booking',
    name: 'DJ-Booking',
    description: 'Event management and artist booking platform',
    color: 'from-purple-500 to-indigo-500',
    icon: 'Music',
    port: 3001
  },
  {
    id: 'product-factory',
    name: 'Product Factory',
    description: 'Agile sprint planning and RAG workflows',
    color: 'from-cyan-500 to-blue-500',
    icon: 'Factory',
    port: 3002
  },
  {
    id: 'alex-ai-universal',
    name: 'Alex-AI Universal',
    description: 'Platform engineering and developer tools',
    color: 'from-emerald-500 to-teal-500',
    icon: 'Cpu',
    port: 3003
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-001',
    domainId: 'dj-booking',
    name: 'Summer Festival 2026',
    description: 'Main stage coordination and artist logistics',
    status: 'active',
    budget: { allocated: 50000, spent: 12500, currency: 'USD' },
    team: { leads: ['Sarah J.'], size: 8 },
    metrics: { uptime: 99.9, requestsPerMin: 450, errorRate: 0.02 },
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'proj-002',
    domainId: 'product-factory',
    name: 'Sprint 42: AI Integration',
    description: 'Integrating LLM router into core workflows',
    status: 'active',
    budget: { allocated: 15000, spent: 8200, currency: 'USD' },
    team: { leads: ['Mike T.'], size: 5 },
    metrics: { uptime: 99.5, requestsPerMin: 120, errorRate: 0.5 },
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'proj-003',
    domainId: 'alex-ai-universal',
    name: 'CLI Tool v2.0',
    description: 'Refactoring CLI for better cross-platform support',
    status: 'draft',
    budget: { allocated: 5000, spent: 0, currency: 'USD' },
    team: { leads: ['Alex'], size: 2 },
    metrics: { uptime: 100, requestsPerMin: 0, errorRate: 0 },
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'proj-004',
    domainId: 'dj-booking',
    name: 'Venue API Gateway',
    description: 'External API for venue partners',
    status: 'maintenance',
    budget: { allocated: 8000, spent: 7500, currency: 'USD' },
    team: { leads: ['DevOps'], size: 3 },
    metrics: { uptime: 98.2, requestsPerMin: 890, errorRate: 1.2 },
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  }
];

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: 'evt-1', domainId: 'product-factory', type: 'deployment', message: 'Deployed Sprint 42 to Staging', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 'evt-2', domainId: 'dj-booking', type: 'alert', message: 'High latency detected in Venue API', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: 'evt-3', domainId: 'alex-ai-universal', type: 'creation', message: 'New project "CLI Tool v2.0" created', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: 'evt-4', domainId: 'product-factory', type: 'update', message: 'Budget threshold reached (50%)', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() }
];

export function getDomainStats(domainId: DomainId) {
  const projects = MOCK_PROJECTS.filter(p => p.domainId === domainId);
  const totalBudget = projects.reduce((sum, p) => sum + p.budget.allocated, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.budget.spent, 0);
  const activeCount = projects.filter(p => p.status === 'active').length;
  
  return {
    projectCount: projects.length,
    activeCount,
    budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    healthScore: 95 // Mock score
  };
}
EOF

# ------------------------------------------------------------------------------
# 2. Theme Context
# ------------------------------------------------------------------------------
echo "🎨 Creating Theme Context..."
cat > apps/unified-dashboard/lib/theme-context.tsx <<EOF
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
EOF

# ------------------------------------------------------------------------------
# 3. Navigation Component
# ------------------------------------------------------------------------------
echo "🧭 Creating Dashboard Navigation..."
cat > apps/unified-dashboard/components/DashboardNavigation.tsx <<EOF
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOMAINS } from '@/lib/unified-mock-data';

export default function DashboardNavigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="w-64 bg-[#0f1115] border-r border-white/10 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Unified Dashboard
        </h1>
        <p className="text-xs text-gray-500 mt-1">OpenRouter Crew Platform</p>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Overview
        </div>
        <ul className="space-y-1 px-2 mb-6">
          <li>
            <Link 
              href="/" 
              className={\`flex items-center px-4 py-2 text-sm rounded-lg transition-colors \${isActive('/') ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}\`}
            >
              Dashboard Home
            </Link>
          </li>
          <li>
            <Link 
              href="/projects" 
              className={\`flex items-center px-4 py-2 text-sm rounded-lg transition-colors \${isActive('/projects') ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}\`}
            >
              All Projects
            </Link>
          </li>
        </ul>

        <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Domains
        </div>
        <ul className="space-y-1 px-2">
          {DOMAINS.map(domain => (
            <li key={domain.id}>
              <Link 
                href={\`/domains/\${domain.id}\`}
                className={\`flex items-center px-4 py-2 text-sm rounded-lg transition-colors group \${isActive(\`/domains/\${domain.id}\`) ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}\`}
              >
                <span className={\`w-2 h-2 rounded-full mr-3 bg-gradient-to-r \${domain.color}\`}></span>
                {domain.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-xs font-bold">
            AD
          </div>
          <div>
            <div className="text-sm font-medium text-white">Admin User</div>
            <div className="text-xs text-gray-500">admin@openrouter.ai</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
EOF

# ------------------------------------------------------------------------------
# 4. Enhanced Landing Page
# ------------------------------------------------------------------------------
echo "🏠 Updating Landing Page UI..."
cat > apps/unified-dashboard/app/page.tsx <<EOF
'use client';

import React from 'react';
import { DOMAINS, MOCK_PROJECTS, MOCK_ACTIVITY, getDomainStats } from '@/lib/unified-mock-data';
import Link from 'next/link';

export default function DashboardHome() {
  const totalBudget = MOCK_PROJECTS.reduce((sum, p) => sum + p.budget.allocated, 0);
  const totalSpent = MOCK_PROJECTS.reduce((sum, p) => sum + p.budget.spent, 0);
  const activeProjects = MOCK_PROJECTS.filter(p => p.status === 'active').length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Platform Overview</h1>
          <p className="text-gray-400">Real-time metrics across all domains</p>
        </div>
        <Link 
          href="/projects/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span> New Project
        </Link>
      </header>

      {/* High-level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Total Projects" value={MOCK_PROJECTS.length} trend="+2 this week" />
        <MetricCard title="Active Workstreams" value={activeProjects} trend="Stable" />
        <MetricCard title="Budget Utilization" value={\`\${Math.round((totalSpent / totalBudget) * 100)}%\`} trend={\`\$\${totalSpent.toLocaleString()} spent\`} />
        <MetricCard title="System Health" value="99.8%" trend="All systems operational" color="text-green-400" />
      </div>

      {/* Domain Grid */}
      <h2 className="text-xl font-semibold text-white mb-4">Domain Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {DOMAINS.map(domain => {
          const stats = getDomainStats(domain.id);
          return (
            <div key={domain.id} className="bg-[#16181d] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={\`w-10 h-10 rounded-lg bg-gradient-to-br \${domain.color} flex items-center justify-center text-white font-bold\`}>
                    {domain.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{domain.name}</h3>
                    <div className="text-xs text-gray-500">Port {domain.port}</div>
                  </div>
                </div>
                <div className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                  Healthy
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Active Projects</span>
                  <span className="text-white font-mono">{stats.activeCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Budget Used</span>
                  <span className="text-white font-mono">{Math.round(stats.budgetUtilization)}%</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className={\`h-full bg-gradient-to-r \${domain.color}\`} 
                    style={{ width: \`\${stats.budgetUtilization}%\` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Projects</h2>
          <div className="bg-[#16181d] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-gray-400">
                <tr>
                  <th className="p-4 font-medium">Project Name</th>
                  <th className="p-4 font-medium">Domain</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MOCK_PROJECTS.map(project => (
                  <tr key={project.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">{project.name}</div>
                      <div className="text-xs text-gray-500">{project.description}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300 border border-white/10">
                        {DOMAINS.find(d => d.id === project.domainId)?.name}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={\`capitalize \${project.status === 'active' ? 'text-green-400' : 'text-gray-400'}\`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-gray-300">
                      \${project.budget.spent.toLocaleString()} / \${project.budget.allocated.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Live Activity</h2>
          <div className="bg-[#16181d] border border-white/10 rounded-xl p-4 space-y-4">
            {MOCK_ACTIVITY.map(event => (
              <div key={event.id} className="flex gap-3 items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                <div className={\`w-2 h-2 mt-1.5 rounded-full \${event.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}\`} />
                <div>
                  <div className="text-sm text-gray-300">{event.message}</div>
                  <div className="text-xs text-gray-500 mt-1 flex gap-2">
                    <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span className="uppercase">{event.domainId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, color = "text-white" }: { title: string, value: string | number, trend: string, color?: string }) {
  return (
    <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
      <div className="text-gray-400 text-sm mb-2">{title}</div>
      <div className={\`text-3xl font-bold mb-1 \${color}\`}>{value}</div>
      <div className="text-xs text-gray-500">{trend}</div>
    </div>
  );
}
EOF

# ------------------------------------------------------------------------------
# 5. Update Root Layout
# ------------------------------------------------------------------------------
echo "🖼️  Updating Root Layout..."
cat > apps/unified-dashboard/app/layout.tsx <<EOF
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
EOF

echo "✅ Unified Dashboard enhancements applied successfully."
echo "👉 Run 'pnpm dev' to view the updated dashboard."