import { CrewWebhookClient } from '@openrouter-crew/crew-core';

// Initialize the shared webhook client
export const crewClient = new CrewWebhookClient({
  baseUrl: process.env.N8N_BASE_URL || 'https://n8n.pbradygeorgen.com',
  apiKey: process.env.N8N_OWNER_API_KEY,
});

export interface StandardCrewResponse {
  response: string;
  status: 'success' | 'error';
  timestamp: string;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
    [key: string]: any;
  };
}

// Helper to standardize responses for the dashboard UI
export const wrapCrewCall = async (
  memberId: string, 
  message: string, 
  context?: any
): Promise<StandardCrewResponse> => {
  try {
    const res = await crewClient.call({
      crewMember: memberId,
      projectId: context?.projectId,
      message,
      context: context || {}
    });

    return {
      response: res.content,
      status: 'success',
      timestamp: new Date().toISOString(),
      metadata: {
        model: res.model,
        tokens: res.tokensUsed,
        cost: res.estimatedCost,
        ...res.metadata
      }
    };
  } catch (error) {
    console.error(`Error calling crew member ${memberId}:`, error);
    return {
      response: `Communication channel with ${memberId} disrupted. Please check subspace frequencies (n8n connectivity).`,
      status: 'error',
      timestamp: new Date().toISOString()
    };
  }
};