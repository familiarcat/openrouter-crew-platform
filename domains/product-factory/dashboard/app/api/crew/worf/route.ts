/**
 * Lt. Worf Security Agent API
 *
 * Provides AI-powered security operations through the crew system
 *
 * Endpoints:
 * - GET  /api/crew/worf - Get security status and agent profile
 * - POST /api/crew/worf - Execute security operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { worf, WorfSecurityAgent } from '@/lib/crew/worf-security-agent';

/**
 * GET /api/crew/worf
 * Get Worf's status and profile
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // Get agent profile
  if (action === 'profile') {
    return NextResponse.json({
      profile: WorfSecurityAgent.profile,
      status: 'active',
      api_version: '1.0.0',
    });
  }

  // Get security status
  if (action === 'status') {
    const status = await worf.getStatus();
    const analysis = await worf.analyzeSecurityPosture();

    return NextResponse.json({
      agent: 'worf',
      status,
      analysis,
      timestamp: new Date().toISOString(),
    });
  }

  // Get audit log
  if (action === 'audit') {
    const limit = parseInt(searchParams.get('limit') || '20');
    const entries = await worf.getAuditLog(limit);

    return NextResponse.json({
      agent: 'worf',
      audit_log: entries,
      total_entries: entries.length,
    });
  }

  // Default: Return agent info and status
  const status = await worf.getStatus();
  const analysis = await worf.analyzeSecurityPosture();

  return NextResponse.json({
    agent: WorfSecurityAgent.profile,
    security_status: status,
    security_analysis: analysis,
    available_operations: [
      'sync_secrets',
      'validate_secrets',
      'setup_local_dev',
      'setup_ci_cd',
      'supabase_workflow',
      'analyze_security',
    ],
    documentation: '/docs/WORF_SECURITY_SYSTEM.md',
  });
}

/**
 * POST /api/crew/worf
 * Execute security operations
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { operation, params = {} } = body;

  if (!operation) {
    return NextResponse.json(
      { error: 'operation is required' },
      { status: 400 }
    );
  }

  let result;

  try {
    switch (operation) {
      case 'sync_secrets':
        result = await worf.syncFromShell();
        break;

      case 'validate_secrets':
        result = await worf.validateSecrets();
        break;

      case 'setup_local_dev':
        result = await worf.setupLocalDev();
        break;

      case 'setup_ci_cd':
        result = await worf.pushToGitHub();
        break;

      case 'link_supabase':
        result = await worf.linkSupabase();
        break;

      case 'run_migrations':
        result = await worf.runMigrations();
        break;

      case 'supabase_workflow':
        result = await worf.runSupabaseWorkflow();
        break;

      case 'analyze_security':
        result = await worf.analyzeSecurityPosture();
        break;

      case 'request_crew_assistance':
        result = await worf.requestCrewAssistance(
          params.task || 'security_review',
          params.urgency || 'medium'
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      agent: 'worf',
      operation,
      result,
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        agent: 'worf',
        operation,
        error: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}
