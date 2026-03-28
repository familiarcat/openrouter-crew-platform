import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { supabase } from "@/lib/supabase";

const __typed: SupabaseClient<Database> = supabase; // <- must compile

type SprintInsert = Database["public"]["Tables"]["sprints"]["Insert"];
const _typedCheck: Database["public"]["Tables"]["sprints"]["Insert"] =
  {} as any;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      projectId: string;
      projectName: string;
      goals: string[];
      context?: Record<string, any>;
      autoActivate?: boolean;
    };

    const {
      projectId,
      projectName,
      goals,
      context = {},
      autoActivate = false,
    } = body;

    // If you create dates elsewhere, keep them here:
    const now = new Date();
    const start_date = now.toISOString();
    const end_date = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(); // +7d
    const sprint_number = 0;

    const sprintData: SprintInsert = {
      project_id: projectId,
      name: projectName,
      sprint_number,
      start_date,
      end_date,
      goals,
      status: autoActivate ? "active" : "planning",
      velocity_target: 0,
      velocity_actual: 0,
    };

    const { data: createdSprint, error: sprintError } = await supabase
      .from("sprints")
      .insert(sprintData)
      .select()
      .single();

    if (sprintError) {
      return NextResponse.json(
        { success: false, error: sprintError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, sprint: createdSprint });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
