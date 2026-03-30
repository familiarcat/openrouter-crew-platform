/**
 * Agency Task: UI Architecture Synthesis
 * Team: Full Crew (10 Members)
 * Goal: Define a modern frontend specification based on DDD and Three-Body Philosophy.
 */

import { CrewOrchestrator } from './mcp/claude-with-crew.js';
import fs from 'fs';
import path from 'path';

async function main() {
  const orchestrator = new CrewOrchestrator();
  
  console.log("🖖 Convening the Full Crew in the Observation Lounge for UI Architecture...");
  
  // Activate all core members for a holistic design
  await orchestrator.startAgents([
    'captain_picard', 
    'commander_data', 
    'worf', 
    'geordi_la_forge', 
    'counselor_troi', 
    'quark', 
    'uhura', 
    'chief_obrien', 
    'commander_riker',
    'crusher'
  ]);

  const missionPrompt = `
    TASK: Generate a comprehensive UI/UX Specification for the 'Unified Dashboard'.
    
    CONSIDERATIONS:
    1. DESIGN THEORY: Apply 'Atomic Design' principles and 'Glassmorphism' (Observation Lounge aesthetic).
    2. PHILOSOPHY: The UI must visualize the balance of Time, Money, and Quality (Three-Body).
    3. SOVEREIGNTY: Implement 'Dark Forest' viewports - show where AI is reasoning vs where automation is executing.
    
    CREW REQUIREMENTS:
    - Data & Geordi: Define the technical telemetry and performance heatmaps.
    - Worf & Crusher: Define the security 'Shields' status and system 'Health' diagnostics.
    - Quark: Define the 'Latinum-Flow' cost optimization meters ($1.50 execution target).
    - Troi & Picard: Define the user sentiment and strategic mission-control overview.
    - Uhura & O'Brien: Define the communication bridge and local/remote parity logs.

    OUTPUT: A structured Markdown document containing the 'Master UI Blueprint'.
  `;

  const response = await orchestrator.solveProblem(missionPrompt);

  if (response.success) {
    const outputPath = path.join(process.cwd(), 'docs/ui-master-blueprint.md');
    fs.writeFileSync(outputPath, response.synthesis);
    console.log(`\n✅ UI Blueprint generated and saved to: ${outputPath}`);
  }

  await orchestrator.stopAgents();
}

main().catch(console.error);