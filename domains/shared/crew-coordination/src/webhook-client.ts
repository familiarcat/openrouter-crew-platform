import axios from "axios";

export interface WebhookPayload {
  agentId: string;
  taskId: string;
  status: "started" | "completed" | "failed";
  output?: string;
  model?: string;
        costUSD: (data.estimated_cost as any) || (data as any).cost || 0,
      error: data["error"] as string | undefined,
      metadata: data["metadata"] as Record<string, unknown> | undefined,
    };
  }
}
