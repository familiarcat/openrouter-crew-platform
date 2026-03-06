// File: apps/unified-dashboard/app/api/sprints/[id]/stories/[storyId]/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import type { Tables } from '@openrouter-crew/shared-schemas'

const VALID_STATUSES = ['backlog', 'planned', 'in_progress', 'in_review', 'completed', 'blocked', 'todo', 'review', 'done']

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; storyId: string } }
) {
  try {
    const sprintId = params.id
    const storyId = params.storyId
    const body = await request.json()
    const { status } = body

    // Validation
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Verify story exists
    const { data: story, error: fetchError } = await supabase
      .from('stories')
      .select('id')
      .eq('id', storyId)
      .eq('sprint_id', sprintId)
      .single()

    if (fetchError || !story) {
      return NextResponse.json(
        { error: 'Story not found in this sprint' },
        { status: 404 }
      )
    }

    // Update story
    const { data, error } = await supabase
      .from('stories')
      .update({
        status: status as 'backlog' | 'planned' | 'in_progress' | 'in_review' | 'completed' | 'blocked' | 'todo' | 'review' | 'done',
        updated_at: new Date().toISOString(),
      })
      .eq('id', storyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Failed to update story: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data as Tables<'stories'>,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    )
  }
}
