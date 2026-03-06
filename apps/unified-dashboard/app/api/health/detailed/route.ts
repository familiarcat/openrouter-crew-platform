import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Detailed health check endpoint - includes Supabase validation
 *
 * ONLY call this from your own monitoring, NOT from AWS load balancer
 * This makes real database queries and costs money
 *
 * Usage: curl http://localhost:3000/api/health/detailed
 */
export async function GET() {
  try {
    // Test Supabase connection
    const { error, count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          service: 'unified-dashboard',
          database: 'disconnected',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'unified-dashboard',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: 'connected',
        projectCount: count
      },
      warning: 'This endpoint makes database queries - use /api/health for load balancer checks'
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'unified-dashboard',
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}
