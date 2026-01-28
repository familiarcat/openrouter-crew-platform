/**
 * Stories API Endpoints
 *
 * GET /api/stories - List stories with filters
 * POST /api/stories - Create new story
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import type {
  Story,
  CreateStoryRequest,
  StoryFilters,
  AcceptanceCriterion
} from '@/types/sprint';



/**
 * GET /api/stories
 *
 * Query parameters:
 *   - project_id: Filter by project (required)
 *   - sprint_id: Filter by sprint (use 'backlog' for unassigned)
 *   - status: Filter by status (backlog, planned, in_progress, etc.)
 *   - story_type: Filter by type (user_story, developer_story, bug_fix, technical_task)
 *   - assigned_crew_member: Filter by assigned crew member
 *   - persona_id: Filter by persona
 *   - priority: Filter by priority (1-5)
 *   - limit: Max results (default: 100)
 *   - offset: Pagination offset (default: 0)
 *
 * Examples:
 *   GET /api/stories?project_id=my-project&sprint_id=backlog
 *   GET /api/stories?project_id=my-project&assigned_crew_member=data
 *   GET /api/stories?project_id=my-project&status=in_progress&status=review
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // project_id is required
    const projectId = searchParams.get('project_id');
    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id query parameter is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('stories')
      .select(`
        *,
        persona:personas (*),
        acceptance_criteria (*),
        tasks (*),
        comments (*)
      `)
      .eq('project_id', projectId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    // Filter by sprint_id
    const sprintId = searchParams.get('sprint_id');
    if (sprintId === 'backlog') {
      query = query.is('sprint_id', null);
    } else if (sprintId) {
      query = query.eq('sprint_id', sprintId);
    }

    // Filter by status
    const status = searchParams.getAll('status');
    if (status.length > 0) {
      if (status.length === 1) {
        query = query.eq('status', status[0]);
      } else {
        query = query.in('status', status);
      }
    }

    // Filter by story_type
    const storyType = searchParams.getAll('story_type');
    if (storyType.length > 0) {
      if (storyType.length === 1) {
        query = query.eq('story_type', storyType[0]);
      } else {
        query = query.in('story_type', storyType);
      }
    }

    // Filter by assigned crew member
    const assignedCrewMember = searchParams.get('assigned_crew_member');
    if (assignedCrewMember) {
      query = query.eq('assigned_crew_member', assignedCrewMember);
    }

    // Filter by persona
    const personaId = searchParams.get('persona_id');
    if (personaId) {
      query = query.eq('persona_id', personaId);
    }

    // Filter by priority
    const priority = searchParams.getAll('priority');
    if (priority.length > 0) {
      const priorities = priority.map(p => parseInt(p));
      if (priorities.length === 1) {
        query = query.eq('priority', priorities[0]);
      } else {
        query = query.in('priority', priorities);
      }
    }

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching stories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stories', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      stories: data,
      count,
      filters: {
        project_id: projectId,
        sprint_id: sprintId,
        status,
        story_type: storyType,
        assigned_crew_member: assignedCrewMember,
        persona_id: personaId,
        priority
      }
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/stories:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stories
 *
 * Create a new story
 *
 * Request body:
 * {
 *   "project_id": "my-project",
 *   "title": "Add dark mode toggle",
 *   "description": "As an End User, I want to toggle dark mode...",
 *   "story_type": "user_story",
 *   "persona_id": "uuid-of-end-user-persona",
 *   "story_points": 5,
 *   "priority": 2,
 *   "sprint_id": "uuid-of-sprint" (optional),
 *   "acceptance_criteria": [
 *     {
 *       "given_clause": "Given I am on the settings page",
 *       "when_clause": "When I click the dark mode toggle",
 *       "then_clause": "Then the UI switches to dark theme",
 *       "display_order": 1
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateStoryRequest = await request.json();

    // Validation
    if (!body.project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    if (!body.title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    if (!body.story_type) {
      return NextResponse.json(
        { error: 'story_type is required' },
        { status: 400 }
      );
    }

    const validStoryTypes = ['user_story', 'developer_story', 'bug_fix', 'technical_task'];
    if (!validStoryTypes.includes(body.story_type)) {
      return NextResponse.json(
        { error: `Invalid story_type. Must be one of: ${validStoryTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (body.priority === undefined || body.priority < 1 || body.priority > 5) {
      return NextResponse.json(
        { error: 'priority must be between 1 (highest) and 5 (lowest)' },
        { status: 400 }
      );
    }

    // Create story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        project_id: body.project_id,
        sprint_id: body.sprint_id || null,
        title: body.title,
        description: body.description || null,
        story_type: body.story_type,
        status: 'backlog',
        persona_id: body.persona_id || null,
        story_points: body.story_points || null,
        priority: body.priority
      })
      .select()
      .single();

    if (storyError) {
      console.error('Error creating story:', storyError);
      return NextResponse.json(
        { error: 'Failed to create story', details: storyError.message },
        { status: 500 }
      );
    }

    // Create acceptance criteria if provided
    if (body.acceptance_criteria && body.acceptance_criteria.length > 0) {
      const criteriaToInsert = body.acceptance_criteria.map(ac => ({
        story_id: story.id,
        given_clause: ac.given_clause,
        when_clause: ac.when_clause,
        then_clause: ac.then_clause,
        display_order: ac.display_order || 1,
        is_completed: ac.is_completed || false
      }));

      const { error: criteriaError } = await supabase
        .from('acceptance_criteria')
        .insert(criteriaToInsert);

      if (criteriaError) {
        console.error('Error creating acceptance criteria:', criteriaError);
        // Don't fail the entire request, but log the error
      }
    }

    // Fetch the complete story with relations
    const { data: completeStory } = await supabase
      .from('stories')
      .select(`
        *,
        persona:personas (*),
        acceptance_criteria (*),
        tasks (*),
        comments (*)
      `)
      .eq('id', story.id)
      .single();

    return NextResponse.json(completeStory, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error in POST /api/stories:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
