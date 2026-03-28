/**
 * Individual Sprint API Endpoints
 *
 * GET /api/sprints/[id] - Get sprint by ID
 * PATCH /api/sprints/[id] - Update sprint
 * DELETE /api/sprints/[id] - Delete sprint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Sprint, SprintStatus } from '@/types/sprint';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/sprints/[id]
 *
 * Get a single sprint by ID with optional story details
 *
 * Query parameters:
 *   - include_stories: Include story details (default: true)
 *   - include_workload: Include crew workload (default: true)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;

    const includeStories = searchParams.get('include_stories') !== 'false';
    const includeWorkload = searchParams.get('include_workload') !== 'false';

    // Build select query
    let selectQuery = '*';

    if (includeStories) {
      selectQuery += `, stories (
        *,
        persona:personas (*),
        acceptance_criteria (*),
        tasks (*),
        comments (*)
      )`;
    }

    if (includeWorkload) {
      selectQuery += `, crew_workload (*)`;
    }

    const { data, error } = await supabase
      .from('sprints')
      .select(selectQuery)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Sprint not found' },
          { status: 404 }
        );
      }

      console.error('Error fetching sprint:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sprint', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Unexpected error in GET /api/sprints/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sprints/[id]
 *
 * Update a sprint
 *
 * Request body (all fields optional):
 * {
 *   "name": "Sprint 23 - Updated",
 *   "status": "active",
 *   "goals": ["New goal"],
 *   "velocity_target": 40,
 *   "velocity_actual": 32
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Build update object (only include provided fields)
    const updates: Partial<Sprint> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.status !== undefined) {
      // Validate status
      const validStatuses: SprintStatus[] = ['planning', 'active', 'completed', 'cancelled'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }
    if (body.goals !== undefined) updates.goals = body.goals;
    if (body.velocity_target !== undefined) updates.velocity_target = body.velocity_target;
    if (body.velocity_actual !== undefined) updates.velocity_actual = body.velocity_actual;
    if (body.start_date !== undefined) updates.start_date = body.start_date;
    if (body.end_date !== undefined) updates.end_date = body.end_date;

    // If dates are being updated, validate them
    if (updates.start_date || updates.end_date) {
      // Fetch current sprint to check dates
      const { data: currentSprint } = await supabase
        .from('sprints')
        .select('start_date, end_date')
        .eq('id', id)
        .single();

      if (currentSprint) {
        const startDate = updates.start_date || currentSprint.start_date;
        const endDate = updates.end_date || currentSprint.end_date;

        if (new Date(endDate) <= new Date(startDate)) {
          return NextResponse.json(
            { error: 'end_date must be after start_date' },
            { status: 400 }
          );
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Perform update
    const { data, error } = await supabase
      .from('sprints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Sprint not found' },
          { status: 404 }
        );
      }

      console.error('Error updating sprint:', error);
      return NextResponse.json(
        { error: 'Failed to update sprint', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Unexpected error in PATCH /api/sprints/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sprints/[id]
 *
 * Delete a sprint
 * WARNING: This will cascade delete all stories, tasks, comments, etc.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    // Check if sprint exists
    const { data: sprint } = await supabase
      .from('sprints')
      .select('id, name')
      .eq('id', id)
      .single();

    if (!sprint) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      );
    }

    // Delete sprint (cascade will handle related records)
    const { error } = await supabase
      .from('sprints')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting sprint:', error);
      return NextResponse.json(
        { error: 'Failed to delete sprint', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Sprint deleted successfully',
      deleted: sprint
    });

  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/sprints/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
