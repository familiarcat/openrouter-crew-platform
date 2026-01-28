/**
 * Health Check Endpoint
 *
 * GET /api/health
 *
 * Returns system health status including:
 * - Supabase connectivity
 * - Database table status
 * - Environment configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  supabase: {
    connected: boolean;
    tables: {
      sprints: boolean;
      stories: boolean;
      projects: boolean;
    };
    projectId?: string;
  };
  environment: {
    n8nProjectWebhook: boolean;
    n8nCategoryWebhook: boolean;
    supabaseUrl: boolean;
    supabaseKey: boolean;
  };
  errors?: string[];
}

export async function GET(request: NextRequest) {
  const health: HealthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    supabase: {
      connected: false,
      tables: {
        sprints: false,
        stories: false,
        projects: false,
      },
    },
    environment: {
      n8nProjectWebhook: !!process.env.N8N_PROJECT_WEBHOOK_URL,
      n8nCategoryWebhook: !!process.env.N8N_WEBHOOK_URL,
      supabaseUrl: !!process.env.SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    errors: [],
  };

  try {
    // Test Supabase connectivity
    const { data: projectData, error: projectError } = await supabase
      .from("sprints")
      .select("count()")
      .limit(1)
      .single();

    if (!projectError) {
      health.supabase.connected = true;
      health.supabase.tables.sprints = true;
    } else {
      health.errors?.push(`Sprints table error: ${projectError.message}`);
    }

    // Test stories table
    const { error: storiesError } = await supabase
      .from("stories")
      .select("count()")
      .limit(1)
      .single();

    if (!storiesError) {
      health.supabase.tables.stories = true;
    } else {
      health.errors?.push(`Stories table error: ${storiesError.message}`);
    }

    // Test projects table (if exists)
    const { error: projectsError } = await supabase
      .from("projects")
      .select("count()")
      .limit(1)
      .single();

    if (!projectsError) {
      health.supabase.tables.projects = true;
    } else {
      // Projects table may not exist - not critical
      console.debug("Projects table may not exist:", projectsError.message);
    }

    // Get project ID from env
    const projectId = process.env.SUPABASE_PROJECT_ID;
    if (projectId) {
      health.supabase.projectId = projectId;
    }

    // Determine overall status
    if (
      !health.supabase.connected ||
      !health.supabase.tables.sprints ||
      !health.supabase.tables.stories
    ) {
      health.status = "degraded";
    }

    if (
      !health.environment.n8nProjectWebhook ||
      !health.environment.n8nCategoryWebhook
    ) {
      health.status = "degraded";
      health.errors?.push(
        "n8n webhooks not configured - set N8N_PROJECT_WEBHOOK_URL and N8N_WEBHOOK_URL",
      );
    }

    if (!health.environment.supabaseUrl || !health.environment.supabaseKey) {
      health.status = "unhealthy";
      health.errors?.push(
        "Supabase credentials missing - set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
      );
    }
  } catch (error: any) {
    health.status = "unhealthy";
    health.errors?.push(`Unexpected error: ${error?.message || String(error)}`);
  }

  const statusCode =
    health.status === "healthy"
      ? 200
      : health.status === "degraded"
        ? 503
        : 500;

  return NextResponse.json(health, { status: statusCode });
}
