import { NextResponse } from 'next/server'
import packageJson from '../../../package.json'

/**
 * Health check endpoint - MUST be lightweight to avoid excessive costs
 *
 * AWS/Vercel will call this dozens of times per minute.
 * Each database query costs money. This endpoint does NOT query Supabase.
 *
 * For detailed health checks with database validation, use /api/health/detailed instead.
 */
export async function GET() {
  // Cheap health check - just confirms the service is running
  // No database queries, no API calls
  return NextResponse.json({
    status: 'healthy',
    service: 'unified-dashboard',
    version: packageJson.version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=60', // Cache for 60 seconds to reduce checks
    }
  })
}
