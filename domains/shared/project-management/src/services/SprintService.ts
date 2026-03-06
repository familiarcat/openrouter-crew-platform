// File: domains/shared/project-management/src/services/SprintService.ts

import { SupabaseClient } from '@supabase/supabase-js'
import type {
  Sprint,
  SprintStatus,
  Story,
  CreateSprintRequest,
  SprintVelocityMetrics,
} from '../types/sprint'

/**
 * SprintService
 * Handles all sprint-level operations
 */
export class SprintService {
  private constructor(private supabase: SupabaseClient) {}

  /**
   * Factory method for creating SprintService instances
   */
  static create(supabase: SupabaseClient): SprintService {
    return new SprintService(supabase)
  }

  /**
   * Create a new sprint
   */
  async createSprint(data: CreateSprintRequest): Promise<Sprint> {
    const { data: created, error } = await this.supabase
      .from('sprints')
      .insert([
        {
          project_id: data.project_id,
          name: data.name,
          sprint_number: data.sprint_number,
          start_date: data.start_date,
          end_date: data.end_date,
          goals: data.goals,
          status: 'planning',
          velocity_target: data.velocity_target || 0,
          velocity_actual: 0,
        },
      ])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create sprint: ${error.message}`)
    }

    return created as Sprint
  }

  /**
   * Update sprint status
   */
  async updateSprintStatus(id: string, status: SprintStatus): Promise<void> {
    const { error } = await this.supabase
      .from('sprints')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to update sprint status: ${error.message}`)
    }
  }

  /**
   * Get a sprint by ID
   */
  async getSprint(id: string): Promise<Sprint | null> {
    const { data, error } = await this.supabase
      .from('sprints')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get sprint: ${error.message}`)
    }

    return (data as Sprint) || null
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
      throw new Error(`Failed to get active sprint: ${error.message}`)
    }

    return (data as Sprint) || null
  }

  /**
   * Get all stories in a sprint
   */
  async getStoriesInSprint(sprintId: string): Promise<Story[]> {
    const { data, error } = await this.supabase
      .from('stories')
      .select('*')
      .eq('sprint_id', sprintId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get sprint stories: ${error.message}`)
    }

    return (data || []) as Story[]
  }

  /**
   * Update sprint velocity
   */
  async updateSprintVelocity(
    id: string,
    targetVelocity: number,
    actualVelocity?: number,
  ): Promise<void> {
    const updateData: any = {
      velocity_target: targetVelocity,
      updated_at: new Date().toISOString(),
    }

    if (actualVelocity !== undefined) {
      updateData.velocity_actual = actualVelocity
    }

    const { error } = await this.supabase
      .from('sprints')
      .update(updateData)
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to update sprint velocity: ${error.message}`)
    }
  }

  /**
   * Get velocity metrics for a sprint
   */
  async getVelocityMetrics(sprintId: string): Promise<SprintVelocityMetrics> {
    const sprint = await this.getSprint(sprintId)
    if (!sprint) {
      throw new Error(`Sprint not found: ${sprintId}`)
    }

    const stories = await this.getStoriesInSprint(sprintId)

    const storiesPlanned = stories.length
    const storiesCompleted = stories.filter(
      (s) => s.status === 'completed' || s.status === 'done',
    ).length

    return {
      sprint_id: sprintId,
      velocity_target: sprint.velocity_target,
      velocity_actual: sprint.velocity_actual,
      velocity_percentage:
        sprint.velocity_target > 0
          ? (sprint.velocity_actual / sprint.velocity_target) * 100
          : 0,
      stories_planned: storiesPlanned,
      stories_completed: storiesCompleted,
      completion_rate:
        storiesPlanned > 0 ? (storiesCompleted / storiesPlanned) * 100 : 0,
    }
  }

  /**
   * Check if a sprint is complete
   */
  async completeSprint(id: string): Promise<void> {
    const sprint = await this.getSprint(id)
    if (!sprint) {
      throw new Error(`Sprint not found: ${id}`)
    }

    // Calculate actual velocity from completed stories
    const stories = await this.getStoriesInSprint(id)
    const actualVelocity = stories
      .filter((s) => s.status === 'completed' || s.status === 'done')
      .reduce((sum, s) => sum + (s.story_points || 0), 0)

    await this.updateSprintStatus(id, 'completed')
    await this.updateSprintVelocity(id, sprint.velocity_target, actualVelocity)
  }
}
