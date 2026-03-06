// File: domains/shared/project-management/src/services/ProjectService.ts

import { SupabaseClient } from '@supabase/supabase-js'
import type { Tables } from '@openrouter-crew/shared-schemas'
import type { Sprint, Story, CrewWorkload } from '../types/sprint'

/**
 * ProjectService
 * Handles all project-level operations
 */
export class ProjectService {
  private constructor(private supabase: SupabaseClient) {}

  /**
   * Factory method for creating ProjectService instances
   */
  static create(supabase: SupabaseClient): ProjectService {
    return new ProjectService(supabase)
  }

  /**
   * Get a project by ID
   */
  async getProject(id: string): Promise<Tables<'projects'> | null> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to get project: ${error.message}`)
    }

    return data
  }

  /**
   * Get all sprints for a project
   */
  async getSprintsForProject(projectId: string): Promise<Sprint[]> {
    const { data, error } = await this.supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .order('sprint_number', { ascending: true })

    if (error) {
      throw new Error(`Failed to get sprints: ${error.message}`)
    }

    return (data || []) as Sprint[]
  }

  /**
   * Get all stories for a project
   */
  async getTasksForProject(projectId: string): Promise<Story[]> {
    const { data, error } = await this.supabase
      .from('stories')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get stories: ${error.message}`)
    }

    return (data || []) as Story[]
  }

  /**
   * Get cost analytics for a project
   */
  async getCostAnalytics(projectId: string): Promise<{
    budget: number
    spent: number
    remaining: number
  }> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('budget_usd, total_cost_usd')
      .eq('id', projectId)
      .single()

    if (error) {
      throw new Error(`Failed to get cost analytics: ${error.message}`)
    }

    const budget = (data?.budget_usd as number) || 0
    const spent = (data?.total_cost_usd as number) || 0

    return {
      budget,
      spent,
      remaining: budget - spent,
    }
  }

  /**
   * Get crew member assignments for a project
   */
  async getCrewAssignments(projectId: string): Promise<CrewWorkload[]> {
    const { data, error } = await this.supabase
      .from('stories')
      .select('assigned_crew_member')
      .eq('project_id', projectId)
      .not('assigned_crew_member', 'is', null)

    if (error) {
      throw new Error(`Failed to get crew assignments: ${error.message}`)
    }

    // Build workload summary from stories
    const workloadMap = new Map<string, CrewWorkload>()
    ;(data || []).forEach((story: any) => {
      const crewMember = story.assigned_crew_member
      if (crewMember) {
        if (!workloadMap.has(crewMember)) {
          workloadMap.set(crewMember, {
            id: `${projectId}-${crewMember}`,
            crew_member: crewMember,
            sprint_id: '',
            total_story_points: 0,
            completed_story_points: 0,
            capacity_percentage: 0,
          })
        }
      }
    })

    return Array.from(workloadMap.values())
  }

  /**
   * Get active sprint for a project
   */
  async getActiveSprint(projectId: string): Promise<Sprint | null> {
    const { data, error } = await this.supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows found"
      throw new Error(`Failed to get active sprint: ${error.message}`)
    }

    return (data as Sprint) || null
  }

  /**
   * Get project summary statistics
   */
  async getProjectStats(projectId: string): Promise<{
    totalStories: number
    completedStories: number
    inProgressStories: number
    blockedStories: number
    totalSprints: number
    completedSprints: number
    activeSprints: number
  }> {
    const [sprints, stories] = await Promise.all([
      this.getSprintsForProject(projectId),
      this.getTasksForProject(projectId),
    ])

    const totalStories = stories.length
    const completedStories = stories.filter(
      (s) => s.status === 'completed' || s.status === 'done',
    ).length
    const inProgressStories = stories.filter(
      (s) => s.status === 'in_progress',
    ).length
    const blockedStories = stories.filter((s) => s.status === 'blocked').length

    const totalSprints = sprints.length
    const completedSprints = sprints.filter(
      (s) => s.status === 'completed',
    ).length
    const activeSprints = sprints.filter((s) => s.status === 'active').length

    return {
      totalStories,
      completedStories,
      inProgressStories,
      blockedStories,
      totalSprints,
      completedSprints,
      activeSprints,
    }
  }
}
