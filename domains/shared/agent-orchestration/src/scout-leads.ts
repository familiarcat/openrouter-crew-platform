/**
 * Agency Task: Opportunity Scout
 * Team: Commander Data (Research) + Lt. Uhura (Communication)
 */

import { CrewOrchestrator } from './mcp/claude-with-crew.js';

async function main() {
  const orchestrator = new CrewOrchestrator();
  
  // 1. Activate the specific team-up
  // We use 'commander_data' and 'uhura' IDs defined in crew-identities.md
  console.log("📡 Agency mission initiated: Activating Data and Uhura...");
  await orchestrator.startAgents(['commander_data', 'uhura']);

  // 2. Define the Agency Goal
  const missionPrompt = `
    Perform an autonomous lead-scouting mission for our AI Agency.
    1. RESEARCH (Data): Scan for new business permits, sentiment shifts in local STL restaurant reviews, or hospitality market gaps.
    2. STRATEGIZE (Uhura): Architect a communication strategy for the top 3 high-value opportunities discovered.
    
    Focus on opportunities where our $1.50 execution model (BarItalia STL) provides a 500x ROI.
  `;

  console.log("🚀 Scouting for opportunities...");
  const response = await orchestrator.solveProblem(missionPrompt);

  if (response.success) {
    console.log("\n🎯 Mission Success - Intelligence Report Collected:");
    console.log(response.synthesis);
  }

  // 3. Graceful shutdown of agent subprocesses
  await orchestrator.stopAgents();
}

main().catch(console.error);