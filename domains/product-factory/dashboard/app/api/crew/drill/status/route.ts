import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/crew/drill/status?runId=xxx
 *
 * Get status of a drill run
 *
 * Query parameters:
 * - runId: Drill run ID (optional - returns latest if not provided)
 *
 * Returns:
 * - drill_run: Drill run status and details
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
    const response = await fetch(`${pythonServiceUrl}/crew/drill/status/${runId}`, {
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
      throw new Error(`Failed to fetch drill status: ${error}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error fetching drill status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
