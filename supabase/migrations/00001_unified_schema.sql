-- ============================================================================
-- UNIFIED SCHEMA FOR MULTI-PROJECT INTEGRATION
-- ============================================================================
-- This migration extends the basic openrouter_usage_events table to support
-- multiple projects (dj-booking, alex-ai-universal, rag-refresh-product-factory)
-- with shared crew members, cost tracking, and workflow orchestration.
--
-- Date: 2026-01-27
-- Purpose: Enable unified dashboard across all OpenRouter-optimized projects
-- ============================================================================

-- ============================================================================
-- CORE TABLES (Shared Across All Projects)
-- ============================================================================

-- Projects table (central registry for all project types)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('dj-booking', 'product-factory', 'ai-assistant', 'custom')),
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),

  -- Ownership (references Supabase auth.users)
  owner_id UUID, -- Will reference auth.users(id) once auth is enabled
  team_members UUID[] DEFAULT '{}',

  -- Configuration
  config JSONB DEFAULT '{}', -- Project-specific config
  metadata JSONB DEFAULT '{}',

  -- Cost tracking
  budget_usd NUMERIC,
  total_cost_usd NUMERIC DEFAULT 0,

  UNIQUE(name)
);

-- Enhanced usage events (extends existing openrouter_usage_events)
-- Note: We keep the original table and add this for compatibility
CREATE TABLE IF NOT EXISTS llm_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Source
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  workflow_id TEXT, -- n8n workflow ID or 'direct-api'
  crew_member TEXT, -- 'captain_picard' | 'commander_data' | etc.

  -- Usage
  provider TEXT NOT NULL CHECK (provider IN ('openrouter', 'anthropic', 'openai', 'gemini')),
  model TEXT NOT NULL,
  input_tokens INT,
  output_tokens INT,
  total_tokens INT,

  -- Cost
  estimated_cost_usd NUMERIC,
  actual_cost_usd NUMERIC,
  routing_mode TEXT CHECK (routing_mode IN ('premium', 'standard', 'budget', 'ultra_budget')),

  -- Context
  request_type TEXT, -- 'crew-coordination' | 'code-generation' | 'sprint-planning' | etc.
  metadata JSONB DEFAULT '{}',

  -- Compatibility with original schema
  workflow TEXT -- Kept for backwards compatibility with openrouter_usage_events
);

-- Crew members (shared definition across all projects)
CREATE TABLE IF NOT EXISTS crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Identity
  name TEXT UNIQUE NOT NULL, -- 'captain_picard'
  display_name TEXT NOT NULL, -- 'Captain Jean-Luc Picard'
  role TEXT NOT NULL, -- 'Strategic Leadership'

  -- Configuration
  default_model TEXT DEFAULT 'anthropic/claude-sonnet-3.5', -- OpenRouter model ID
  cost_tier TEXT DEFAULT 'standard' CHECK (cost_tier IN ('premium', 'standard', 'budget', 'ultra_budget')),
  webhook_url TEXT,

  -- Status
  active BOOLEAN DEFAULT true,
  workload_current INT DEFAULT 0,
  workload_capacity INT DEFAULT 10,

  -- Metadata
  avatar_url TEXT,
  bio TEXT,
  expertise TEXT[] DEFAULT '{}'
);

-- Crew memories (unified across all projects with vector support)
CREATE TABLE IF NOT EXISTS crew_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Source
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  crew_member TEXT NOT NULL,

  -- Content
  memory_type TEXT CHECK (memory_type IN ('observation', 'decision', 'learning', 'context')),
  content TEXT NOT NULL,
  -- Note: Vector extension would need to be enabled: CREATE EXTENSION IF NOT EXISTS vector;
  -- embedding VECTOR(1536), -- For semantic search (uncomment when pgvector is enabled)

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  importance INT DEFAULT 1 CHECK (importance BETWEEN 1 AND 10),
  expires_at TIMESTAMPTZ
);

-- n8n workflows registry
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- n8n metadata
  n8n_workflow_id TEXT UNIQUE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('crew', 'system', 'coordination', 'project-specific', 'subflow')),

  -- Configuration
  webhook_path TEXT,
  active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',

  -- Tracking
  execution_count INT DEFAULT 0,
  total_cost_usd NUMERIC DEFAULT 0,
  last_executed_at TIMESTAMPTZ,

  -- Metadata
  description TEXT,
  tags TEXT[] DEFAULT '{}'
);

-- Workflow executions (for monitoring and debugging)
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Source
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Execution
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'timeout')),
  duration_ms INT,
  error TEXT,

  -- Cost
  tokens_used INT,
  estimated_cost_usd NUMERIC,

  -- Data (limited to avoid bloat)
  input JSONB,
  output JSONB
);

-- ============================================================================
-- PROJECT-SPECIFIC TABLES
-- ============================================================================

-- DJ Booking specific tables
CREATE TABLE IF NOT EXISTS dj_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  venue TEXT,
  type TEXT CHECK (type IN ('club', 'wedding', 'corporate', 'festival', 'private')),
  vibe TEXT,
  payment_amount NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),

  -- Additional metadata
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS dj_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES dj_events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  name TEXT,
  tracks JSONB DEFAULT '[]', -- Array of track objects
  generated_by TEXT, -- crew member name or 'manual'
  metadata JSONB DEFAULT '{}'
);

-- Product Factory specific tables
CREATE TABLE IF NOT EXISTS product_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  sprint_number INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'review', 'completed')),
  velocity INT,
  goals TEXT[] DEFAULT '{}',

  UNIQUE(project_id, sprint_number)
);

CREATE TABLE IF NOT EXISTS product_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID REFERENCES product_sprints(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  title TEXT NOT NULL,
  description TEXT,
  story_type TEXT CHECK (story_type IN ('user_story', 'technical_task', 'bug_fix', 'feature', 'spike')),
  status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
  estimation INT,
  assigned_to UUID, -- references auth.users(id)

  -- Metadata
  acceptance_criteria TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);

-- LLM Usage Events
CREATE INDEX IF NOT EXISTS idx_llm_usage_events_project ON llm_usage_events(project_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_events_created ON llm_usage_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_usage_events_provider ON llm_usage_events(provider, model);
CREATE INDEX IF NOT EXISTS idx_llm_usage_events_crew ON llm_usage_events(crew_member);
CREATE INDEX IF NOT EXISTS idx_llm_usage_events_workflow ON llm_usage_events(workflow_id);

-- Crew Memories
CREATE INDEX IF NOT EXISTS idx_crew_memories_project ON crew_memories(project_id);
CREATE INDEX IF NOT EXISTS idx_crew_memories_member ON crew_memories(crew_member);
CREATE INDEX IF NOT EXISTS idx_crew_memories_type ON crew_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_crew_memories_created ON crew_memories(created_at DESC);

-- Workflows
CREATE INDEX IF NOT EXISTS idx_workflows_type ON workflows(type);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(active);
CREATE INDEX IF NOT EXISTS idx_workflows_n8n_id ON workflows(n8n_workflow_id);

-- Workflow Executions
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_project ON workflow_executions(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created ON workflow_executions(created_at DESC);

-- DJ Events
CREATE INDEX IF NOT EXISTS idx_dj_events_project ON dj_events(project_id);
CREATE INDEX IF NOT EXISTS idx_dj_events_date ON dj_events(date);
CREATE INDEX IF NOT EXISTS idx_dj_events_status ON dj_events(status);

-- Product Sprints
CREATE INDEX IF NOT EXISTS idx_product_sprints_project ON product_sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_product_sprints_status ON product_sprints(status);

-- Product Stories
CREATE INDEX IF NOT EXISTS idx_product_stories_sprint ON product_stories(sprint_id);
CREATE INDEX IF NOT EXISTS idx_product_stories_status ON product_stories(status);
CREATE INDEX IF NOT EXISTS idx_product_stories_assigned ON product_stories(assigned_to);

-- ============================================================================
-- SEED DATA (Crew Members)
-- ============================================================================

INSERT INTO crew_members (name, display_name, role, cost_tier, expertise) VALUES
  ('captain_picard', 'Captain Jean-Luc Picard', 'Strategic Leadership', 'premium', ARRAY['strategy', 'diplomacy', 'leadership']),
  ('commander_data', 'Commander Data', 'Data Analytics & Logic', 'standard', ARRAY['analytics', 'logic', 'computation']),
  ('commander_riker', 'Commander William Riker', 'Tactical Execution', 'standard', ARRAY['tactics', 'execution', 'improvisation']),
  ('counselor_troi', 'Counselor Deanna Troi', 'User Experience & Empathy', 'standard', ARRAY['ux', 'empathy', 'psychology']),
  ('lt_worf', 'Lieutenant Worf', 'Security & Compliance', 'standard', ARRAY['security', 'compliance', 'defense']),
  ('dr_crusher', 'Dr. Beverly Crusher', 'System Health & Diagnostics', 'standard', ARRAY['diagnostics', 'health', 'recovery']),
  ('geordi_la_forge', 'Lt. Cmdr. Geordi La Forge', 'Infrastructure Engineering', 'standard', ARRAY['infrastructure', 'engineering', 'optimization']),
  ('lt_uhura', 'Lieutenant Uhura', 'Communication & Integration', 'standard', ARRAY['communication', 'integration', 'coordination']),
  ('chief_obrien', 'Chief Miles O''Brien', 'Pragmatic Solutions', 'budget', ARRAY['pragmatism', 'maintenance', 'efficiency']),
  ('quark', 'Quark', 'Business Intelligence & ROI', 'budget', ARRAY['business', 'roi', 'cost-optimization'])
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crew_members_updated_at BEFORE UPDATE ON crew_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dj_events_updated_at BEFORE UPDATE ON dj_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_sprints_updated_at BEFORE UPDATE ON product_sprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_stories_updated_at BEFORE UPDATE ON product_stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update project total cost when usage events are added
CREATE OR REPLACE FUNCTION update_project_cost()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET total_cost_usd = (
    SELECT COALESCE(SUM(estimated_cost_usd), 0)
    FROM llm_usage_events
    WHERE project_id = NEW.project_id
  )
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_cost_on_usage AFTER INSERT ON llm_usage_events
  FOR EACH ROW EXECUTE FUNCTION update_project_cost();

-- Function to update workflow execution count and cost
CREATE OR REPLACE FUNCTION update_workflow_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workflows
  SET
    execution_count = execution_count + 1,
    total_cost_usd = total_cost_usd + COALESCE(NEW.estimated_cost_usd, 0),
    last_executed_at = NEW.created_at
  WHERE id = NEW.workflow_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflow_stats_on_execution AFTER INSERT ON workflow_executions
  FOR EACH ROW EXECUTE FUNCTION update_workflow_stats();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Project cost summary
CREATE OR REPLACE VIEW project_cost_summary AS
SELECT
  p.id,
  p.name,
  p.type,
  p.status,
  p.budget_usd,
  COALESCE(SUM(l.estimated_cost_usd), 0) as total_cost_usd,
  COUNT(l.id) as total_requests,
  COALESCE(SUM(l.total_tokens), 0) as total_tokens,
  CASE
    WHEN p.budget_usd IS NOT NULL AND p.budget_usd > 0
    THEN (COALESCE(SUM(l.estimated_cost_usd), 0) / p.budget_usd * 100)
    ELSE NULL
  END as budget_used_percent
FROM projects p
LEFT JOIN llm_usage_events l ON p.id = l.project_id
GROUP BY p.id, p.name, p.type, p.status, p.budget_usd;

-- View: Crew member workload
CREATE OR REPLACE VIEW crew_workload_summary AS
SELECT
  cm.name,
  cm.display_name,
  cm.role,
  cm.cost_tier,
  cm.active,
  COUNT(DISTINCT l.project_id) as projects_served,
  COUNT(l.id) as total_requests,
  COALESCE(SUM(l.estimated_cost_usd), 0) as total_cost_usd,
  COALESCE(SUM(l.total_tokens), 0) as total_tokens
FROM crew_members cm
LEFT JOIN llm_usage_events l ON cm.name = l.crew_member
GROUP BY cm.name, cm.display_name, cm.role, cm.cost_tier, cm.active;

-- View: Recent workflow activity
CREATE OR REPLACE VIEW recent_workflow_activity AS
SELECT
  w.name as workflow_name,
  w.type as workflow_type,
  we.status,
  we.created_at,
  we.duration_ms,
  we.estimated_cost_usd,
  p.name as project_name
FROM workflow_executions we
JOIN workflows w ON we.workflow_id = w.id
LEFT JOIN projects p ON we.project_id = p.id
ORDER BY we.created_at DESC
LIMIT 100;

-- ============================================================================
-- COMPATIBILITY LAYER
-- ============================================================================

-- Create a view that maps the new schema to the old openrouter_usage_events format
CREATE OR REPLACE VIEW openrouter_usage_events_compat AS
SELECT
  id,
  created_at,
  model,
  total_tokens,
  estimated_cost_usd,
  routing_mode,
  workflow,
  project_id,
  crew_member,
  provider
FROM llm_usage_events;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE projects IS 'Central registry for all project types across the platform';
COMMENT ON TABLE llm_usage_events IS 'Unified LLM usage tracking across all providers and projects';
COMMENT ON TABLE crew_members IS 'Shared crew member definitions with Star Trek theming';
COMMENT ON TABLE crew_memories IS 'Persistent memory store for crew interactions across projects';
COMMENT ON TABLE workflows IS 'Registry of n8n workflows with tracking and configuration';
COMMENT ON TABLE workflow_executions IS 'Execution history for debugging and monitoring';

COMMENT ON COLUMN llm_usage_events.provider IS 'LLM provider: openrouter, anthropic, openai, gemini';
COMMENT ON COLUMN llm_usage_events.routing_mode IS 'Cost tier used: premium, standard, budget, ultra_budget';
COMMENT ON COLUMN crew_members.cost_tier IS 'Default cost tier for this crew member';
COMMENT ON COLUMN workflows.type IS 'Workflow category: crew, system, coordination, project-specific, subflow';
