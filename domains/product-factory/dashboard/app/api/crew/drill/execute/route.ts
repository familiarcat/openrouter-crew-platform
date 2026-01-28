import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/crew/drill/execute
 *
 * Manual trigger for crew drill execution
 *
 * Request body:
 * - run_type?: string (default: "manual")
 * - scenario_count?: number (default: 25)
 * - complexity_filter?: string[] (optional)
 * - dry_run?: boolean (default: false)
 *
 * Returns:
 * - drill_run_id: Unique ID for this drill run
 * - total_scenarios: Number of scenarios executed
 * - total_cost: Total LLM API cost
 * - evaluation_summary: Picard's assessment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      run_type = 'manual',
      scenario_count,
      complexity_filter,
      dry_run = false
    } = body;

    // Call Python FastAPI backend
    const pythonServiceUrl = process.env.RAG_API_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonServiceUrl}/crew/drill/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        run_type,
        scenario_count,
        complexity_filter,
        dry_run
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Drill execution failed: ${error}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error executing drill:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
