import { NextRequest, NextResponse } from "next/server";
import crewRegistry from "@/config/crew-registry.json";

interface CrewMember {
  id: string;
  name: string;
  role: string;
  webhook_path: string;
}

interface TestAllResponse {
  success: boolean;
  totalCrewMembers: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    crewId: string;
    crewName: string;
    status: "success" | "failed";
    response: string;
    memoryCount: number;
    standardResponse: string;
  }>;
  timestamp: string;
}

/**
 * POST /api/crew/test
 * Test all crew webhooks with standard input
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const testInput = body.input || "Test request from webhook suite";

    const crew = (crewRegistry as any).crew_members as CrewMember[];

    if (!crew || crew.length === 0) {
      return NextResponse.json(
        { success: false, error: "No crew members configured" },
        { status: 500 },
      );
    }

    // Test all crew members in parallel
    const testPromises = crew.map(async (crewMember) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/crew/engage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              crewId: crewMember.id,
              input: testInput,
              requestId: `batch-test-${Date.now()}-${crewMember.id}`,
            }),
          },
        );

        if (!response.ok) {
          return {
            crewId: crewMember.id,
            crewName: crewMember.name,
            status: "failed" as const,
            response: `HTTP ${response.status}`,
            memoryCount: 0,
            standardResponse: `I am ${crewMember.name} and I do ${crewMember.role} with 0 Memories`,
          };
        }

        const data = await response.json();

        return {
          crewId: crewMember.id,
          crewName: crewMember.name,
          status: data.success ? ("success" as const) : ("failed" as const),
          response: data.response || data.error || "No response",
          memoryCount: data.memoryCount || 0,
          standardResponse:
            data.response ||
            `I am ${crewMember.name} and I do ${crewMember.role} with ${data.memoryCount || 0} Memories`,
        };
      } catch (error) {
        return {
          crewId: crewMember.id,
          crewName: crewMember.name,
          status: "failed" as const,
          response: error instanceof Error ? error.message : "Unknown error",
          memoryCount: 0,
          standardResponse: `I am ${crewMember.name} and I do ${crewMember.role} with 0 Memories`,
        };
      }
    });

    const results = await Promise.all(testPromises);

    const successCount = results.filter((r) => r.status === "success").length;
    const failureCount = results.filter((r) => r.status === "failed").length;

    const response: TestAllResponse = {
      success: failureCount === 0,
      totalCrewMembers: crew.length,
      successCount,
      failureCount,
      results,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: failureCount === 0 ? 200 : 206,
    });
  } catch (error) {
    console.error("Error in crew test:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/crew/test
 * Same as POST but with default test input
 */
export async function GET(): Promise<NextResponse> {
  return POST(new NextRequest("http://localhost", { method: "POST" }));
}
