import axios from "axios";

export interface WebhookPayload {
  agentId: string;
  taskId: string;
  status: "started" | "completed" | "failed";
  output?: string;
  model?: string;
  costUSD: number;
  executionTimeMs: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export class WebhookClient {
  private endpoint: string;
  private secret?: string;

  constructor(endpoint: string, secret?: string) {
    this.endpoint = endpoint;
    this.secret = secret;
  }

  async send(payload: WebhookPayload): Promise<void> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.secret) {
      headers["X-Webhook-Secret"] = this.secret;
    }

    try {
      await axios.post(this.endpoint, payload, { headers, timeout: 10_000 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[WebhookClient] Failed to send webhook: ${message}`);
      // Non-fatal — do not re-throw so agent execution continues
    }
  }

  /**
   * Build a WebhookPayload from raw execution result data.
   * Handles both `costUSD` (new) and legacy `cost` / `estimated_cost` fields.
   */
  static buildPayload(
    agentId: string,
    taskId: string,
    status: WebhookPayload["status"],
    data: Record<string, unknown>
  ): WebhookPayload {
    const costUSD =
      (data["costUSD"] as number) ||
      (data["estimated_cost"] as number) ||
      (data["cost"] as number) ||
      0;

    return {
      agentId,
      taskId,
      status,
      output: data["output"] as string | undefined,
      model: data["model"] as string | undefined,
      costUSD,
      executionTimeMs: (data["executionTimeMs"] as number) || 0,
      error: data["error"] as string | undefined,
      metadata: data["metadata"] as Record<string, unknown> | undefined,
    };
  }
}
