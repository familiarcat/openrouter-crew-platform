export interface ProjectComponent {
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status?: 'active' | 'archived' | 'draft';
  createdAt?: string;
  updatedAt?: string;
  components?: ProjectComponent[];
  [key: string]: any;
}
