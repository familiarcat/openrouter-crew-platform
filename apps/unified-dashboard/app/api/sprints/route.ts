// File: apps/unified-dashboard/app/api/sprints/route.ts

import { NextResponse } from 'next/server'
import { runCrewProjectCli } from '@/lib/crew-project-cli'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      )
    }

    const payload = await runCrewProjectCli<{ data: unknown[] }>('list-sprints', {
      id: projectId,
    })

    return NextResponse.json({
      data: payload.data || [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { project_id, name, goal, durationDays } = body

    // Validation
    if (!project_id || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: project_id and name' },
        { status: 400 }
      )
    }

    const payload = await runCrewProjectCli<{ sprint: unknown }>('create-sprint', {
      payload: {
        projectId: project_id,
        name,
        goal,
        durationDays,
      },
    })

    return NextResponse.json(
      { data: payload.sprint },
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
