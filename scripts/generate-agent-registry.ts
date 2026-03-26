import fs from 'fs';
import path from 'path';

import { glob } from 'glob';

// Configuration
const ROOT_DIR = process.cwd();
const SEARCH_PATTERN = '**/*.ts'; // Scan all TS files
const OUTPUT_FILE = path.join(ROOT_DIR, 'domains/alex-ai-universal/dashboard/lib/agents/registry.ts');
const AGENT_FILE_PATTERN = 'src/agents/*.ts'; // Fallback pattern
const CREW_MEMBERS_FILE = path.join(ROOT_DIR, 'domains/shared/crew-coordination/src/members.ts');

// Regex to find classes extending Agent or implementing Agent interface
// This is a simple regex-based "AST-lite" approach as discussed
const AGENT_CLASS_REGEX = /class\s+(\w+)\s+(?:extends\s+Agent|implements\s+Agent)/g;

// Regex to capture static properties inside the class body
const STATIC_ROLE_REGEX = /static\s+role\s*=\s*['"](.+?)['"]/;
const STATIC_GOAL_REGEX = /static\s+goal\s*=\s*['"](.+?)['"]/;

// Regex to capture the CREW_MEMBERS object in the shared members file
// const CREW_MEMBER_REGEX = /'([\w_]+)':\s*{\s*id:\s*'[\w_]+',\s*name:\s*'[\w_]+',\s*displayName:\s*'([^']+)',\s*role:\s*'([^']+)',[\s\S]+?costTier:\s*'([^']+)',[\s\S]+?expertise:\s*\[([\s\S]+?)\],[\s\S]+?personality:\s*'([^']+)'/g;

type AgentTier = 'free' | 'premium' | 'standard' | 'budget' | 'ultra_budget';

interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  tier: AgentTier;
  icon: string;
}

async function scanForAgents(): Promise<AgentDefinition[]> {
  console.log(`🔍 Scanning codebase for Agents in ${ROOT_DIR}...`);
  
  // Use glob to find all typescript files, ignoring node_modules and build artifacts
  const files = await glob(SEARCH_PATTERN, { 
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    cwd: ROOT_DIR,
    absolute: true
  });

  // Also scan specifically for agent files that might be missed by class regex
  const agentFiles = await glob(AGENT_FILE_PATTERN, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    cwd: ROOT_DIR,
    absolute: true
  });

  const foundAgents: AgentDefinition[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Reset regex state
    AGENT_CLASS_REGEX.lastIndex = 0;
    
    let match;
    while ((match = AGENT_CLASS_REGEX.exec(content)) !== null) {
      const className = match[1];
      
      // Extract static properties from the file content around the class definition
      // Ideally, we'd use a real AST parser, but for now we search near the class match
      // We'll search the next 500 characters for static properties
      const classBodyStart = match.index + match[0].length;
      const searchArea = content.substring(classBodyStart, classBodyStart + 500);
      const roleMatch = STATIC_ROLE_REGEX.exec(searchArea);
      const goalMatch = STATIC_GOAL_REGEX.exec(searchArea);

      // Infer agent details from class name or file context
      // In a real AST parser, we would read static properties or decorators
      const id = className.toLowerCase().replace('agent', '');
      
      // Map to Star Trek roles based on name heuristics (V10 Requirement)
      let role = 'Worker';
      let icon = '🛠';
      let tier: AgentTier = 'free';

      if (id.includes('planner') || id.includes('manager') || id.includes('captain') || (roleMatch && roleMatch[1].toLowerCase().includes('planner'))) {
        role = 'Planner';
        icon = '🧑‍✈️';
        tier = 'premium';
      } else if (id.includes('research') || id.includes('science') || id.includes('retriev') || (roleMatch && roleMatch[1].toLowerCase().includes('science'))) {
        role = 'Retrieval';
        icon = '🧠';
      } else if (id.includes('eval') || id.includes('review') || id.includes('counselor')) {
        role = 'Evaluator';
        icon = '⚖️';
        tier = 'premium';
      }

      // Use extracted role/goal if available, otherwise use inferred
      const finalRole = roleMatch ? roleMatch[1] : role;
      const capabilities = goalMatch ? [goalMatch[1]] : ['detected-via-cli'];

      foundAgents.push({
        id: id,
        name: className,
        role: finalRole,
        capabilities,
        tier,
        icon
      });
      
      console.log(`✅ Found agent: ${className} (${role}) in ${path.relative(ROOT_DIR, file)}`);
    }

    // If scanning an explicit agent file and no class match was found, try to infer from filename
    if (match === null && agentFiles.includes(file)) {
        const filename = path.basename(file, '.ts');
        // Simple heuristic: if filename looks like an agent (e.g. 'search-agent'), treat as one
        if (filename.includes('agent')) {
             const id = filename.replace(/-agent|agent-/g, '');
             const className = id.charAt(0).toUpperCase() + id.slice(1) + 'Agent'; // Synthesize name
             
             let role = 'Worker';
             let icon = '🛠';
             let tier: AgentTier = 'free';

             if (id.includes('planner') || id.includes('manager') || id.includes('captain')) {
                role = 'Planner';
                icon = '🧑‍✈️';
                tier = 'premium';
             }

             foundAgents.push({
                id: id,
                name: className,
                role,
                capabilities: ['detected-via-filename'],
                tier,
                icon
             });
             console.log(`✅ Found implicit agent from file: ${className} (${role}) in ${path.relative(ROOT_DIR, file)}`);
        }
    }
  }

  // Scan the shared crew-coordination members file
  if (fs.existsSync(CREW_MEMBERS_FILE)) {
    console.log(`🔍 Scanning shared crew members from ${path.relative(ROOT_DIR, CREW_MEMBERS_FILE)}...`);
    const content = fs.readFileSync(CREW_MEMBERS_FILE, 'utf-8');
    
    // We use a simplified regex approach to extract data from the object literal
    // A real AST parser would be better, but sticking to the script's pattern:
    let match;
    // Reset regex just in case
    // Using a simpler extraction loop because the previous comprehensive regex is fragile
    // We'll look for the object keys and extract minimal needed info
    // Actually, since we are in a node script, let's try to simple extraction or manual parsing of the known structure
    
    // Let's use a robust regex that matches the structure we see in members.ts
    const memberBlockRegex = /'([\w_]+)':\s*{([^}]+)}/g;
    
    while ((match = memberBlockRegex.exec(content)) !== null) {
        const id = match[1];
        const body = match[2];
        
        const roleMatch = /role:\s*'([^']+)'/.exec(body);
        const displayNameMatch = /displayName:\s*'([^']+)'/.exec(body);
        const tierMatch = /costTier:\s*'([^']+)'/.exec(body);
        
        if (roleMatch && displayNameMatch) {
            const role = roleMatch[1];
            const name = displayNameMatch[1];
            const rawTier = tierMatch ? tierMatch[1] : 'standard';
            
            // Validate and cast the tier
            let mappedTier: AgentTier = 'standard';
            if (rawTier === 'premium' || rawTier === 'free' || rawTier === 'budget' || rawTier === 'ultra_budget' || rawTier === 'standard') {
                mappedTier = rawTier as AgentTier;
            } else {
                // Fallback for unknown tiers
                if (rawTier === 'budget' || rawTier.includes('budget')) mappedTier = 'budget';
                else mappedTier = 'standard';
            }
            
            // Determine icon based on role (simple mapping)
            let icon = '🤖';
            if (role.includes('leadership') || role.includes('strategic')) icon = '🧑‍✈️';
            else if (role.includes('analytics') || role.includes('health')) icon = '🧠';
            else if (role.includes('execution') || role.includes('infrastructure') || role.includes('pragmatic')) icon = '🛠';
            else if (role.includes('security') || role.includes('compliance')) icon = '🛡';
            else if (role.includes('communications') || role.includes('experience')) icon = '📡';
            else if (role.includes('business')) icon = '💰';

            // Check if already added (avoid duplicates if file was scanned as TS)
            if (!foundAgents.find(a => a.id === id)) {
                foundAgents.push({
                    id,
                    name,
                    role: role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), // Capitalize
                    capabilities: ['shared-crew-member'], // Could parse expertise if needed
                    tier: mappedTier,
                    icon
                });
                console.log(`✅ Found shared crew member: ${name} (${role})`);
            }
        }
    }
  }

  return foundAgents;
}

function generateRegistryFile(agents: AgentDefinition[]) {
  const fileContent = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated by scripts/generate-agent-registry.ts
 */

export interface AgentProfile {
  id: string;
  role: string;
  capabilities: string[];
  tier: 'free' | 'premium' | 'standard' | 'budget' | 'ultra_budget';
  icon: string;
}

export const SYSTEM_AGENTS: AgentProfile[] = ${JSON.stringify(agents, null, 2)};

export function getAgentById(id: string) {
  return SYSTEM_AGENTS.find(a => a.id === id);
}

export function getAgentsByRole(role: string) {
  return SYSTEM_AGENTS.filter(a => a.role === role);
}
`;

  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, fileContent);
  console.log(`🚀 Registry generated at: ${OUTPUT_FILE}`);
}

async function main() {
  const agents = await scanForAgents();
  
  // Ensure we keep the core V10 agents if not found (they might be virtual/mocks right now)
  // Merging logic could be added here, but for now we'll just regenerate based on scan.
  // If the scan finds nothing (because classes don't exist yet), we could inject defaults.
  
  if (agents.length === 0) {
      console.warn("⚠️ No Agent classes found in scan. Generating with V10 defaults.");
      // Fallback to defaults if scan is empty (bootstrapping phase)
      const defaults: AgentDefinition[] = [
          { id: 'captain-picard', name: 'CaptainPicard', role: 'Planner', capabilities: ['strategy'], tier: 'premium', icon: '🧑‍✈️' },
          { id: 'science-officer', name: 'ScienceOfficer', role: 'Retrieval', capabilities: ['rag'], tier: 'free', icon: '🧠' },
          { id: 'engineer-laforge', name: 'EngineerLaForge', role: 'Worker', capabilities: ['execution'], tier: 'free', icon: '🛠' },
          { id: 'counselor-troi', name: 'CounselorTroi', role: 'Evaluator', capabilities: ['review'], tier: 'premium', icon: '⚖️' }
      ];
      generateRegistryFile(defaults);
  } else {
      generateRegistryFile(agents);
  }
}

main().catch(console.error);