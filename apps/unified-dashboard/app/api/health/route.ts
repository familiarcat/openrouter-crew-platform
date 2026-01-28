import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test Supabase connection
    const { error } = await supabase.from('projects').select('count').limit(1)

    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
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
      checks: {
        supabase: 'connected'
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}
