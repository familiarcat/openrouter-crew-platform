import { NextResponse } from 'next/server';
import { CrewOrchestrator } from '@openrouter-crew/agent-orchestration';

export async function POST(req: Request) {
  try {
    const { problem, agents, projectId } = await req.json();

    if (!problem) {
      return NextResponse.json({ error: 'Problem statement is required' }, { status: 400 });
    }

    const orchestrator = new CrewOrchestrator();
    
    // Initialize and start requested agents (defaults to data and worf)
    await orchestrator.startAgents(agents || ['data', 'worf'], projectId);

    const result = await orchestrator.solveProblem(problem, projectId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Orchestration API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}