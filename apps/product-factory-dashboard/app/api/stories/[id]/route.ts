import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';



interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/stories/[id]
 * Fetch a single story by ID with details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const { data: story, error } = await supabase
      .from('stories')
      .select(`
        *,
        persona:personas(*),
        acceptance_criteria:acceptance_criteria(*),
        tasks:tasks(*),
        comments:comments(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json({ story }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/stories/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/stories/[id]
 * Update a story (drag-drop, modal edits)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    console.log(`Updating story ${id}:`, updates);

    // Only allow updating specific fields
    const allowedFields = [
      'title',
      'description',
      'story_type',
      'status',
      'story_points',
      'priority',
      'assigned_crew_member',
      'start_date',
      'estimated_completion',
      'estimated_hours',
      'sprint_id',
      'persona_id',
      'related_goals'
    ];

    const cleanedUpdates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in updates) {
        cleanedUpdates[field] = updates[field];
      }
    }

    cleanedUpdates.updated_at = new Date().toISOString();

    const { data: story, error } = await supabase
      .from('stories')
      .update(cleanedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json({ story }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/stories/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/stories/[id]
 * Delete a story
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/stories/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
