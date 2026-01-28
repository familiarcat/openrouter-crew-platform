/**
 * Sprint API Endpoints
 *
 * GET /api/sprints - List sprints with filters
 * POST /api/sprints - Create new sprint
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import type {
  Sprint,
  CreateSprintRequest,
  SprintFilters,
  SprintWithDetails
} from '@/types/sprint';



/**
 * GET /api/sprints
 *
 * Query parameters:
 *   - project_id: Filter by project
 *   - status: Filter by status (planning, active, completed, cancelled)
 *   - start_date_after: Filter sprints starting after this date
 *   - start_date_before: Filter sprints starting before this date
 *   - limit: Max results (default: 50)
 *   - offset: Pagination offset (default: 0)
 *   - include_stories: Include story details (default: false)
 *
 * Examples:
 *   GET /api/sprints?project_id=my-project
 *   GET /api/sprints?status=active&include_stories=true
 *   GET /api/sprints?project_id=my-project&start_date_after=2025-01-01
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const filters: SprintFilters = {
      project_id: searchParams.get('project_id') || undefined,
      status: searchParams.get('status') as any || undefined,
      start_date_after: searchParams.get('start_date_after') || undefined,
      start_date_before: searchParams.get('start_date_before') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    const includeStories = searchParams.get('include_stories') === 'true';

    // Build query
    let query = supabase
      .from('sprints')
      .select(includeStories ? `
        *,
        stories (
          *,
          persona:personas (*),
          acceptance_criteria (*),
          tasks (*),
          comments (*)
        ),
        crew_workload (*)
      ` : '*')
      .order('start_date', { ascending: false });

    // Apply filters
    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.start_date_after) {
      query = query.gte('start_date', filters.start_date_after);
    }

    if (filters.start_date_before) {
      query = query.lte('start_date', filters.start_date_before);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching sprints:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sprints', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sprints: data,
      count,
      filters
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/sprints:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sprints
 *
 * Create a new sprint
 *
 * Request body:
 * {
 *   "project_id": "my-project",
 *   "name": "Sprint 23",
 *   "sprint_number": 23,
 *   "start_date": "2025-01-15",
 *   "end_date": "2025-01-29",
 *   "goals": ["Implement dark mode", "Fix critical bugs"],
 *   "velocity_target": 34
 * }
 *
 * Response: Created sprint object
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateSprintRequest = await request.json();

    // Validation
    if (!body.project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    if (!body.name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    if (!body.start_date || !body.end_date) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.start_date) || !dateRegex.test(body.end_date)) {
      return NextResponse.json(
        { error: 'Dates must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    // Validate end_date is after start_date
    if (new Date(body.end_date) <= new Date(body.start_date)) {
      return NextResponse.json(
        { error: 'end_date must be after start_date' },
        { status: 400 }
      );
    }

    // Create sprint
    const { data, error } = await supabase
      .from('sprints')
      .insert({
        project_id: body.project_id,
        name: body.name,
        sprint_number: body.sprint_number,
        start_date: body.start_date,
        end_date: body.end_date,
        goals: body.goals || [],
        status: 'planning',
        velocity_target: body.velocity_target || 0,
        velocity_actual: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sprint:', error);
      return NextResponse.json(
        { error: 'Failed to create sprint', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error in POST /api/sprints:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
