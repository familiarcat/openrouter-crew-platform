import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crewRegistry from "@/config/crew-registry.json";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

interface CrewMember {
  id: string;
  name: string;
  role: string;
  webhook_path: string;
}

interface EngageRequest {
  crewId: string;
  input: string;
  requestId?: string;
}

interface EngageResponse {
  success: boolean;
  crewMember: {
    id: string;
    name: string;
    role: string;
  };
  memoryCount: number;
  webhookResponse: string;
  response: string;
  timestamp: string;
  requestId: string;
  error?: string;
}

/**
 * GET /api/crew/engage
 * List available crew members
 */
export async function GET(): Promise<NextResponse> {
  try {
    const members = (crewRegistry as any).crew_members || [];

    return NextResponse.json({
      success: true,
      count: members.length,
      crew: members.map((m: CrewMember) => ({
        id: m.id,
        name: m.name,
        role: m.role,
      })),
    });
  } catch (error) {
    console.error("Error fetching crew list:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch crew members" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/crew/engage
 * Engage a crew member with a request
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: EngageRequest = await request.json();
    const { crewId, input } = body;

    // Validate input
    if (!crewId || !input) {
      return NextResponse.json(
        { success: false, error: "crewId and input are required" },
        { status: 400 },
      );
    }

    // Find crew member
    const crew = (crewRegistry as any).crew_members as CrewMember[];
    const crewMember = crew.find((m) => m.id === crewId);

    if (!crewMember) {
      return NextResponse.json(
        { success: false, error: `Crew member "${crewId}" not found` },
        { status: 404 },
      );
    }

    // Get memory count from Supabase
    let memoryCount = 0;
    try {
      const { count, error } = await supabase
        .from("crew_memories")
        .select("id", { count: "exact", head: true })
        .eq("crew_member_id", crewId);

      if (!error && count !== null) {
        memoryCount = count;
      }
    } catch (e) {
      console.warn(`Failed to fetch memory count for ${crewId}:`, e);
    }

    // Build webhook URL
    const baseUrl = process.env.N8N_BASE_URL || "https://n8n.pbradygeorgen.com";
    const webhookUrl = `${baseUrl}/webhook/${crewMember.webhook_path}`;

    // Prepare payload
    const requestId =
      body.requestId ||
      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const payload = {
      input,
      requestId,
      context: {
        crewMember: crewMember.name,
        role: crewMember.role,
        memories: memoryCount,
      },
      timestamp: new Date().toISOString(),
    };

    // Call webhook
    let webhookResponse = "";
    let webhookSuccess = false;

    try {
      const webhookReq = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      webhookSuccess = webhookReq.ok;

      if (webhookReq.ok) {
        const data = await webhookReq.json();
        webhookResponse =
          typeof data === "string" ? data : JSON.stringify(data);
      } else {
        webhookResponse = `HTTP ${webhookReq.status}`;
      }
    } catch (e) {
      console.error(`Webhook call failed for ${crewMember.name}:`, e);
      webhookResponse = `Error: ${e instanceof Error ? e.message : "Unknown error"}`;
    }

    // Build standard response
    const standardResponse = `I am ${crewMember.name} and I do ${crewMember.role} with ${memoryCount} Memories`;

    const response: EngageResponse = {
      success: webhookSuccess,
      crewMember: {
        id: crewMember.id,
        name: crewMember.name,
        role: crewMember.role,
      },
      memoryCount,
      webhookResponse,
      response: standardResponse,
      timestamp: new Date().toISOString(),
      requestId,
    };

    if (!webhookSuccess) {
      response.error = `Webhook failed with response: ${webhookResponse}`;
    }

    return NextResponse.json(response, {
      status: webhookSuccess ? 200 : 500,
    });
  } catch (error) {
    console.error("Error in crew engagement:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
