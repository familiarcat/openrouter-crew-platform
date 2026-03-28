export type SprintStatus = 'planning' | 'active' | 'completed' | 'archived';
export type StoryType = 'feature' | 'bug' | 'chore' | 'spike';
export type StoryStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Story {
  id: string;
  title: string;
  description?: string;
  type: StoryType;
  status: StoryStatus;
  points?: number;
  priority?: Priority;
  assigneeId?: string;
  estimatedDuration?: number; // hours
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  goal?: string;
  stories: Story[];
}