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
          <li>
            <Link 
              href="/design-system" 
              className={\`flex items-center px-4 py-2 text-sm rounded-lg transition-colors \${isActive('/design-system') ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}\`}
            >
              Component Library
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
                    <span suppressHydrationWarning>{new Date(event.timestamp).toLocaleTimeString()}</span>
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

# ------------------------------------------------------------------------------
# 5.5 Create Globals CSS
# ------------------------------------------------------------------------------
echo "🎨 Creating Globals CSS..."
cat > apps/unified-dashboard/app/globals.css <<EOF
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0b0d11;
  --foreground: #ffffff;
  --card-bg: #16181d;
  --card: #16181d;
  --border: rgba(255, 255, 255, 0.1);
  --radius: 0.75rem;
  --accent: #60a5fa;
  --text-muted: #9ca3af;
  --text: #ffffff;
}

body {
  background: var(--background);
  color: var(--foreground);
}
EOF

# ------------------------------------------------------------------------------
# 6. Create Design System Page (Component Portfolio)
# ------------------------------------------------------------------------------
echo "🎨 Creating Design System Page..."
mkdir -p apps/unified-dashboard/app/design-system
cat > apps/unified-dashboard/app/design-system/page.tsx <<'EOF'
'use client';

import React from 'react';
import Link from 'next/link';
import ServiceStatusDisplay from '@/components/ServiceStatusDisplay';
import CrossServerSyncPanel from '@/components/CrossServerSyncPanel';
import LiveRefreshDashboard from '@/components/LiveRefreshDashboard';
import MCPDashboardSection from '@/components/MCPDashboardSection';
import LearningAnalyticsDashboard from '@/components/LearningAnalyticsDashboard';
import CrewMemoryVisualization from '@/components/CrewMemoryVisualization';
import RAGProjectRecommendations from '@/components/RAGProjectRecommendations';
import N8NWorkflowBento from '@/components/N8NWorkflowBento';
import RAGSelfDocumentation from '@/components/RAGSelfDocumentation';
import SecurityAssessmentDashboard from '@/components/SecurityAssessmentDashboard';
import CostOptimizationMonitor from '@/components/CostOptimizationMonitor';
import UserExperienceAnalytics from '@/components/UserExperienceAnalytics';
import AIImpactAssessment from '@/components/AIImpactAssessment';
import ProcessDocumentationSystem from '@/components/ProcessDocumentationSystem';
import DataSourceIntegrationPanel from '@/components/DataSourceIntegrationPanel';
import ProjectGrid from '@/components/ProjectGrid';
import ThemeTestingHarness from '@/components/ThemeTestingHarness';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import VectorBasedDashboard from '@/components/VectorBasedDashboard';
import VectorPrioritySystem from '@/components/VectorPrioritySystem';
import UIDesignComparison from '@/components/UIDesignComparison';
import ProgressTracker from '@/components/ProgressTracker';
import PriorityMatrix from '@/components/PriorityMatrix';
import DynamicDataDrilldown from '@/components/DynamicDataDrilldown';
import DynamicDataRenderer from '@/components/DynamicDataRenderer';
import { ComponentGrid } from '@/components/DynamicComponentRegistry';
import DebatePanel from '@/components/DebatePanel';
import AgentMemoryDisplay from '@/components/AgentMemoryDisplay';
import StatusRibbon from '@/components/StatusRibbon';
import UniversalProgressBar from '@/components/UniversalProgressBar';
import DesignSystemErrorDisplay from '@/components/DesignSystemErrorDisplay';

function ComponentWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'relative',
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        background: 'rgba(124, 92, 255, 0.15)',
        color: 'var(--accent)',
        fontSize: '10px',
        fontWeight: 600,
        padding: '4px 10px',
        borderBottomRightRadius: '8px',
        borderRight: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        zIndex: 20,
        backdropFilter: 'blur(4px)',
        letterSpacing: '0.5px',
        textTransform: 'uppercase'
      }}>
        {label}
      </div>
      <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '80px' }}>
      <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'var(--foreground)',
          marginBottom: '8px'
        }}>
          {title}
        </h2>
        {description && (
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '800px', lineHeight: '1.6' }}>
            {description}
          </p>
        )}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
        gap: '24px'
      }}>
        {children}
      </div>
    </section>
  );
}

export default function ComponentLibraryPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      color: 'var(--foreground)',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: '1800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ maxWidth: '800px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent)', marginBottom: '12px' }}>
              🧩 Component Library
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '18px', lineHeight: '1.6' }}>
              Interactive showcase of all dashboard components in the Bento system.
              Organized by Domain-Driven Design (DDD) contexts and RAG memory structures to reflect the architectural boundaries of the platform.
            </p>
          </div>
          <Link
            href="/dashboard"
            style={{
              padding: '12px 24px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.2s',
              marginTop: '8px'
            }}
          >
            ← Back to Dashboard
          </Link>
        </header>

        <Section title="System Observability & Core" description="Components responsible for real-time monitoring, server synchronization, and core infrastructure health.">
          <ComponentWrapper label="Service Status"><ServiceStatusDisplay /></ComponentWrapper>
          <ComponentWrapper label="Live Refresh"><LiveRefreshDashboard /></ComponentWrapper>
          <ComponentWrapper label="Cross-Server Sync"><CrossServerSyncPanel /></ComponentWrapper>
          <ComponentWrapper label="MCP System"><MCPDashboardSection /></ComponentWrapper>
          <ComponentWrapper label="Security Assessment"><SecurityAssessmentDashboard /></ComponentWrapper>
          <ComponentWrapper label="Cost Optimization"><CostOptimizationMonitor /></ComponentWrapper>
        </Section>

        <Section title="Intelligence & Memory (RAG)" description="Visualizations for AI agent memories, vector retrieval processes, and learning analytics.">
          <ComponentWrapper label="Crew Memory"><CrewMemoryVisualization /></ComponentWrapper>
          <ComponentWrapper label="Agent Memory"><AgentMemoryDisplay agentName="Demo Agent" limit={5} showStats={true} /></ComponentWrapper>
          <ComponentWrapper label="RAG Recommendations"><RAGProjectRecommendations /></ComponentWrapper>
          <ComponentWrapper label="Self Documentation"><RAGSelfDocumentation /></ComponentWrapper>
          <ComponentWrapper label="Learning Analytics"><LearningAnalyticsDashboard /></ComponentWrapper>
          <ComponentWrapper label="AI Impact"><AIImpactAssessment /></ComponentWrapper>
        </Section>

        <Section title="Workflow & Process Automation" description="Interfaces for managing n8n workflows, process documentation, and data source integrations.">
          <ComponentWrapper label="n8n Workflows"><N8NWorkflowBento /></ComponentWrapper>
          <ComponentWrapper label="Process Docs"><ProcessDocumentationSystem /></ComponentWrapper>
          <ComponentWrapper label="Data Sources"><DataSourceIntegrationPanel /></ComponentWrapper>
          <ComponentWrapper label="Debate Panel"><DebatePanel /></ComponentWrapper>
        </Section>

        <Section title="Project Management & Analytics" description="Tools for tracking project progress, prioritizing tasks via vector analysis, and general analytics.">
          <ComponentWrapper label="Project Grid"><ProjectGrid /></ComponentWrapper>
          <ComponentWrapper label="Analytics Dashboard"><AnalyticsDashboard /></ComponentWrapper>
          <ComponentWrapper label="Vector Dashboard"><VectorBasedDashboard /></ComponentWrapper>
          <ComponentWrapper label="Vector Priority"><VectorPrioritySystem /></ComponentWrapper>
          <ComponentWrapper label="Priority Matrix"><PriorityMatrix vectors={[]} /></ComponentWrapper>
          <ComponentWrapper label="Progress Tracker"><ProgressTracker taskId="demo-task" /></ComponentWrapper>
        </Section>

        <Section title="UX & Design System" description="Components for testing themes, comparing UI designs, and monitoring user experience metrics.">
          <ComponentWrapper label="Theme Testing"><ThemeTestingHarness /></ComponentWrapper>
          <ComponentWrapper label="UI Comparison"><UIDesignComparison /></ComponentWrapper>
          <ComponentWrapper label="UX Analytics"><UserExperienceAnalytics /></ComponentWrapper>
          <ComponentWrapper label="Status Ribbon"><StatusRibbon /></ComponentWrapper>
          <ComponentWrapper label="Universal Progress"><UniversalProgressBar current={65} total={100} description="System Load" /></ComponentWrapper>
          <ComponentWrapper label="Error Display"><DesignSystemErrorDisplay error="Sample error message" title="Demo Error" /></ComponentWrapper>
        </Section>

        <Section title="Dynamic Data & Registry" description="Low-level components for rendering dynamic data structures and component registries.">
          <ComponentWrapper label="Data Drilldown"><DynamicDataDrilldown data={{ sample: 'data', nested: { value: 123 } }} title="Sample Drilldown" /></ComponentWrapper>
          <ComponentWrapper label="Data Renderer"><DynamicDataRenderer data={{ key: 'value' }} structure={{ id: 'root', type: 'container' }} /></ComponentWrapper>
          <ComponentWrapper label="Component Grid"><ComponentGrid componentIds={['comp-1', 'comp-2']} /></ComponentWrapper>
        </Section>
      </div>
    </div>
  );
}
EOF

# ------------------------------------------------------------------------------
# 7. Generate Placeholder Components
# ------------------------------------------------------------------------------
echo "🧩 Generating Placeholder Components for Design System..."
mkdir -p apps/unified-dashboard/components

# ------------------------------------------------------------------------------
# 7.1 Generate Data-Aware Components (Specific Implementations)
# ------------------------------------------------------------------------------

echo "  ✨ Generating Data-Aware Components..."

# ServiceStatusDisplay
cat > apps/unified-dashboard/components/ServiceStatusDisplay.tsx <<EOF
'use client';
import React from 'react';
import { DOMAINS } from '@/lib/unified-mock-data';

export default function ServiceStatusDisplay() {
  return (
    <div className="space-y-4">
      {DOMAINS.map(domain => (
        <div key={domain.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <div>
              <div className="font-medium">{domain.name}</div>
              <div className="text-xs text-gray-500">Port: {domain.port}</div>
            </div>
          </div>
          <div className="text-xs font-mono text-green-400">OPERATIONAL</div>
        </div>
      ))}
    </div>
  );
}
EOF

# ProjectGrid
cat > apps/unified-dashboard/components/ProjectGrid.tsx <<EOF
'use client';
import React from 'react';
import { MOCK_PROJECTS, DOMAINS } from '@/lib/unified-mock-data';

export default function ProjectGrid() {
  return (
    <div className="grid grid-cols-1 gap-4">
      {MOCK_PROJECTS.map(project => {
        const domain = DOMAINS.find(d => d.id === project.domainId);
        return (
          <div key={project.id} className="p-4 border border-white/10 rounded bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className={\`w-2 h-2 rounded-full bg-gradient-to-r \${domain?.color || 'from-gray-500 to-gray-600'}\`} />
                <h3 className="font-bold">{project.name}</h3>
              </div>
              <span className={\`px-2 py-0.5 rounded text-[10px] uppercase border \${
                project.status === 'active' ? 'border-green-500/30 text-green-400 bg-green-500/10' : 
                'border-gray-500/30 text-gray-400 bg-gray-500/10'
              }\`}>
                {project.status}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">{project.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex -space-x-2">
                {project.team.leads.map((lead, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gray-700 border border-[#16181d] flex items-center justify-center text-[10px] text-white">
                    {lead.charAt(0)}
                  </div>
                ))}
              </div>
              <div className="font-mono">
                \${project.budget.spent.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
EOF

# CostOptimizationMonitor
cat > apps/unified-dashboard/components/CostOptimizationMonitor.tsx <<EOF
'use client';
import React from 'react';
import { MOCK_PROJECTS } from '@/lib/unified-mock-data';

export default function CostOptimizationMonitor() {
  const totalBudget = MOCK_PROJECTS.reduce((acc, p) => acc + p.budget.allocated, 0);
  const totalSpent = MOCK_PROJECTS.reduce((acc, p) => acc + p.budget.spent, 0);
  const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm text-gray-400">Total Budget Utilization</div>
          <div className="text-3xl font-bold text-white">{utilization.toFixed(1)}%</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Spent / Allocated</div>
          <div className="text-lg font-mono text-white">
            \${totalSpent.toLocaleString()} / \${totalBudget.toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-blue-500 h-full transition-all duration-500" 
          style={{ width: \`\${utilization}%\` }}
        />
      </div>

      <div className="space-y-2">
        {MOCK_PROJECTS.map(p => (
          <div key={p.id} className="flex justify-between text-sm">
            <span className="text-gray-400">{p.name}</span>
            <span className={p.budget.spent > p.budget.allocated * 0.9 ? 'text-red-400' : 'text-gray-300'}>
              \${p.budget.spent.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

# LiveRefreshDashboard
cat > apps/unified-dashboard/components/LiveRefreshDashboard.tsx <<EOF
'use client';
import React from 'react';
import { MOCK_ACTIVITY } from '@/lib/unified-mock-data';

export default function LiveRefreshDashboard() {
  return (
    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
      {MOCK_ACTIVITY.map(event => (
        <div key={event.id} className="flex gap-3 items-start p-3 bg-white/5 rounded border border-white/5">
          <div className={\`w-2 h-2 mt-1.5 rounded-full \${event.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}\`} />
          <div>
            <div className="text-sm text-gray-200">{event.message}</div>
            <div className="text-xs text-gray-500 mt-1 flex gap-2">
              <span suppressHydrationWarning>{new Date(event.timestamp).toLocaleTimeString()}</span>
              <span className="uppercase px-1.5 py-0.5 bg-white/10 rounded text-[10px]">{event.domainId}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
EOF

# AnalyticsDashboard
cat > apps/unified-dashboard/components/AnalyticsDashboard.tsx <<EOF
'use client';
import React from 'react';
import { MOCK_PROJECTS } from '@/lib/unified-mock-data';

export default function AnalyticsDashboard() {
  const avgUptime = MOCK_PROJECTS.reduce((acc, p) => acc + p.metrics.uptime, 0) / MOCK_PROJECTS.length;
  const totalReqs = MOCK_PROJECTS.reduce((acc, p) => acc + p.metrics.requestsPerMin, 0);
  const avgError = MOCK_PROJECTS.reduce((acc, p) => acc + p.metrics.errorRate, 0) / MOCK_PROJECTS.length;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-white/5 rounded border border-white/10 text-center">
        <div className="text-sm text-gray-400 mb-1">Avg Uptime</div>
        <div className="text-2xl font-bold text-green-400">{avgUptime.toFixed(2)}%</div>
      </div>
      <div className="p-4 bg-white/5 rounded border border-white/10 text-center">
        <div className="text-sm text-gray-400 mb-1">Total RPM</div>
        <div className="text-2xl font-bold text-blue-400">{totalReqs}</div>
      </div>
      <div className="p-4 bg-white/5 rounded border border-white/10 text-center">
        <div className="text-sm text-gray-400 mb-1">Avg Error Rate</div>
        <div className="text-2xl font-bold text-yellow-400">{avgError.toFixed(2)}%</div>
      </div>
    </div>
  );
}
EOF

# ------------------------------------------------------------------------------
# 7.2 Generate Complex UX Components (Nested & Interactive)
# ------------------------------------------------------------------------------
echo "  ✨ Generating Complex UX Components..."

# N8NWorkflowBento
cat > apps/unified-dashboard/components/N8NWorkflowBento.tsx <<EOF
'use client';
import React, { useState } from 'react';

type ViewState = 'list' | 'detail' | 'execution';

export default function N8NWorkflowBento() {
  const [view, setView] = useState<ViewState>('list');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const workflows = [
    { id: 'wf-1', name: 'Data Ingestion Pipeline', status: 'active', lastRun: '2 mins ago' },
    { id: 'wf-2', name: 'Daily Report Generator', status: 'paused', lastRun: '1 day ago' },
    { id: 'wf-3', name: 'Alert Notification System', status: 'active', lastRun: '5 mins ago' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">n8n Workflows</h3>
        {view !== 'list' && (
          <button onClick={() => setView('list')} className="text-xs text-blue-400 hover:text-blue-300">
            ← Back to List
          </button>
        )}
      </div>

      {view === 'list' && (
        <div className="space-y-2 overflow-auto flex-1">
          {workflows.map(wf => (
            <div key={wf.id} className="p-3 bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-colors flex justify-between items-center">
              <div>
                <div className="font-medium">{wf.name}</div>
                <div className="text-xs text-gray-500">{wf.status} • Last run: {wf.lastRun}</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedWorkflow(wf.id); setView('detail'); }}
                  className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30"
                >
                  Edit
                </button>
                <button 
                  onClick={() => { setSelectedWorkflow(wf.id); setView('execution'); }}
                  className="px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded hover:bg-green-500/30"
                >
                  Run
                </button>
              </div>
            </div>
          ))}
          <button className="w-full py-2 border border-dashed border-white/20 rounded text-gray-500 text-sm hover:border-white/40 hover:text-gray-300">
            + Create New Workflow
          </button>
        </div>
      )}

      {view === 'execution' && (
        <div className="flex-1 bg-black/20 rounded p-4 border border-white/5">
          <div className="text-sm font-mono text-green-400 mb-2">&gt; Initializing execution for {selectedWorkflow}...</div>
          <div className="text-sm font-mono text-gray-400 mb-2">&gt; Loading parameters...</div>
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-1">Input Payload (JSON)</label>
            <textarea className="w-full h-24 bg-black/40 border border-white/10 rounded p-2 text-xs font-mono text-gray-300" defaultValue="{}" />
          </div>
          <button className="mt-4 w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium text-sm">
            Execute Workflow
          </button>
        </div>
      )}

      {view === 'detail' && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Workflow Canvas Placeholder for {selectedWorkflow}
        </div>
      )}
    </div>
  );
}
EOF

# ProcessDocumentationSystem
cat > apps/unified-dashboard/components/ProcessDocumentationSystem.tsx <<EOF
'use client';
import React, { useState } from 'react';

export default function ProcessDocumentationSystem() {
  const [activeDoc, setActiveDoc] = useState('overview');

  const docs = [
    { id: 'overview', title: 'System Overview' },
    { id: 'deployment', title: 'Deployment Guide' },
    { id: 'troubleshooting', title: 'Troubleshooting' },
  ];

  return (
    <div className="flex h-full gap-4">
      <div className="w-1/3 border-r border-white/10 pr-2">
        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Documentation</div>
        <ul className="space-y-1">
          {docs.map(doc => (
            <li 
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={\`px-2 py-1.5 rounded text-sm cursor-pointer \${activeDoc === doc.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}\`}
            >
              {doc.title}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 overflow-auto">
        <h3 className="text-xl font-bold mb-4">{docs.find(d => d.id === activeDoc)?.title}</h3>
        <div className="prose prose-invert prose-sm">
          <p className="text-gray-300">
            This is the content for the {activeDoc} documentation. In a real implementation, this would be rendered from markdown files or a CMS.
          </p>
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="text-blue-300 font-bold mb-1">Key Takeaway</h4>
            <p className="text-sm text-blue-200/80">Always verify environment variables before deployment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# DataSourceIntegrationPanel
cat > apps/unified-dashboard/components/DataSourceIntegrationPanel.tsx <<EOF
'use client';
import React, { useState } from 'react';

export default function DataSourceIntegrationPanel() {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Data Sources</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
        >
          {isAdding ? 'Cancel' : '+ Add Source'}
        </button>
      </div>

      {isAdding ? (
        <div className="flex-1 bg-white/5 rounded p-4 border border-white/10">
          <h4 className="font-bold mb-4">Connect New Source</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 border border-white/10 rounded hover:border-blue-500 cursor-pointer bg-black/20">
              <div className="font-bold">PostgreSQL</div>
              <div className="text-xs text-gray-500">Relational DB</div>
            </div>
            <div className="p-4 border border-white/10 rounded hover:border-blue-500 cursor-pointer bg-black/20">
              <div className="font-bold">REST API</div>
              <div className="text-xs text-gray-500">External Service</div>
            </div>
          </div>
          <button className="w-full py-2 bg-blue-600 rounded text-white font-medium">Continue Setup</button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div>
                <div className="font-medium">Production DB</div>
                <div className="text-xs text-gray-500">PostgreSQL • Synced 1m ago</div>
              </div>
            </div>
            <button className="text-xs text-gray-400 hover:text-white">Configure</button>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div>
                <div className="font-medium">Analytics Stream</div>
                <div className="text-xs text-gray-500">Kafka • Syncing...</div>
              </div>
            </div>
            <button className="text-xs text-gray-400 hover:text-white">Configure</button>
          </div>
        </div>
      )}
    </div>
  );
}
EOF

# DebatePanel
cat > apps/unified-dashboard/components/DebatePanel.tsx <<EOF
'use client';
import React from 'react';

export default function DebatePanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <div className="text-xs text-purple-300 uppercase font-bold">Current Topic</div>
        <div className="font-medium text-white">Should we migrate the legacy auth system to Supabase Auth?</div>
      </div>
      
      <div className="flex-1 overflow-auto space-y-4 pr-2">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">A1</div>
          <div className="bg-white/5 p-3 rounded-r-lg rounded-bl-lg text-sm text-gray-300 flex-1">
            <div className="text-xs text-blue-400 font-bold mb-1">Architect Agent</div>
            Migrating would reduce maintenance overhead by 40% based on current metrics.
          </div>
        </div>
        <div className="flex gap-3 flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold">S1</div>
          <div className="bg-white/5 p-3 rounded-l-lg rounded-br-lg text-sm text-gray-300 flex-1 text-right">
            <div className="text-xs text-red-400 font-bold mb-1">Security Agent</div>
            We need to ensure the migration path handles existing session tokens without forcing a global logout.
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <input type="text" placeholder="Intervene in debate..." className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-sm" />
        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm">Send</button>
      </div>
    </div>
  );
}
EOF

# LearningAnalyticsDashboard
cat > apps/unified-dashboard/components/LearningAnalyticsDashboard.tsx <<EOF
'use client';
import React from 'react';

export default function LearningAnalyticsDashboard() {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <div className="bg-white/5 rounded p-4 border border-white/10">
        <h4 className="text-sm font-bold text-gray-400 mb-4">Knowledge Acquisition</h4>
        <div className="flex items-end gap-2 h-32">
          {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
            <div key={i} className="flex-1 bg-blue-500/20 hover:bg-blue-500/40 transition-colors rounded-t relative group">
              <div className="absolute bottom-0 w-full bg-blue-500" style={{ height: \`\${h}%\` }}></div>
              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded border border-white/10">
                {h}%
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white/5 rounded p-4 border border-white/10">
        <h4 className="text-sm font-bold text-gray-400 mb-2">Top Insights</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2 text-green-300">
            <span>↑</span> Deployment frequency correlates with lower error rates
          </li>
          <li className="flex items-center gap-2 text-yellow-300">
            <span>→</span> API latency spikes during backup windows
          </li>
          <li className="flex items-center gap-2 text-blue-300">
            <span>ℹ</span> New pattern detected in user onboarding
          </li>
        </ul>
      </div>
    </div>
  );
}
EOF

# AIImpactAssessment
cat > apps/unified-dashboard/components/AIImpactAssessment.tsx <<EOF
'use client';
import React from 'react';

export default function AIImpactAssessment() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold text-white">A+</div>
          <div className="text-xs text-gray-400">Overall Impact Score</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-green-400">Low Risk</div>
          <div className="text-xs text-gray-500">Last assessed: Today</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">Ethical Compliance</span>
          <span className="text-green-400">98%</span>
        </div>
        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 w-[98%]"></div>
        </div>
        
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-300">Resource Efficiency</span>
          <span className="text-blue-400">85%</span>
        </div>
        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 w-[85%]"></div>
        </div>
      </div>
    </div>
  );
}
EOF

# RAGProjectRecommendations
cat > apps/unified-dashboard/components/RAGProjectRecommendations.tsx <<EOF
'use client';
import React from 'react';

export default function RAGProjectRecommendations() {
  return (
    <div className="space-y-3">
      <div className="p-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-lg">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-sm text-purple-300">Optimization Opportunity</h4>
          <span className="text-xs bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded">High Confidence</span>
        </div>
        <p className="text-xs text-gray-300 mb-3">
          Based on recent error logs, implementing a circuit breaker pattern for the Venue API could reduce downtime by 15%.
        </p>
        <button className="w-full py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-xs text-purple-200 transition-colors">
          Apply Recommendation
        </button>
      </div>
      
      <div className="p-3 bg-white/5 border border-white/10 rounded-lg opacity-75">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-sm text-gray-300">Code Quality</h4>
          <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-0.5 rounded">Medium</span>
        </div>
        <p className="text-xs text-gray-400">
          Consider extracting the shared validation logic in the booking flow to a separate utility.
        </p>
      </div>
    </div>
  );
}
EOF

# RAGSelfDocumentation
cat > apps/unified-dashboard/components/RAGSelfDocumentation.tsx <<EOF
'use client';
import React from 'react';

export default function RAGSelfDocumentation() {
  return (
    <div className="h-full flex flex-col">
      <div className="relative mb-4">
        <input 
          type="text" 
          placeholder="Search system documentation..." 
          className="w-full bg-black/20 border border-white/10 rounded px-4 py-2 text-sm pl-9"
        />
        <span className="absolute left-3 top-2.5 text-gray-500 text-xs">🔍</span>
      </div>
      
      <div className="flex-1 overflow-auto space-y-2">
        <div className="p-3 bg-white/5 rounded border border-white/10 hover:border-blue-500/50 cursor-pointer transition-colors">
          <div className="text-xs text-blue-400 mb-1">Auto-Generated • 2h ago</div>
          <h4 className="font-bold text-sm mb-1">API Authentication Flow</h4>
          <p className="text-xs text-gray-400 line-clamp-2">
            The system uses JWT tokens signed with RS256. Tokens are refreshed every 15 minutes via the /auth/refresh endpoint.
          </p>
        </div>
        <div className="p-3 bg-white/5 rounded border border-white/10 hover:border-blue-500/50 cursor-pointer transition-colors">
          <div className="text-xs text-blue-400 mb-1">Auto-Generated • 1d ago</div>
          <h4 className="font-bold text-sm mb-1">Database Schema: Projects</h4>
          <p className="text-xs text-gray-400 line-clamp-2">
            Projects table relates to Domains via domain_id foreign key. Cascade delete is enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
EOF

# AgentMemoryDisplay
cat > apps/unified-dashboard/components/AgentMemoryDisplay.tsx <<EOF
'use client';
import React from 'react';

export default function AgentMemoryDisplay({ agentName = 'Agent', limit = 5, showStats = false }: any) {
  return (
    <div className="h-full flex flex-col">
      {showStats && (
        <div className="flex gap-4 mb-4 text-xs text-gray-400 border-b border-white/10 pb-2">
          <div><span className="text-white font-bold">1,240</span> Memories</div>
          <div><span className="text-white font-bold">85%</span> Retrieval Rate</div>
          <div><span className="text-white font-bold">4.2s</span> Avg Latency</div>
        </div>
      )}
      <div className="space-y-2 flex-1 overflow-auto">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="flex gap-3 text-sm p-2 hover:bg-white/5 rounded transition-colors">
            <div className="text-gray-500 font-mono text-xs w-12 shrink-0">10:4{i} AM</div>
            <div className="text-gray-300">
              <span className="text-blue-400 font-bold">@{agentName}:</span> Processed user request for project creation. Context retained.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

# SecurityAssessmentDashboard
cat > apps/unified-dashboard/components/SecurityAssessmentDashboard.tsx <<EOF
'use client';
import React from 'react';

export default function SecurityAssessmentDashboard() {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <div className="flex flex-col items-center justify-center bg-white/5 rounded border border-white/10 p-4">
        <div className="w-24 h-24 rounded-full border-4 border-green-500 flex items-center justify-center mb-2">
          <span className="text-3xl font-bold text-white">94</span>
        </div>
        <div className="text-sm text-gray-400">Security Score</div>
      </div>
      <div className="space-y-2">
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
          <div className="text-xs text-red-400 font-bold">Critical</div>
          <div className="text-xs text-gray-300">0 Issues Found</div>
        </div>
        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
          <div className="text-xs text-yellow-400 font-bold">Warning</div>
          <div className="text-xs text-gray-300">2 Config Warnings</div>
        </div>
        <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded">
          <div className="text-xs text-blue-400 font-bold">Info</div>
          <div className="text-xs text-gray-300">5 Recommendations</div>
        </div>
      </div>
    </div>
  );
}
EOF

# MCPDashboardSection
cat > apps/unified-dashboard/components/MCPDashboardSection.tsx <<EOF
'use client';
import React, { useState } from 'react';

export default function MCPDashboardSection() {
  const [hydrating, setHydrating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleHydrate = async () => {
    setHydrating(true);
    setStatus('Hydrating...');
    try {
      const res = await fetch('/api/hydrate', { method: 'POST' });
      await res.json();
      setStatus('Done');
      setTimeout(() => setStatus(null), 2000);
    } catch (e) {
      setStatus('Error');
    } finally {
      setHydrating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-white/5 rounded border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <h4 className="font-bold">Filesystem Server</h4>
        </div>
        <div className="text-xs text-gray-400">v1.2.0 • Local</div>
        <div className="mt-3 flex gap-2">
          <span className="px-2 py-1 bg-white/10 rounded text-xs">read_file</span>
          <span className="px-2 py-1 bg-white/10 rounded text-xs">write_file</span>
        </div>
      </div>
      <div className="p-4 bg-white/5 rounded border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <h4 className="font-bold">PostgreSQL Server</h4>
        </div>
        <div className="text-xs text-gray-400">v0.9.5 • Remote</div>
        <div className="mt-3 flex gap-2">
          <span className="px-2 py-1 bg-white/10 rounded text-xs">query</span>
          <span className="px-2 py-1 bg-white/10 rounded text-xs">schema</span>
        </div>
      </div>
      <div className="p-4 bg-white/5 rounded border border-white/10 flex flex-col items-center justify-center border-dashed gap-2">
        <button 
          onClick={handleHydrate}
          disabled={hydrating}
          className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors disabled:opacity-50"
        >
          {hydrating ? 'Hydrating...' : '⚡ Hydrate Mock Data'}
        </button>
        {status && <div className="text-xs text-gray-400">{status}</div>}
        <div className="text-[10px] text-gray-500 text-center">
          Push to Supabase & n8n
        </div>
      </div>
    </div>
  );
}
EOF

# CrossServerSyncPanel
cat > apps/unified-dashboard/components/CrossServerSyncPanel.tsx <<EOF
'use client';
import React from 'react';

export default function CrossServerSyncPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-bold text-sm">Sync Active</span>
        </div>
        <span className="text-xs text-gray-500">Last sync: Just now</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm p-2 bg-white/5 rounded">
          <span className="text-gray-300">Product Factory</span>
          <span className="text-green-400">Synced</span>
        </div>
        <div className="flex justify-between items-center text-sm p-2 bg-white/5 rounded">
          <span className="text-gray-300">Alex AI Universal</span>
          <span className="text-green-400">Synced</span>
        </div>
        <div className="flex justify-between items-center text-sm p-2 bg-white/5 rounded">
          <span className="text-gray-300">DJ Booking</span>
          <span className="text-yellow-400">Syncing (98%)</span>
        </div>
      </div>

      <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-gray-300 transition-colors">
        Force Full Resync
      </button>
    </div>
  );
}
EOF

# List of components to generate
COMPONENTS=(
  "ServiceStatusDisplay"
  "CrossServerSyncPanel"
  "LiveRefreshDashboard"
  "MCPDashboardSection"
  "LearningAnalyticsDashboard"
  "CrewMemoryVisualization"
  "RAGProjectRecommendations"
  "N8NWorkflowBento"
  "RAGSelfDocumentation"
  "SecurityAssessmentDashboard"
  "CostOptimizationMonitor"
  "UserExperienceAnalytics"
  "AIImpactAssessment"
  "ProcessDocumentationSystem"
  "DataSourceIntegrationPanel"
  "ProjectGrid"
  "ThemeTestingHarness"
  "AnalyticsDashboard"
  "VectorBasedDashboard"
  "VectorPrioritySystem"
  "UIDesignComparison"
  "ProgressTracker"
  "PriorityMatrix"
  "DynamicDataDrilldown"
  "DynamicDataRenderer"
  "DebatePanel"
  "AgentMemoryDisplay"
  "StatusRibbon"
  "UniversalProgressBar"
  "DesignSystemErrorDisplay"
)

for component in "${COMPONENTS[@]}"; do
  if [ ! -f "apps/unified-dashboard/components/${component}.tsx" ]; then
    cat > "apps/unified-dashboard/components/${component}.tsx" <<EOF
'use client';
import React from 'react';

export default function ${component}(props: any) {
  return (
    <div className="p-4 border border-dashed border-white/20 rounded-lg min-h-[100px] flex items-center justify-center bg-white/5">
      <div className="text-center">
        <div className="font-bold text-gray-300">${component}</div>
        <div className="text-xs text-gray-500">Component Placeholder</div>
        <div className="text-[10px] text-gray-600 mt-1 font-mono">apps/unified-dashboard/components/${component}.tsx</div>
      </div>
    </div>
  );
}
EOF
    echo "  Created placeholder: ${component}"
  fi
done

# Special handling for DynamicComponentRegistry which has named exports
if [ ! -f "apps/unified-dashboard/components/DynamicComponentRegistry.tsx" ]; then
  cat > "apps/unified-dashboard/components/DynamicComponentRegistry.tsx" <<EOF
'use client';
import React from 'react';

export function ComponentGrid({ componentIds }: { componentIds: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {componentIds.map(id => (
        <div key={id} className="p-4 border border-white/10 rounded bg-white/5">
          Component: {id}
        </div>
      ))}
      <div className="p-4 border border-dashed border-white/20 rounded text-center text-gray-500">
        Dynamic Component Grid Placeholder
      </div>
    </div>
  );
}

export const DynamicComponentRegistry = {};
EOF
  echo "  Created placeholder: DynamicComponentRegistry"
fi

# ------------------------------------------------------------------------------
# 8. Data Hydration System
# ------------------------------------------------------------------------------
echo "💧 Generating Data Hydration System..."

# Hydration Service
cat > apps/unified-dashboard/lib/hydration-service.ts <<EOF
import { createClient } from '@supabase/supabase-js';
import { DOMAINS, MOCK_PROJECTS } from './unified-mock-data';

// Safe initialization for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'local-test-key';
const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL || process.env.N8N_URL || 'http://localhost:5678';

export async function hydrateSupabase() {
  console.log('💧 Hydrating Supabase...');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Simulate hydration logic
    console.log('   - Pushing', DOMAINS.length, 'domains');
    console.log('   - Pushing', MOCK_PROJECTS.length, 'projects');
    
    return { success: true, message: 'Supabase hydration simulated' };
  } catch (e: any) {
    console.error('Supabase hydration error:', e);
    return { success: false, message: e.message };
  }
}

export async function hydrateN8n() {
  console.log('💧 Hydrating n8n...');
  try {
    console.log('   - Checking n8n connectivity at', n8nUrl);
    return { success: true, message: 'n8n hydration simulated' };
  } catch (e: any) {
    console.error('n8n hydration error:', e);
    return { success: false, message: e.message };
  }
}

export async function hydrateAll() {
  const sb = await hydrateSupabase();
  const n8n = await hydrateN8n();
  return { supabase: sb, n8n };
}
EOF

# API Route
mkdir -p apps/unified-dashboard/app/api/hydrate
cat > apps/unified-dashboard/app/api/hydrate/route.ts <<EOF
import { NextResponse } from 'next/server';
import { hydrateAll } from '@/lib/hydration-service';

export async function POST() {
  try {
    const result = await hydrateAll();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Hydration failed' }, { status: 500 });
  }
}
EOF

# ------------------------------------------------------------------------------
# 9. Archive Script for RAG Memory
# ------------------------------------------------------------------------------
echo "📚 Archiving enhancement script for RAG system learning..."
mkdir -p domains/alex-ai-universal/knowledge/engineering
cp "$0" domains/alex-ai-universal/knowledge/engineering/enhance-dashboard-reference.sh
echo "✅ Archived script to: domains/alex-ai-universal/knowledge/engineering/enhance-dashboard-reference.sh"

echo "✅ Unified Dashboard enhancements applied successfully."
echo "👉 Run 'pnpm dev' to view the updated dashboard."