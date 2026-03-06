// File: apps/unified-dashboard/app/api/sprints/[id]/stories/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import type { Tables } from '@openrouter-crew/shared-schemas'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sprintId = params.id

    const supabase = createClient()
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('sprint_id', sprintId)
      .order('priority', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch stories: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data as Tables<'stories'>[],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sprintId = params.id
    const body = await request.json()
    const { project_id, title, description, story_type, priority, story_points } = body

    // Validation
    if (!project_id || !title || !story_type || priority === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: project_id, title, story_type, priority' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('stories')
      .insert({
        project_id,
        sprint_id: sprintId,
        title,
        description: description || null,
        story_type: story_type as 'user_story' | 'developer_story' | 'technical_task' | 'bug_fix' | 'feature' | 'bug' | 'tech_debt' | 'spike' | 'documentation',
        priority,
        story_points: story_points || null,
        status: 'backlog',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Failed to create story: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data: data as Tables<'stories'> },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    )
  }
}
