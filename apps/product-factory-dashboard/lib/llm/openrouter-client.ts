import { OpenRouterMessage } from "./types";

export type OpenRouterCallInput = {
  apiKey: string;
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  headers?: Record<string,string>;
};

export async function callOpenRouterChat(input: OpenRouterCallInput) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
      ...(input.headers ?? {})
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.2,
      max_tokens: input.max_tokens
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(()=>"");
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }
  return res.json();
}

// Client class wrapper for compatibility with batch executor
export class OpenRouterClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
  }

  async call(input: OpenRouterCallInput) {
    return callOpenRouterChat(input);
  }

  async createCompletion(
    modelId: string,
    messages: OpenRouterMessage[],
    temperature: number,
    maxTokens: number
  ) {
    const startTime = Date.now();
    const response = await callOpenRouterChat({
      apiKey: this.apiKey,
      model: modelId,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    const latencyMs = Date.now() - startTime;

    return {
      ...response,
      _latencyMs: latencyMs,
    };
  }

  getModelPricing(modelId: string, costDatabase: any) {
    if (!costDatabase || !costDatabase.models) {
      return null;
    }

    return costDatabase.models[modelId] || null;
  }

  estimateCost(
    modelId: string,
    promptTokens: number,
    completionTokens: number,
    pricing: any
  ): number {
    if (!pricing) {
      return 0;
    }

    const promptCost = (promptTokens / 1_000_000) * (pricing.input || 0);
    const completionCost = (completionTokens / 1_000_000) * (pricing.output || 0);

    return promptCost + completionCost;
  }
}
