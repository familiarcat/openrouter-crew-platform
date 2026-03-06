-- Sprint Management System Tables
-- Created: March 2, 2026
-- Purpose: Enable project sprint planning, story management, and velocity tracking

-- ============================================================================
-- TABLE: sprints
-- ============================================================================
CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sprint_number INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goals TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  velocity_target INT DEFAULT 0,
  velocity_actual INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes for common queries
  UNIQUE(project_id, sprint_number),
  INDEX idx_sprints_project_id (project_id),
  INDEX idx_sprints_status (status),
  INDEX idx_sprints_dates (start_date, end_date)
);

-- ============================================================================
-- TABLE: stories
-- ============================================================================
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  story_type TEXT NOT NULL DEFAULT 'feature' CHECK (story_type IN (
    'user_story', 'developer_story', 'technical_task', 'bug_fix',
    'feature', 'bug', 'tech_debt', 'spike', 'documentation'
  )),
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN (
    'backlog', 'planned', 'in_progress', 'in_review', 'completed', 'blocked', 'todo', 'review', 'done'
  )),
  priority INT DEFAULT 3,
  story_points INT,
  assigned_crew_member TEXT,
  estimated_hours NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes for common queries
  INDEX idx_stories_project_id (project_id),
  INDEX idx_stories_sprint_id (sprint_id),
  INDEX idx_stories_status (status),
  INDEX idx_stories_assigned (assigned_crew_member)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Select: Anyone can view sprints
CREATE POLICY "sprints_select" ON sprints
  FOR SELECT USING (true);

-- Select: Anyone can view stories
CREATE POLICY "stories_select" ON stories
  FOR SELECT USING (true);

-- Insert: Authenticated users can create sprints for projects they own
CREATE POLICY "sprints_insert" ON sprints
  FOR INSERT WITH CHECK (
    auth.uid()::TEXT = (
      SELECT owner_id FROM projects WHERE id = sprints.project_id
    ) OR EXISTS (
      SELECT 1 FROM projects
      WHERE id = sprints.project_id
      AND team_members @> ARRAY[auth.uid()::TEXT]
    )
  );

-- Insert: Authenticated users can create stories for projects they own
CREATE POLICY "stories_insert" ON stories
  FOR INSERT WITH CHECK (
    auth.uid()::TEXT = (
      SELECT owner_id FROM projects WHERE id = stories.project_id
    ) OR EXISTS (
      SELECT 1 FROM projects
      WHERE id = stories.project_id
      AND team_members @> ARRAY[auth.uid()::TEXT]
    )
  );

-- Update: Project owners and team members can update sprints
CREATE POLICY "sprints_update" ON sprints
  FOR UPDATE USING (
    auth.uid()::TEXT = (
      SELECT owner_id FROM projects WHERE id = sprints.project_id
    ) OR EXISTS (
      SELECT 1 FROM projects
      WHERE id = sprints.project_id
      AND team_members @> ARRAY[auth.uid()::TEXT]
    )
  );

-- Update: Project owners and team members can update stories
CREATE POLICY "stories_update" ON stories
  FOR UPDATE USING (
    auth.uid()::TEXT = (
      SELECT owner_id FROM projects WHERE id = stories.project_id
    ) OR EXISTS (
      SELECT 1 FROM projects
      WHERE id = stories.project_id
      AND team_members @> ARRAY[auth.uid()::TEXT]
    )
  );

-- Delete: Project owners can delete sprints
CREATE POLICY "sprints_delete" ON sprints
  FOR DELETE USING (
    auth.uid()::TEXT = (
      SELECT owner_id FROM projects WHERE id = sprints.project_id
    )
  );

-- Delete: Project owners can delete stories
CREATE POLICY "stories_delete" ON stories
  FOR DELETE USING (
    auth.uid()::TEXT = (
      SELECT owner_id FROM projects WHERE id = stories.project_id
    )
  );

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_sprints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sprints_updated_at_trigger
  BEFORE UPDATE ON sprints
  FOR EACH ROW
  EXECUTE FUNCTION update_sprints_updated_at();

CREATE TRIGGER stories_updated_at_trigger
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_stories_updated_at();

-- ============================================================================
-- COMMENTS: For documentation
-- ============================================================================
COMMENT ON TABLE sprints IS 'Sprint planning and execution container. Each sprint has a duration (start_date to end_date) and tracks goal completion via story management.';
COMMENT ON TABLE stories IS 'Individual work items within a sprint. Tracks story points, status, assigned crew member, and estimation hours.';
COMMENT ON COLUMN sprints.velocity_target IS 'Target story points for this sprint (used for capacity planning).';
COMMENT ON COLUMN sprints.velocity_actual IS 'Actual story points completed in this sprint (calculated from completed stories).';
COMMENT ON COLUMN stories.assigned_crew_member IS 'Name of the crew member (AI agent) assigned to complete this story. References crew_members.name.';
COMMENT ON COLUMN stories.estimated_hours IS 'Human estimate of effort required to complete this story.';
