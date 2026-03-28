export interface ProjectComponent {
  id: string;
  title: string;
  body?: string;
  type: string;
  status: string;
  description?: string;
}

export interface ProjectContent {
  headline?: string;
  subheadline?: string;
  description?: string;
  theme?: string;
  components?: ProjectComponent[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status?: 'active' | 'archived' | 'draft';
  createdAt?: string;
  updatedAt?: string;
  headline?: string;
  subheadline?: string;
  theme?: string;
  components?: ProjectComponent[];
  [key: string]: any;
}
