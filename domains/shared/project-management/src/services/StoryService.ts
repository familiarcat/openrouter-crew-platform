// File: domains/shared/project-management/src/services/StoryService.ts

import { SupabaseClient } from '@supabase/supabase-js'
import type {
  Story,
  StoryStatus,
  CrewMember,
  CreateStoryRequest,
  UpdateStoryRequest,
} from '../types/sprint'

/**
 * StoryService
 * Handles all story-level operations
 */
export class StoryService {
  private constructor(private supabase: SupabaseClient) {}

  /**
   * Factory method for creating StoryService instances
   */
  static create(supabase: SupabaseClient): StoryService {
    return new StoryService(supabase)
  }

  /**
   * Create a new story
   */
  async createStory(data: CreateStoryRequest): Promise<Story> {
    const { data: created, error } = await this.supabase
      .from('stories')
      .insert([
        {
          project_id: data.project_id,
          sprint_id: data.sprint_id || null,
          title: data.title,
          description: data.description || null,
          story_type: data.story_type,
          status: 'backlog',
          persona_id: data.persona_id || null,
          story_points: data.story_points || 0,
          priority: data.priority,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create story: ${error.message}`)
    }

    return created as Story
  }

  /**
   * Get a story by ID
   */
  async getStory(id: string): Promise<Story | null> {
    const { data, error } = await this.supabase
      .from('stories')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get story: ${error.message}`)
    }

    return (data as Story) || null
  }

  /**
   * Update a story
   */
  async updateStory(id: string, data: UpdateStoryRequest): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.assigned_crew_member !== undefined)
      updateData.assigned_crew_member = data.assigned_crew_member
    if (data.story_points !== undefined) updateData.story_points = data.story_points
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.sprint_id !== undefined) updateData.sprint_id = data.sprint_id

    const { error } = await this.supabase
      .from('stories')
      .update(updateData)
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to update story: ${error.message}`)
    }
  }

  /**
   * Update story status
   */
  async updateStoryStatus(id: string, status: StoryStatus): Promise<void> {
    await this.updateStory(id, { status })
  }

  /**
   * Move a story to a different sprint
   */
  async moveStoryToSprint(
    storyId: string,
    sprintId: string | null,
  ): Promise<void> {
    await this.updateStory(storyId, { sprint_id: sprintId })
  }

  /**
   * Assign a crew member to a story
   */
  async assignCrewMember(
    storyId: string,
    crewMember: CrewMember,
  ): Promise<void> {
    await this.updateStory(storyId, { assigned_crew_member: crewMember })
  }

  /**
   * Get stories by status
   */
  async getStoriesByStatus(
    projectId: string,
    status: StoryStatus,
  ): Promise<Story[]> {
    const { data, error } = await this.supabase
      .from('stories')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get stories: ${error.message}`)
    }

    return (data || []) as Story[]
  }

  /**
   * Get stories by crew member
   */
  async getStoriesByCrewMember(
    projectId: string,
    crewMember: CrewMember,
  ): Promise<Story[]> {
    const { data, error } = await this.supabase
      .from('stories')
      .select('*')
      .eq('project_id', projectId)
      .eq('assigned_crew_member', crewMember)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get stories: ${error.message}`)
    }

    return (data || []) as Story[]
  }

  /**
   * Get stories by priority
   */
  async getStoriesByPriority(
    projectId: string,
    priority: number | string,
  ): Promise<Story[]> {
    const { data, error } = await this.supabase
      .from('stories')
      .select('*')
      .eq('project_id', projectId)
      .eq('priority', priority)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get stories: ${error.message}`)
    }

    return (data || []) as Story[]
  }

  /**
   * Get backlog stories (not assigned to sprint)
   */
  async getBacklogStories(projectId: string): Promise<Story[]> {
    const { data, error } = await this.supabase
      .from('stories')
      .select('*')
      .eq('project_id', projectId)
      .is('sprint_id', null)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get backlog stories: ${error.message}`)
    }

    return (data || []) as Story[]
  }

  /**
   * Delete a story (soft delete by marking as archived)
   */
  async deleteStory(id: string): Promise<void> {
    // Instead of hard delete, we could mark as archived
    // For now, we'll do a soft delete
    const { error } = await this.supabase
      .from('stories')
      .update({
        status: 'backlog' as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete story: ${error.message}`)
    }
  }

  /**
   * Estimate story story points and cost
   */
  async estimateStory(
    storyId: string,
    estimatedHours: number,
    estimatedCost?: number,
  ): Promise<void> {
    const story = await this.getStory(storyId)
    if (!story) {
      throw new Error(`Story not found: ${storyId}`)
    }

    // Calculate story points based on estimated hours
    // Simple formula: every 4 hours = 1 story point
    const estimatedPoints = Math.ceil(estimatedHours / 4)

    await this.updateStory(storyId, {
      story_points: estimatedPoints,
    })
  }
}
