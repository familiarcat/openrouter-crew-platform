// File: apps/unified-dashboard/app/actions/project-actions.ts

'use server'

import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Tables } from '@openrouter-crew/shared-schemas'

interface ProjectInsert {
  name: string
  description?: string
  type: string
  budget_usd?: number
}

interface ProjectUpdate {
  name?: string
  description?: string
  type?: string
  budget_usd?: number
  status?: string
}

/**
 * Create a new project
 */
export async function createProject(data: ProjectInsert): Promise<{ success: boolean; error?: string; projectId?: string }> {
  try {
    // Validation
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Project name is required' }
    }

    if (!data.type || data.type.trim().length === 0) {
      return { success: false, error: 'Project type is required' }
    }

    if (data.budget_usd !== undefined && data.budget_usd < 0) {
      return { success: false, error: 'Budget must be a positive number' }
    }

    const supabase = getSupabaseAdmin()

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name: data.name.trim(),
        description: data.description?.trim() || null,
        type: data.type.trim(),
        budget_usd: data.budget_usd || null,
        status: 'draft',
        total_cost_usd: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: `Failed to create project: ${error.message}` }
    }

    return { success: true, projectId: project.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return { success: false, error: message }
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  projectId: string,
  data: ProjectUpdate
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!projectId) {
      return { success: false, error: 'Project ID is required' }
    }

    // Validation
    if (data.name !== undefined && data.name.trim().length === 0) {
      return { success: false, error: 'Project name cannot be empty' }
    }

    if (data.budget_usd !== undefined && data.budget_usd < 0) {
      return { success: false, error: 'Budget must be a positive number' }
    }

    const supabase = getSupabaseAdmin()

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.description !== undefined) updateData.description = data.description?.trim() || null
    if (data.type !== undefined) updateData.type = data.type.trim()
    if (data.budget_usd !== undefined) updateData.budget_usd = data.budget_usd
    if (data.status !== undefined) updateData.status = data.status

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)

    if (error) {
      return { success: false, error: `Failed to update project: ${error.message}` }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return { success: false, error: message }
  }
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!projectId) {
      return { success: false, error: 'Project ID is required' }
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      return { success: false, error: `Failed to delete project: ${error.message}` }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return { success: false, error: message }
  }
}

/**
 * Get a single project
 */
export async function getProject(projectId: string): Promise<{ success: boolean; data?: Tables<'projects'>; error?: string }> {
  try {
    if (!projectId) {
      return { success: false, error: 'Project ID is required' }
    }

    const supabase = getSupabaseAdmin()

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      return { success: false, error: `Project not found: ${error.message}` }
    }

    return { success: true, data: project }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return { success: false, error: message }
  }
}
