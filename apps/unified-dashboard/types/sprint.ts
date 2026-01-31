/**
 * Sprint System TypeScript Interfaces
 *
 * Type definitions for the Agile Sprint Management System
 * Matches database schema in supabase/migrations/20251228_create_sprint_system.sql
 */

// ============================================================================
// Enums
// ============================================================================

export interface SprintMetrics {
  idealBurndown: number[];
  actualBurndown: number[];
  averageVelocity: number;
}

export type SprintStatus =
  | "planning" // Sprint being planned
  | "active" // Sprint in progress
  | "completed" // Sprint finished
  | "cancelled"; // Sprint cancelled

export type StoryStatus =
  | "backlog" // Not started
  | "planned" // Planned for sprint
  | "in_progress" // Being worked on
  | "in_review" // In code review
  | "completed" // Completed
  | "blocked" // Blocked by dependency
  | "todo"
  | "review"
  | "done";

export type StoryType =
  | "user_story" // As a [persona], I want [goal]
  | "developer_story" // As a [developer persona], I need [technical goal]
  | "technical_task" // Technical task
  | "bug_fix" // Bug fix
  | "feature"
  | "bug"
  | "tech_debt"
  | "spike"
  | "documentation";

export type PersonaType =
  | "user" // End user persona
  | "developer"; // Developer persona

export type TaskStatus =
  | "todo" // Not started
  | "in_progress" // Being worked on
  | "done" // Completed
  | "completed"; // Alias for done

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Sprint
 * Represents a time-boxed iteration (typically 2 weeks)
 */
export interface Sprint {
  id: string; // UUID
  project_id: string; // Project identifier
  name: string; // "Sprint 23" or "Q1 2025 Sprint 1"
  sprint_number: number; // Sequential number
  start_date: string; // ISO date: "2025-01-15"
  end_date: string; // ISO date: "2025-01-29"
  goals: string[]; // Sprint goals
  status: SprintStatus;
  velocity_target: number; // Planned story points
  velocity_actual: number; // Actual completed story points
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
  // Frontend compatibility fields
  committedPoints?: number;
  completedPoints?: number;
  budgetedCost?: number;
  projectedROI?: number;
  dailyProgress?: number[];
  stories?: Story[];
  duration?: number;
}

/**
 * User/Developer Persona
 * Represents who the story is for
 */
export interface Persona {
  id: string; // UUID
  name: string; // "End User", "Backend Developer"
  type: PersonaType;
  description?: string; // Persona description
  technical_level: number; // 1-10 scale
  goals?: string[]; // What they want to achieve
  pain_points?: string[]; // What frustrates them
  preferred_crew_member?: string; // 'picard', 'riker', 'data', etc.
  created_at?: string;
}

/**
 * Story (User Story or Developer Story)
 * Core unit of work in a sprint
 */
export interface Story {
  id: string; // UUID
  sprint_id?: string; // Optional: can be in backlog
  project_id: string;
  title: string; // "Add dark mode toggle"
  description?: string; // Detailed description
  story_type: StoryType;
  status: StoryStatus;
  persona_id?: string; // Which persona this is for
  assigned_crew_member?: string; // 'picard', 'data', 'troi', etc.
  story_points?: number; // Fibonacci: 1, 2, 3, 5, 8, 13, 21
  priority: number | string; // 1 (highest) to 5 (lowest) or "high", "medium"
  start_date?: string; // ISO date: when work begins
  estimated_completion?: string; // ISO date: estimated completion date
  estimated_hours?: number; // Estimated hours for Riker's timeline
  related_goals?: string[]; // Sprint goals this story addresses
  created_at?: string;
  updated_at?: string;
  // Frontend compatibility fields
  type?: StoryType;
  storyPoints?: number;
  assignedCrew?: any[];
  estimatedCost?: number;
  progress?: number;
  tasks?: Task[];
}

/**
 * Acceptance Criterion
 * Given/When/Then format
 */
export interface AcceptanceCriterion {
  id: string; // UUID
  story_id: string;
  given_clause: string; // "Given I am a logged-in user"
  when_clause: string; // "When I click the dark mode toggle"
  then_clause: string; // "Then the UI switches to dark theme"
  display_order: number; // Order to display (1, 2, 3...)
  is_completed: boolean;
  created_at?: string;
}

/**
 * Task
 * Granular work items within a story
 */
export interface Task {
  id: string; // UUID
  story_id: string;
  title: string; // "Create DarkModeToggle component"
  status: TaskStatus;
  assigned_crew_member?: string; // Can be different from story
  estimated_hours?: number;
  actual_hours?: number;
  created_at?: string;
}

/**
 * Comment
 * Discussion on a story
 */
export interface Comment {
  id: string; // UUID
  story_id: string;
  content: string;
  author: string; // Crew member name or user
  created_at?: string;
}

/**
 * Crew Workload
 * Tracks capacity for each crew member in a sprint
 */
export interface CrewWorkload {
  id: string; // UUID
  crew_member: string; // 'picard', 'riker', 'data', etc.
  sprint_id: string;
  total_story_points: number;
  completed_story_points: number;
  capacity_percentage: number; // 0-100
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Extended Types with Relations
// ============================================================================

/**
 * Story with full details including relations
 */
export interface StoryWithDetails extends Story {
  persona?: Persona;
  acceptance_criteria: AcceptanceCriterion[];
  tasks: Task[];
  comments: Comment[];
}

/**
 * Sprint with stories and workload
 */
export interface SprintWithDetails extends Sprint {
  stories: StoryWithDetails[];
  crew_workload: CrewWorkload[];
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Create Sprint Request
 */
export interface CreateSprintRequest {
  project_id: string;
  name: string;
  sprint_number: number;
  start_date: string;
  end_date: string;
  goals: string[];
  velocity_target?: number;
}

/**
 * Create Story Request
 */
export interface CreateStoryRequest {
  sprint_id?: string;
  project_id: string;
  title: string;
  description?: string;
  story_type: StoryType;
  persona_id?: string;
  story_points?: number;
  priority: number;
  acceptance_criteria?: Omit<
    AcceptanceCriterion,
    "id" | "story_id" | "created_at"
  >[];
}

/**
 * Update Story Request
 */
export interface UpdateStoryRequest {
  title?: string;
  description?: string;
  status?: StoryStatus;
  assigned_crew_member?: string;
  story_points?: number;
  priority?: number;
  sprint_id?: string | null; // null to move to backlog
}

/**
 * Crew Assignment Recommendation
 */
export interface CrewAssignmentRecommendation {
  crew_member: string; // 'data', 'troi', etc.
  crew_member_name: string; // 'Commander Data', etc.
  score: number; // 0-100 assignment score
  reasoning: {
    skill_match: number; // 0-100
    persona_affinity: number; // 0-100
    workload_balance: number; // 0-100
    historical_performance: number; // 0-100
  };
  current_workload: number; // Current story points
  capacity_percentage: number; // 0-100
}

/**
 * Crew Assignment Request
 */
export interface CrewAssignmentRequest {
  story_id: string;
}

/**
 * Crew Assignment Response
 */
export interface CrewAssignmentResponse {
  story: Story;
  recommendations: CrewAssignmentRecommendation[];
  auto_assigned?: string; // Auto-assigned if confidence > 80%
}

/**
 * Sprint Velocity Metrics
 */
export interface SprintVelocityMetrics {
  sprint_id: string;
  velocity_target: number;
  velocity_actual: number;
  velocity_percentage: number; // (actual / target) * 100
  stories_planned: number;
  stories_completed: number;
  completion_rate: number; // (completed / planned) * 100
}

// ============================================================================
// Filter and Query Types
// ============================================================================

/**
 * Sprint Query Filters
 */
export interface SprintFilters {
  project_id?: string;
  status?: SprintStatus | SprintStatus[];
  start_date_after?: string;
  start_date_before?: string;
  limit?: number;
  offset?: number;
}

/**
 * Story Query Filters
 */
export interface StoryFilters {
  project_id?: string;
  sprint_id?: string | "backlog"; // 'backlog' for unassigned stories
  status?: StoryStatus | StoryStatus[];
  story_type?: StoryType | StoryType[];
  assigned_crew_member?: string;
  persona_id?: string;
  priority?: number | number[];
  limit?: number;
  offset?: number;
}

// ============================================================================
// Crew Member Types
// ============================================================================

/**
 * Valid crew member identifiers
 */
export type CrewMember =
  | "picard" // Captain - Strategy & Leadership
  | "riker" // Commander - Execution & Coordination
  | "data" // Lt. Commander - AI/ML & Data Science
  | "la_forge" // Chief Engineer - Infrastructure & DevOps
  | "troi" // Counselor - UX/UI & User Experience
  | "worf" // Security - Security & Testing
  | "crusher" // Doctor - Performance & Health
  | "uhura" // Communications - APIs & Integration
  | "quark" // Entrepreneur - Business & ROI
  | "obrien"; // Chief - Implementation & Maintenance

/**
 * Crew Member Info
 */
export interface CrewMemberInfo {
  id: CrewMember;
  name: string;
  role: string;
  specialty: string;
  avatar?: string;
}

/**
 * Crew member definitions
 */
export const CREW_MEMBERS: Record<CrewMember, CrewMemberInfo> = {
  picard: {
    id: "picard",
    name: "Captain Picard",
    role: "Captain",
    specialty: "Strategy & Leadership",
  },
  riker: {
    id: "riker",
    name: "Commander Riker",
    role: "First Officer",
    specialty: "Execution & Coordination",
  },
  data: {
    id: "data",
    name: "Commander Data",
    role: "Operations Officer",
    specialty: "AI/ML & Data Science",
  },
  la_forge: {
    id: "la_forge",
    name: "Geordi La Forge",
    role: "Chief Engineer",
    specialty: "Infrastructure & DevOps",
  },
  troi: {
    id: "troi",
    name: "Counselor Troi",
    role: "Ship Counselor",
    specialty: "UX/UI & User Experience",
  },
  worf: {
    id: "worf",
    name: "Lieutenant Worf",
    role: "Security Chief",
    specialty: "Security & Testing",
  },
  crusher: {
    id: "crusher",
    name: "Doctor Crusher",
    role: "Chief Medical Officer",
    specialty: "Performance & Health",
  },
  uhura: {
    id: "uhura",
    name: "Lieutenant Uhura",
    role: "Communications Officer",
    specialty: "APIs & Integration",
  },
  quark: {
    id: "quark",
    name: "Quark",
    role: "Entrepreneur",
    specialty: "Business & ROI",
  },
  obrien: {
    id: "obrien",
    name: "Chief O'Brien",
    role: "Chief Engineer",
    specialty: "Implementation & Maintenance",
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export const getStoryStatusColor = (status: StoryStatus): string => {
  switch (status) {
    case "done":
    case "completed":
      return "#10b981"; // green
    case "in_progress":
    case "active" as StoryStatus: // Explicitly cast "active" to StoryStatus
      return "#3b82f6"; // blue
    case "review":
    case "in_review":
      return "#f59e0b"; // yellow/orange
    case "blocked":
      return "#ef4444"; // red
    case "todo":
    case "planned":
      return "#6366f1"; // indigo
    case "backlog":
    default:
      return "#6b7280"; // gray
  }
};

export const getPriorityColor = (priority: string | number): string => {
  const p = String(priority).toLowerCase();
  if (p === "critical" || p === "1") return "#ef4444";
  if (p === "high" || p === "2") return "#f97316";
  if (p === "medium" || p === "3") return "#eab308";
  return "#94a3b8"; // low/gray
};

export const getStoryTypeIcon = (type: string): string => {
  switch (type) {
    case "feature":
      return "✨";
    case "bug":
      return "🐛";
    case "tech_debt":
      return "🔧";
    case "spike":
      return "🔬";
    case "documentation":
      return "📚";
    default:
      return "📋";
  }
};

export const getPriorityValue = (priority: string | number): number => {
  if (typeof priority === "number") return priority;
  const p = String(priority).toLowerCase();
  if (p === "critical" || p === "1") return 1;
  if (p === "high" || p === "2") return 2;
  if (p === "medium" || p === "3") return 3;
  if (p === "low" || p === "4") return 4;
  return 5; // lowest/default
};

/**
 * Result from story estimation utilities
 */
export interface EstimationResult {
  estimatedHours: number;
  estimatedCost: number;
  recommendation: string;
  roiScore: number;
  estimatedBy?: string;
}

/**
 * Calculate ROI score for a story safely handling string/number priorities
 * Formula: (Inverse Priority / Points) * 100
 */
export const calculateStoryROI = (
  priority: string | number,
  points: number = 1,
): number => {
  const priorityVal = getPriorityValue(priority);
  const safePoints = points || 1; // Avoid division by zero
  return ((6 - priorityVal) / safePoints) * 100;
};

export const isHighPriority = (priority: string | number): boolean => {
  if (!priority) {
    return false;
  }
  const p = String(priority).toLowerCase();
  return p === "critical" || p === "1" || p === "high" || p === "2";
};
