import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/crew/drill/results?runId=xxx
 *
 * Get detailed results of a drill run
 *
 * Query parameters:
 * - runId: Drill run ID (optional - returns latest if not provided)
 *
 * Returns:
 * - results: Complete drill run details including:
 *   - Execution summary
 *   - Picard's evaluation
 *   - Recommendations
 *   - Updates applied
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json(
        {
          success: false,
          error: 'runId query parameter is required'
        },
        { status: 400 }
      );
    }

    // Call Python FastAPI backend
    const pythonServiceUrl = process.env.RAG_API_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonServiceUrl}/crew/drill/results/${runId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: 'Drill run not found'
          },
          { status: 404 }
        );
      }

      const error = await response.text();
      throw new Error(`Failed to fetch drill results: ${error}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error fetching drill results:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
