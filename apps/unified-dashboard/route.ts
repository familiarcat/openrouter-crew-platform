import { aiRouter } from '@alex-ai/ai-router/service';
import { getAgentById, AgentProfile } from '@alex-ai/agents/registry';
import { scienceOfficer } from '@alex-ai/rag/science-officer';

export const runtime = 'edge';

interface AgentConfiguration {
  planner: string;
  retriever: string;
  worker: string;
  evaluator: string;
}

const DEFAULT_AGENT_BASE: Omit<AgentProfile, 'id' | 'role' | 'name' | 'icon'> & { tier: any } = {
  capabilities: [],
  tier: 'free',
};

function getAgentWithFallback(id: string, role: string, defaultName: string, icon: string, tier: any = 'free'): AgentProfile {
  const agent = getAgentById(id);
  if (agent) return agent;

  return {
    ...DEFAULT_AGENT_BASE,
    id: `default-${role.toLowerCase()}`,
    role,
    name: defaultName,
    icon,
    tier
  };
}

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { input, agents: agentIds } = await req.json() as { input: string; agents: AgentConfiguration };
  const encoder = new TextEncoder();

  if (!input || !agentIds) {
    return new Response(JSON.stringify({ error: 'Missing input or agent configuration' }), { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sendLog = (role: string, msg: string, metadata?: any) => {
        controller.enqueue(encoder.encode(JSON.stringify({ role, msg, metadata }) + '\n'));
      };

      try {
        // 1. CAPTAIN (Planner)
        const planner = getAgentWithFallback(agentIds.planner, 'Planner', 'Default Planner', '🧑‍✈️');
        sendLog(planner.name, 'Analyzing mission parameters...');
        const complexity = input.length > 200 ? 'high' : 'low';
        // Use the planner's tier to influence model selection, defaulting to 'free' if undefined
        const model = aiRouter.selectModel({ complexity, userPlan: planner.tier || 'free' });
        
        // 2. SCIENCE OFFICER (RAG)
        const retriever = getAgentWithFallback(agentIds.retriever, 'Retrieval', 'Default Retriever', '🧠');
        sendLog(retriever.name, 'Scanning vector database for context...');
        const context = await scienceOfficer.retrieveContext(input);
        if (!context) {
            sendLog(retriever.name, 'No relevant records found in memory.');
        } else {
            sendLog(retriever.name, `Found relevant context. (${context.length} chars)`);
        }
        
        // 3. ENGINEER (Execution)
        const worker = getAgentWithFallback(agentIds.worker, 'Worker', 'Default Worker', '🛠');
        sendLog(worker.name, `Executing via ${model}...`, { model });
        
        const openRouterRes = await aiRouter.callOpenRouter(model, [
          { role: 'system', content: `You are ${worker.name}. Context: ${context || 'None'}` },
          { role: 'user', content: input }
        ]);

        const json = await openRouterRes.json();
        const result = json.choices?.[0]?.message?.content || "Execution yielded no result.";

        // 4. COUNSELOR (Evaluator)
        const evaluator = getAgentWithFallback(agentIds.evaluator, 'Evaluator', 'Default Evaluator', '⚖️', 'premium');
        sendLog(evaluator.name, 'Evaluating output integrity...');
        if (result.length < 50) {
           sendLog(evaluator.name, 'Output quality is low. Recommending escalation or review.');
        } else {
           sendLog(evaluator.name, 'Output meets minimum quality parameters.');
        }

        // 5. COMPUTER (Final Output)
        sendLog('Computer', 'Mission Complete.', { result });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        sendLog('Computer', `CRITICAL ERROR: ${error.message}`);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Scheduled maintenance endpoint
  // Example usage: GET /api/route?task=maintenance
  if (searchParams.get('task') === 'maintenance') {
    try {
      // Prune memories older than 30 days (default retention)
      // @ts-ignore - Method implemented in service update
      const result = await aiRouter.pruneExpiredMemories(30);
      
      return new Response(JSON.stringify({ success: true, maintenance: result }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  return new Response('Unified Dashboard API Online', { status: 200 });
}