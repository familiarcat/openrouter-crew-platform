import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/crew/drill/cron
 *
 * Weekly automated drill execution (triggered by Vercel Cron)
 *
 * This endpoint is called automatically by Vercel Cron every Monday at 2 AM UTC.
 * It must be protected with a cron secret to prevent unauthorized execution.
 *
 * Headers:
 * - authorization: Bearer <CRON_SECRET>
 *
 * Returns:
 * - Drill execution result
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!authHeader || authHeader !== expectedAuth) {
      console.warn('Unauthorized cron attempt');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    console.log('🔄 Weekly drill cron triggered');

    // Call Python FastAPI backend for weekly automated drill
    const pythonServiceUrl = process.env.RAG_API_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonServiceUrl}/crew/drill/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        run_type: 'weekly_auto',
        scenario_count: 25,
        dry_run: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Weekly drill execution failed: ${error}`);
    }

    const result = await response.json();

    console.log(
      `✅ Weekly drill complete: ${result.total_scenarios} scenarios, ` +
      `$${result.total_cost?.toFixed(4)} cost`
    );

    return NextResponse.json({
      success: true,
      message: 'Weekly drill completed successfully',
      ...result
    });

  } catch (error) {
    console.error('❌ Error executing weekly drill:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
