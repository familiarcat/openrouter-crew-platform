// File: apps/unified-dashboard/app/api/sprints/[id]/stories/[storyId]/route.ts

import { NextResponse } from 'next/server'
import { runCrewProjectCli } from '@/lib/crew-project-cli'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['backlog', 'planned', 'in_progress', 'in_review', 'completed', 'blocked', 'todo', 'review', 'done']

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; storyId: string } }
) {
  try {
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

    const payload = await runCrewProjectCli<{ story: unknown }>('update-story', {
      id: storyId,
      payload: { status },
    })

    return NextResponse.json({
      data: payload.story,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    )
  }
}
