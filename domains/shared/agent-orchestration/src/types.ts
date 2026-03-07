/**
 * Agent Orchestration System Types
 *
 * Defines interfaces for multi-agent conflict resolution
 * using Star Trek TNG observation lounge pattern
 */

/**
 * Base problem definition
 */
export interface Problem {
  id: string
  title: string
  description: string
  constraints: Constraint[]
  successCriteria: string[]
  createdAt: Date
  createdBy: string  // Usually 'Captain' (Strategic Leadership)
  projectId: string
}

/**
 * Constraint on the problem
 */
export interface Constraint {
  name: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  measurable: boolean
  value?: string | number
}

/**
 * Crew member recommendation for solving a problem
 */
export interface Recommendation {
  id: string
  agentId: string
  agentName: string
  agentRole: CrewRole
  agentPersona: TngPersona
  problem: Problem
  recommendation: string
  rationale: string
  estimatedImpact: Record<string, number | string>  // e.g., { cost: -300, compliance: 'maintained' }
  confidence: number  // 0-1, higher = more confident
  risks: Risk[]
  benefits: string[]
  submittedAt: Date
}

/**
 * Risk assessment
 */
export interface Risk {
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  mitigation?: string
}

/**
 * Conflict analysis between recommendations
 */
export interface ConflictAnalysis {
  sessionId: string
  conflicts: Conflict[]
  synergies: Synergy[]
  resolutionStrategy: 'weighted-average' | 'synthesis' | 'tradeoff' | 'constraint-satisfaction'
  analysisConfidence: number
}

/**
 * Detected conflict between two recommendations
 */
export interface Conflict {
  id: string
  agent1: { id: string; name: string; role: CrewRole }
  agent2: { id: string; name: string; role: CrewRole }
  conflictType: 'direct-contradiction' | 'indirect-conflict' | 'resource-tradeoff' | 'priority-conflict'
  severity: number  // 0-1
  description: string
  affectedConstraints: string[]
}

/**
 * Synergy between compatible recommendations
 */
export interface Synergy {
  agent1: { id: string; name: string; role: CrewRole }
  agent2: { id: string; name: string; role: CrewRole }
  synergyType: 'compatible' | 'synergistic' | 'complementary' | 'orthogonal'
  description: string
  combinedImpact: Record<string, number | string>
}

/**
 * Synthesized solution that resolves all conflicts
 */
export interface SynthesizedSolution {
  id: string
  sessionId: string
  problem: Problem
  solution: string
  approach: string  // How to implement
  rationale: string  // Why this resolves conflicts
  addressedConflicts: string[]  // IDs of conflicts this resolves
  leveragedSynergies: string[]  // Synergies used in synthesis
  expectedOutcomes: Record<string, number | string>
  implementationPlan: ImplementationPlan[]
  riskMitigation: RiskMitigation[]
  synthesisConfidence: number  // 0-1, based on conflict resolution
  approvedBy: string  // Usually 'Captain'
  approvedAt: Date
}

/**
 * Implementation plan for solution across DDD domains
 */
export interface ImplementationPlan {
  domain: DddDomain
  tasks: Task[]
  ownerRole: CrewRole
  estimatedDuration: number  // hours
  dependencies: string[]  // Other domain tasks this depends on
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
}

/**
 * Individual task within implementation
 */
export interface Task {
  id: string
  description: string
  assignedTo: string  // Crew member ID
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
  estimatedHours: number
  completedAt?: Date
  result?: TaskResult
}

/**
 * Result of completed task
 */
export interface TaskResult {
  success: boolean
  output: unknown
  metrics: Record<string, number | string>
  errors?: string[]
  evidence: string  // Reference to verification data
}

/**
 * Risk mitigation strategy
 */
export interface RiskMitigation {
  risk: string
  mitigation: string
  owner: CrewRole
  verificationMethod: string
  completed: boolean
}

/**
 * Observation Lounge meeting session
 */
export interface ObservationLoungeMeeting {
  sessionId: string
  problem: Problem
  phase: 'definition' | 'recommendations' | 'conflict-detection' | 'synthesis' | 'execution' | 'completed'
  facilitator: { id: string; name: string; role: 'tactical-execution' }  // Riker
  attendees: { id: string; name: string; role: CrewRole }[]
  recommendations: Recommendation[]
  conflictAnalysis?: ConflictAnalysis
  synthesizedSolution?: SynthesizedSolution
  executionResults?: ExecutionResult[]
  startedAt: Date
  completedAt?: Date
  findings: string[]  // Learning captured during meeting
}

/**
 * Execution result from DDD domain
 */
export interface ExecutionResult {
  domain: DddDomain
  domainAgent: { id: string; name: string; role: CrewRole }
  tasks: TaskResult[]
  overallSuccess: boolean
  metrics: Record<string, number | string>
  duration: number  // milliseconds
  errors: string[]
  recommendations: string[]  // What could improve next time
}

/**
 * Crew member roles (mapped to creqw roles in existing system)
 */
export type CrewRole =
  | 'strategic-leadership'  // Picard
  | 'tactical-execution'    // Riker
  | 'pragmatic-solutions'   // Data
  | 'security-compliance'   // Worf
  | 'user-experience'       // Troi
  | 'infrastructure'        // Geordi
  | 'system-health'         // Crusher
  | 'data-analytics'        // Supporting role
  | 'business-intelligence' // Supporting role
  | 'communications'        // Supporting role

/**
 * Star Trek TNG character personas
 */
export type TngPersona =
  | 'Picard'    // Strategic Leadership
  | 'Riker'     // Tactical Execution
  | 'Data'      // Pragmatic Solutions
  | 'Worf'      // Security/Compliance
  | 'Troi'      // User Experience
  | 'Geordi'    // Infrastructure
  | 'Crusher'   // System Health

/**
 * DDD domain names
 */
export type DddDomain =
  | 'shared'
  | 'alex-ai-universal'
  | 'product-factory'
  | 'test-projects'
  | 'vscode-extension'

/**
 * Base agent interface
 */
export interface Agent {
  id: string
  name: string
  role: CrewRole
  persona: TngPersona
  expertise: string[]
  decisionStyle: DecisionStyle

  // Core methods
  recommend(problem: Problem): Promise<Recommendation>
  synthesizeConflict(rec1: Recommendation, rec2: Recommendation): Promise<SynthesizedSolution>
  assessFeasibility(solution: SynthesizedSolution): Promise<FeasibilityAssessment>
  execute(plan: ImplementationPlan): Promise<ExecutionResult>
  assessImpact(solution: SynthesizedSolution): Promise<ImpactAssessment>
}

/**
 * Decision-making style
 */
export interface DecisionStyle {
  type: 'logical' | 'intuitive' | 'conservative' | 'pragmatic' | 'empathetic'
  speedVsAccuracy: 'fast' | 'balanced' | 'thorough'
  riskTolerance: 'risk-seeking' | 'balanced' | 'risk-averse'
}

/**
 * Feasibility assessment
 */
export interface FeasibilityAssessment {
  feasible: boolean
  confidence: number
  timelineEstimate: number  // hours
  resourcesNeeded: string[]
  blockers: string[]
  alternativeApproaches: string[]
}

/**
 * Impact assessment
 */
export interface ImpactAssessment {
  stakeholders: string[]
  emotionalImpact: 'positive' | 'neutral' | 'negative'
  adoptionLikelihood: number  // 0-1
  hiddenConcerns: string[]
  suggestions: string[]
}

/**
 * Project bootstrap configuration
 */
export interface ProjectBootstrapConfig {
  name: string
  type: 'domain' | 'app' | 'service' | 'library'
  description: string
  parentDomain?: string  // For domains/ projects
  crewRoles: CrewRole[]
  initialTasks?: string[]
}

/**
 * Project created by bootstrap
 */
export interface BootstrappedProject {
  id: string
  name: string
  path: string
  type: 'domain' | 'app' | 'service' | 'library'
  crewRoles: CrewRole[]
  ready: boolean
  observationLoungeProjectId: string
  nextSteps: string[]
}

export interface ToolResult { output: any; error?: string; }
