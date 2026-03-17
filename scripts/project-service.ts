import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class ProjectService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async createProject(name: string): Promise<{ id: string; name: string }> {
    const { data, error } = await this.supabase
      .from('projects')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getProject(id: string): Promise<{ id: string; name: string; status: string | null; budget: number | null; created_at: string }> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getProjects(): Promise<{ id: string; name: string; status: string | null; budget: number | null }[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('id, name, status, budget')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSprints(projectId: string): Promise<{ id: string; name: string; status: string; start_date: string; end_date: string; goal: string | null }[]> {
    const { data, error } = await this.supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateProject(projectId: string, updates: { name?: string; budget?: number }): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }
  }

  async archiveProject(projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .update({ status: 'archived' })
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to archive project: ${error.message}`);
    }
  }

  async restoreProject(projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .update({ status: 'active' })
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to restore project: ${error.message}`);
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  async setBudget(projectId: string, amount: number): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .update({ budget: amount })
      .eq('id', projectId);

    if (error) throw error;
  }

  async createSprint(
    projectId: string,
    name: string,
    goal: string,
    durationDays: number
  ): Promise<{ id: string; name: string }> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const { data, error } = await this.supabase
      .from('sprints')
      .insert({
        project_id: projectId,
        name,
        goal,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'planned'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSprint(sprintId: string, updates: { name?: string; goal?: string; status?: string }): Promise<void> {
    const { error } = await this.supabase
      .from('sprints')
      .update(updates)
      .eq('id', sprintId);

    if (error) {
      throw new Error(`Failed to update sprint: ${error.message}`);
    }
  }

  async getStories(sprintId: string): Promise<{ id: string; title: string; status: string; story_points: number | null; priority: number | null }[]> {
    const { data, error } = await this.supabase
      .from('stories')
      .select('*')
      .eq('sprint_id', sprintId)
      .order('priority', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createStory(
    projectId: string,
    title: string,
    storyType: string,
    priority: number,
    sprintId?: string,
    description?: string,
    storyPoints?: number
  ): Promise<{ id: string; title: string }> {
    const { data, error } = await this.supabase
      .from('stories')
      .insert({
        project_id: projectId,
        title,
        story_type: storyType,
        priority,
        sprint_id: sprintId || null,
        description: description || null,
        story_points: storyPoints || null,
        status: 'backlog'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStory(
    storyId: string,
    updates: {
      title?: string;
      description?: string;
      status?: string;
      priority?: number;
      story_points?: number;
      sprint_id?: string;
    }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('stories')
      .update(updates)
      .eq('id', storyId);

    if (error) {
      throw new Error(`Failed to update story: ${error.message}`);
    }
  }
}