export type SprintStatus = 'planned' | 'active' | 'completed';
export type StoryStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'backlog' | 'in_review' | 'planned';
export type StoryPriority = 'low' | 'medium' | 'high' | 'critical';
export type StoryType = 'user_story' | 'developer_story' | 'technical_task' | 'bug_fix';
export type CrewMember = 'picard' | 'riker' | 'data' | 'la_forge' | 'worf' | 'troi' | 'crusher' | 'uhura' | 'quark' | 'obrien';

export interface Story {
  id: string;
  title: string;
  description?: string;
  points?: number;
  story_points?: number; // Component uses this
  status: StoryStatus;
  priority: StoryPriority;
  story_type: StoryType;
  assigned_crew_member?: CrewMember;
  start_date?: string;
  estimated_completion?: string;
  estimated_hours?: number;
  acceptance_criteria?: { is_completed: boolean }[];
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface StoryWithDetails extends Story {
  // Extended interface for UI components
}

export interface Sprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  startDate?: string; // Legacy support
  endDate?: string;   // Legacy support
  status: SprintStatus;
  goal?: string;
  goals?: string[];
  stories: StoryWithDetails[];
  velocity_actual?: number;
  velocity_target?: number;
}

export const CREW_MEMBERS: Record<CrewMember, { name: string; specialty: string }> = {
  'picard': { name: 'Jean-Luc Picard', specialty: 'Leadership' },
  'riker': { name: 'William Riker', specialty: 'Execution' },
  'data': { name: 'Data', specialty: 'Operations' },
  'la_forge': { name: 'Geordi La Forge', specialty: 'Engineering' },
  'worf': { name: 'Worf', specialty: 'Security' },
  'troi': { name: 'Deanna Troi', specialty: 'User Experience' },
  'crusher': { name: 'Beverly Crusher', specialty: 'Health' },
  'uhura': { name: 'Nyota Uhura', specialty: 'Communications' },
  'quark': { name: 'Quark', specialty: 'Finance' },
  'obrien': { name: 'Miles O\'Brien', specialty: 'Maintenance' }
};

export function getPriorityValue(priority: string | StoryPriority): number {
  switch (priority) {
    case 'critical': return 1;
    case 'high': return 2;
    case 'medium': return 3;
    case 'low': return 4;
    default: return 3;
  }
}

export function isHighPriority(priority: StoryPriority): boolean {
  return priority === 'critical' || priority === 'high';
}

export function calculateStoryROI(story: Story): number {
  return 0; // Placeholder for Quark's logic
}

export interface EstimationResult {
  estimatedHours: number;
  estimatedCost: number;
  recommendation: string;
  roiScore: number;
}
