// File: apps/unified-dashboard/app/actions/sprint-actions.ts

'use server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { SprintService, StoryService } from '@openrouter-crew/project-management'
import type { CreateSprintRequest, CreateStoryRequest, StoryStatus, CrewMember } from '@openrouter-crew/project-management'
import type { Tables } from '@openrouter-crew/shared-schemas'

/**
 * Create a new sprint
 */
export async function createSprint(
  data: CreateSprintRequest
): Promise<{ success: boolean; data?: Tables<'sprints'>; error?: string }> {
  try {
    const supabase = getSupabaseAdmin()
    const service = SprintService.create(supabase)
    const sprint = await service.createSprint(data)
    return { success: true, data: sprint }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create sprint'
    return { success: false, error: message }
  }
}

/**
 * Update sprint status
 */
export async function updateSprintStatus(
  sprintId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!sprintId || !status) {
      return { success: false, error: 'Sprint ID and status are required' }
    }

    const supabase = getSupabaseAdmin()
    const service = SprintService.create(supabase)
    await service.updateSprintStatus(sprintId, status as any)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update sprint'
    return { success: false, error: message }
  }
}

/**
 * Create a new story
 */
export async function createStory(
  data: CreateStoryRequest
): Promise<{ success: boolean; data?: Tables<'stories'>; error?: string }> {
  try {
    const supabase = getSupabaseAdmin()
    const service = StoryService.create(supabase)
    const story = await service.createStory(data)
    return { success: true, data: story }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create story'
    return { success: false, error: message }
  }
}

/**
 * Update story status
 */
export async function updateStoryStatus(
  storyId: string,
  status: StoryStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!storyId || !status) {
      return { success: false, error: 'Story ID and status are required' }
    }

    const supabase = getSupabaseAdmin()
    const service = StoryService.create(supabase)
    await service.updateStoryStatus(storyId, status)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update story status'
    return { success: false, error: message }
  }
}

/**
 * Move a story to a sprint
 */
export async function moveStoryToSprint(
  storyId: string,
  sprintId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!storyId) {
      return { success: false, error: 'Story ID is required' }
    }

    const supabase = getSupabaseAdmin()
    const service = StoryService.create(supabase)
    await service.moveStoryToSprint(storyId, sprintId)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to move story'
    return { success: false, error: message }
  }
}

/**
 * Assign a crew member to a story
 */
export async function assignCrewMember(
  storyId: string,
  crewMember: CrewMember
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!storyId || !crewMember) {
      return { success: false, error: 'Story ID and crew member are required' }
    }

    const supabase = getSupabaseAdmin()
    const service = StoryService.create(supabase)
    await service.assignCrewMember(storyId, crewMember)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to assign crew member'
    return { success: false, error: message }
  }
}

/**
 * Get stories for a sprint
 */
export async function getSprintStories(sprintId: string): Promise<{ success: boolean; data?: Tables<'stories'>[]; error?: string }> {
  try {
    if (!sprintId) {
      return { success: false, error: 'Sprint ID is required' }
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('sprint_id', sprintId)
      .order('priority', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch stories'
    return { success: false, error: message }
  }
}

/**
 * Delete a story
 */
export async function deleteStory(storyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!storyId) {
      return { success: false, error: 'Story ID is required' }
    }

    const supabase = getSupabaseAdmin()
    const service = StoryService.create(supabase)
    await service.deleteStory(storyId)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete story'
    return { success: false, error: message }
  }
}
