// File: apps/unified-dashboard/app/api/sprints/[id]/stories/route.ts

import { NextResponse } from 'next/server'
import { runCrewProjectCli } from '@/lib/crew-project-cli'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sprintId = params.id
    const payload = await runCrewProjectCli<{ stories: unknown[] }>('list-stories', {
      id: sprintId,
    })

    return NextResponse.json({
      data: payload.stories || [],
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

    const payload = await runCrewProjectCli<{ story: unknown }>('create-story', {
      payload: {
        projectId: project_id,
        sprintId,
        title,
        description,
        workType: story_type,
        priority,
        storyPoints: story_points,
      },
    })

    return NextResponse.json(
      { data: payload.story },
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
