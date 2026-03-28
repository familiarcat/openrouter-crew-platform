export type SprintStatus = 'planned' | 'active' | 'completed';
export type StoryStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type StoryPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Story {
  id: string;
  title: string;
  description?: string;
  points: number;
  status: StoryStatus;
  priority: StoryPriority;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  goal?: string;
  stories: Story[];
}