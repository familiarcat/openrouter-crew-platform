// File: apps/unified-dashboard/app/api/sprints/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import type { Tables } from '@openrouter-crew/shared-schemas'

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

    const supabase = createClient()
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .order('sprint_number', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch sprints: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data as Tables<'sprints'>[],
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
    const { project_id, name, sprint_number, start_date, end_date, goals, velocity_target } = body

    // Validation
    if (!project_id || !name || sprint_number === undefined || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields: project_id, name, sprint_number, start_date, end_date' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check for duplicate sprint_number in project
    const { data: existing } = await supabase
      .from('sprints')
      .select('id')
      .eq('project_id', project_id)
      .eq('sprint_number', sprint_number)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: `Sprint ${sprint_number} already exists for this project` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('sprints')
      .insert({
        project_id,
        name,
        sprint_number,
        start_date,
        end_date,
        goals: goals || [],
        velocity_target: velocity_target || 0,
        status: 'planning',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Failed to create sprint: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data: data as Tables<'sprints'> },
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
