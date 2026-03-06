# Agent Orchestration System

**Multi-Agent Conflict Resolution using Star Trek TNG Observation Lounge Pattern**

## Overview

This system enables AI agents with different specializations to:
1. Provide recommendations from their expertise perspective
2. Automatically detect conflicts in their recommendations
3. Hold structured "observation lounge meetings" to synthesize solutions
4. Execute solutions autonomously across the DDD architecture
5. Learn from experience through shared agent memory

## The Star Trek TNG Model

```
Problem Definition (Captain Picard)
         ↓
Agent Recommendations (specialized crew)
         ↓
Conflict Detection
         ↓
Observation Lounge Meeting (Commander Riker facilitates)
         ↓
Synthesized Solution (addresses all perspectives)
         ↓
Autonomous Execution (across DDD domains)
         ↓
Shared Memory Update (organizational learning)
```

## Seven Crew Agents

### 1. **Data Agent** (Pragmatic Solutions)
- **Style**: Logical, mathematical, thorough
- **Expertise**: Analysis, optimization, algorithms
- **Recommends**: Data-driven solutions with metrics
- **Conflicts**: May miss human factors

### 2. **Worf Agent** (Security & Compliance)
- **Style**: Conservative, risk-averse, principled
- **Expertise**: Security, governance, risk management
- **Recommends**: Safest approach with audit trail
- **Conflicts**: May limit innovation

### 3. **Troi Agent** (User Experience)
- **Style**: Intuitive, empathetic, relational
- **Expertise**: Human factors, psychology, communication
- **Recommends**: Solutions with high adoption
- **Conflicts**: May lack data backing

### 4. **Geordi Agent** (Infrastructure)
- **Style**: Pragmatic, hands-on, solution-focused
- **Expertise**: Systems, engineering, implementation
- **Recommends**: Practical, feasible approaches
- **Conflicts**: May prioritize expediency

### 5. **Captain Agent** (Strategic Leadership)
- **Role**: Problem definition and final authority
- **Sets**: Strategic direction and success criteria
- **Approves**: Final synthesized solutions

### 6. **Riker Agent** (Tactical Execution)
- **Role**: Meeting facilitation and execution coordination
- **Organizes**: Optimal crew for each problem
- **Coordinates**: Implementation across domains

### 7. **Crusher Agent** (System Health)
- **Role**: Holistic system well-being
- **Diagnoses**: Root causes and system health
- **Prevents**: Future problems

## Usage

### Define a Problem

```typescript
import { CaptainAgent, DataAgent, WorfAgent, TroiAgent, GeordiAgent } from '@openrouter-crew/agent-orchestration'

const problem: Problem = {
  id: 'prob_001',
  title: 'Reduce costs while maintaining quality',
  description: 'Monthly API costs are $2000. Need to cut by 30% without compromising user experience or security.',
  constraints: [
    { name: 'security', description: 'Maintain SOC 2 compliance', priority: 'critical' },
    { name: 'quality', description: 'Model accuracy > 95%', priority: 'high' },
    { name: 'cost', description: 'Target < $1400/month', priority: 'high' }
  ],
  successCriteria: [
    'Cost reduced to $1400/month or less',
    'Accuracy maintained above 95%',
    'Zero security incidents',
    'User satisfaction > 90%'
  ],
  createdAt: new Date(),
  createdBy: 'captain',
  projectId: 'proj_001'
}
```

### Get Agent Recommendations

```typescript
const agents = [
  new DataAgent(),
  new WorfAgent(),
  new TroiAgent(),
  new GeordiAgent()
]

const recommendations = await Promise.all(
  agents.map(agent => agent.recommend(problem))
)

// Result:
// Data: "Switch to Haiku tier - saves $300/week"
// Worf: "Keep current tier - compliance risk with downgrade"
// Troi: "Hybrid approach - Haiku for simple, Sonnet for complex"
// Geordi: "Implement caching + optimize routing - saves $250/week"
```

### Detect Conflicts

```typescript
import ConflictDetector from '@openrouter-crew/agent-orchestration'

const detector = new ConflictDetector()
const analysis = await detector.analyzeRecommendations(recommendations)

console.log(analysis.conflicts)
// [
//   {
//     agent1: Data,
//     agent2: Worf,
//     conflictType: 'direct-contradiction',
//     severity: 0.89,
//     description: 'Data wants to reduce tier, Worf says maintain'
//   }
// ]

console.log(analysis.synergies)
// [
//   {
//     agent1: Troi,
//     agent2: Geordi,
//     synergyType: 'synergistic',
//     description: 'Both approaches achieve cost savings without quality loss'
//   }
// ]
```

### Run Observation Lounge Meeting

```typescript
import ObservationLoungeMeetingCoordinator from '@openrouter-crew/agent-orchestration'

const coordinator = new ObservationLoungeMeetingCoordinator()
const synthesis = await coordinator.facilitateMeeting(
  problem,
  recommendations,
  analysis
)

// Result:
// "Smart routing by complexity + caching layer"
// - Haiku for simple tasks (documented + compliant)
// - Sonnet for complex (justified by need)
// - Caching layer handles repeated queries
// - Combined savings: $350/week
// - Accuracy: 98% (exceeds 95% requirement)
// - Compliance: Verified
```

### Execute Solution

```typescript
const executor = new ExecutionCoordinator()
const result = await executor.executeAcrossDDD(
  synthesis.solution,
  ddArchitecture
)

// Executes in parallel across:
// - domains/shared/cost-tracking/
// - domains/shared/security-compliance/
// - domains/shared/infrastructure/
// - domains/shared/ui-components/
// - domains/shared/system-health/
```

### Update Shared Memory

```typescript
// Automatically stored in observation lounge as learning
// "When cost vs compliance conflicts arise, synthesize via:
//  - Smart routing by complexity
//  - Caching layers
//  - Compliance-first verification
//  → Result: $350/week saved, 0% risk increase"

// Future similar conflicts reference this solution
```

## Integration Points

### With Existing Systems

1. **Agent Memory**: Store conflict resolutions + synthesis patterns
2. **Crew Coordination**: Use crew member types + roles
3. **Observation Lounge**: Submit findings + access shared memory
4. **DDD Architecture**: Coordinate execution across all domains

### Workflow in Other Projects

```typescript
// In any domain that needs to make complex decisions:

import { AgentOrchestrator } from '@openrouter-crew/agent-orchestration'

const orchestrator = new AgentOrchestrator({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY
})

// Analyze problem with multiple perspectives
const solution = await orchestrator.orchestrate({
  problem: 'How should we implement feature X?',
  domainContext: 'product-factory',
  constraints: ['budget: $500', 'timeline: 2 weeks'],
  affectedRoles: ['user-experience', 'infrastructure', 'pragmatic-solutions']
})

// Returns synthesized, conflict-resolved solution
// Also updates organizational memory for future decisions
```

## Project Bootstrap

### Quick Create New Projects

```bash
pnpm new:project \
  --name "feature-name" \
  --type "domain" \
  --crew "data-analytics,pragmatic-solutions" \
  --description "What this project does"

# Creates:
# ✅ domains/shared/feature-name/
# ✅ src/ structure with types, services, hooks
# ✅ tsconfig.json configured
# ✅ package.json with dependencies
# ✅ Crew roles assigned
# ✅ Observation lounge initialized
# ✅ Ready for pnpm dev
```

### Project Templates

Templates are located in `scripts/templates/`:
- `domain/` - Library/shared domain template
- `app/` - Next.js application template
- `service/` - TypeScript service template

## Configuration

### Environment Variables

```bash
# For agent orchestration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key

# For observation lounge integration
OBSERVATION_LOUNGE_PROJECT_ID=proj_your_project

# Optional: Logging
AGENT_ORCHESTRATION_LOG_LEVEL=debug
```

### Customizing Agent Personas

Create your own agent by extending `BaseAgent`:

```typescript
export class CustomAgent extends BaseAgent {
  id = 'agent_custom'
  name = 'Your Agent Name'
  role = 'your-role' as CrewRole
  persona = 'YourPersona' as TngPersona
  expertise = ['expertise1', 'expertise2']
  decisionStyle = {
    type: 'your-style',
    speedVsAccuracy: 'balanced',
    riskTolerance: 'balanced'
  }

  async recommend(problem: Problem): Promise<Recommendation> {
    // Your custom logic
  }

  // Implement other abstract methods...
}
```

## Architecture Decisions

### Why Observation Lounge Pattern?

1. **Structured Conflict Resolution**: Formal meeting prevents agent deadlock
2. **Human Authority**: Captain (Strategic Leadership) retains final approval
3. **Organizational Learning**: Each resolution becomes institutional knowledge
4. **Parallel Execution**: Once synthesized, domains execute independently
5. **Transparency**: All reasoning captured for audit/review

### Why These Seven Agents?

Mapped to Star Trek TNG crew for **memorable personas** + **proven expertise distribution**:
- **Logic** (Data) + **Intuition** (Troi) = Better decisions
- **Caution** (Worf) + **Innovation** (Geordi) = Risk-balanced choices
- **Authority** (Picard) + **Coordination** (Riker) = Aligned execution

## Testing

```bash
# Type check
pnpm --filter @openrouter-crew/agent-orchestration type-check

# Run tests
pnpm --filter @openrouter-crew/agent-orchestration test

# Build
pnpm --filter @openrouter-crew/agent-orchestration build
```

## Files

```
domains/shared/agent-orchestration/
├── src/
│   ├── types.ts                    # All TypeScript interfaces
│   ├── base-agent.ts               # BaseAgent + TNG agent implementations
│   ├── conflict-detector.ts        # Conflict analysis engine
│   ├── meeting-coordinator.ts      # Facilitates observation lounge meetings
│   ├── execution-coordinator.ts    # Coordinates DDD execution
│   ├── index.ts                    # Exports
│   └── __tests__/
│
├── tsconfig.json
├── package.json
└── README.md (this file)
```

## Next Steps

1. Build the domain: `pnpm --filter @openrouter-crew/agent-orchestration build`
2. Add to root tsconfig.json references
3. Integrate with observation lounge meetings
4. Create project bootstrap script
5. Train crew on conflict resolution protocol

## References

- **AGENT_CONFLICT_RESOLUTION_SYSTEM.md** - Complete system design
- **CREW_DAILY_WORKFLOW.md** - How crew members use findings
- **OBSERVATION_LOUNGE_GUIDE.md** - Shared memory system

---

**"Make it so." - Captain Picard** 🖖
