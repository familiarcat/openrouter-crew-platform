'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { BarChart3, DollarSign, FolderKanban, Sparkles } from 'lucide-react'
import { ClientTypes } from '@openrouter-crew/shared-schemas'

type Project = ClientTypes.Project
type LLMUsageEvent = ClientTypes.LLMUsageEvent

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [recentUsage, setRecentUsage] = useState<LLMUsageEvent[]>([])
  const [totalCost, setTotalCost] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    setupRealtimeSubscription()
  }, [])

  async function loadDashboardData() {
    try {
      // Load projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6) as { data: Project[] | null; error: any }

      if (projectsData) setProjects(projectsData)

      // Load recent usage events
      const { data: usageData } = await supabase
        .from('llm_usage_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10) as { data: LLMUsageEvent[] | null; error: any }

      if (usageData) {
        setRecentUsage(usageData)
        const total = usageData.reduce((sum, event) => sum + (event.estimated_cost_usd || 0), 0)
        setTotalCost(total)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  function setupRealtimeSubscription() {
    // Subscribe to new usage events
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'llm_usage_events',
        },
        (payload) => {
          const newEvent = payload.new as LLMUsageEvent
          setRecentUsage((prev) => [newEvent, ...prev.slice(0, 9)])
          setTotalCost((prev) => prev + (newEvent.estimated_cost_usd || 0))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">OpenRouter Crew Platform</h1>
              <p className="text-sm text-muted-foreground">Unified project management and cost optimization</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Total Projects</h3>
              <FolderKanban className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{projects.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Active projects</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">API Calls</h3>
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{recentUsage.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Recent requests</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Total Cost</h3>
              <DollarSign className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{formatCurrency(totalCost)}</p>
            <p className="text-xs text-muted-foreground mt-1">All-time spend</p>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <button className="text-sm text-primary hover:underline">View all →</button>
          </div>

          {projects.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <FolderKanban className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first project
              </p>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid-auto-fill">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <span className={`status-badge status-${project.status}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{project.type}</span>
                    <span>{formatRelativeTime(project.created_at)}</span>
                  </div>
                  {project.budget_usd && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-medium">{formatCurrency(project.budget_usd)}</span>
                      </div>
                      {project.total_cost_usd !== null && (
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Spent</span>
                          <span className="font-medium text-primary">
                            {formatCurrency(project.total_cost_usd)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Usage Events */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent API Usage</h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {recentUsage.length === 0 ? (
              <div className="p-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No usage data</h3>
                <p className="text-sm text-muted-foreground">
                  API usage events will appear here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Model
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tokens
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentUsage.map((event) => (
                      <tr key={event.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium">{event.model}</div>
                              <div className="text-xs text-muted-foreground">{event.provider}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {event.total_tokens?.toLocaleString() || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {formatCurrency(event.estimated_cost_usd || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatRelativeTime(event.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2026 OpenRouter Crew Platform</p>
            <p>Built with Next.js, Supabase, and n8n</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
