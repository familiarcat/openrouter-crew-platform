-- Observation Lounge Findings Table
-- Stores crew member observations, insights, and anomalies
-- Integrates with agent memory for decay management

CREATE TABLE IF NOT EXISTS observation_lounge_findings (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  crew_member_id TEXT NOT NULL,
  crew_member_name TEXT NOT NULL,
  crew_member_role TEXT NOT NULL,

  -- The core finding
  finding TEXT NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('insight', 'recommendation', 'anomaly', 'pattern', 'opportunity')),

  -- MCP service context
  mcp_service_used TEXT,
  data_source TEXT,
  mcp_tool_chain TEXT[] DEFAULT '{}',

  -- Confidence (0-1 scale)
  confidence FLOAT NOT NULL DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),

  -- Categorization
  tags TEXT[] DEFAULT '{}',
  related_findings TEXT[] DEFAULT '{}',

  -- Status lifecycle
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT,

  -- Indexes for fast retrieval
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX idx_observation_lounge_project_id ON observation_lounge_findings(project_id);
CREATE INDEX idx_observation_lounge_crew_member ON observation_lounge_findings(crew_member_id);
CREATE INDEX idx_observation_lounge_status ON observation_lounge_findings(status);
CREATE INDEX idx_observation_lounge_insight_type ON observation_lounge_findings(insight_type);
CREATE INDEX idx_observation_lounge_created_at ON observation_lounge_findings(created_at DESC);
CREATE INDEX idx_observation_lounge_confidence ON observation_lounge_findings(confidence DESC);

-- GIN index for tag and role-based queries
CREATE INDEX idx_observation_lounge_tags ON observation_lounge_findings USING GIN(tags);
CREATE INDEX idx_observation_lounge_crew_role ON observation_lounge_findings(crew_member_role);

-- Full-text search index
CREATE INDEX idx_observation_lounge_finding_text ON observation_lounge_findings USING GIN(to_tsvector('english', finding));

-- Enable RLS (Row Level Security)
ALTER TABLE observation_lounge_findings ENABLE ROW LEVEL SECURITY;

-- Policy: Project members can view published findings
CREATE POLICY "project_members_view_published_findings"
  ON observation_lounge_findings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = observation_lounge_findings.project_id
      AND pm.user_id = auth.uid()
    )
    AND status = 'published'
  );

-- Policy: Crew members can create findings
CREATE POLICY "crew_members_create_findings"
  ON observation_lounge_findings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_id
      AND pm.user_id = auth.uid()
    )
  );

-- Policy: Crew members can update their own findings
CREATE POLICY "crew_members_update_own_findings"
  ON observation_lounge_findings
  FOR UPDATE
  USING (
    crew_member_id = auth.uid()
  )
  WITH CHECK (
    crew_member_id = auth.uid()
  );

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_observation_lounge_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER observation_lounge_update_timestamp
BEFORE UPDATE ON observation_lounge_findings
FOR EACH ROW
EXECUTE FUNCTION update_observation_lounge_timestamp();

-- View: Get findings grouped by crew role
CREATE OR REPLACE VIEW observation_lounge_by_role AS
SELECT
  crew_member_role,
  COUNT(*) as total_findings,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as published_findings,
  AVG(confidence) as avg_confidence,
  MAX(created_at) as latest_finding
FROM observation_lounge_findings
GROUP BY crew_member_role;

-- View: Get findings grouped by insight type
CREATE OR REPLACE VIEW observation_lounge_by_type AS
SELECT
  insight_type,
  COUNT(*) as total_findings,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as published_findings,
  AVG(confidence) as avg_confidence,
  MAX(created_at) as latest_finding
FROM observation_lounge_findings
GROUP BY insight_type;

-- View: High confidence findings (potential institution knowledge)
CREATE OR REPLACE VIEW observation_lounge_high_confidence AS
SELECT
  *
FROM observation_lounge_findings
WHERE confidence >= 0.9
  AND status = 'published'
ORDER BY created_at DESC;

-- Comment on table for documentation
COMMENT ON TABLE observation_lounge_findings IS
  'Crew member observations, insights, and anomalies from their work. ' ||
  'Integrates with agent memory system for confidence decay management. ' ||
  'High confidence findings become institutional knowledge (agent memory Layer 4). ' ||
  'Usage frequency activates memories and prevents decay.';

COMMENT ON COLUMN observation_lounge_findings.confidence IS
  'Confidence score (0-1). Determines memory retention tier: ' ||
  '>= 0.9 = eternal (permanent), ' ||
  '>= 0.7 = standard (30 days half-life), ' ||
  '>= 0.5 = temporary (3 days half-life), ' ||
  '< 0.5 = session (10 hours half-life)';

COMMENT ON COLUMN observation_lounge_findings.mcp_service_used IS
  'Which MCP (Model Context Protocol) service was used to discover this finding. ' ||
  'Examples: mcp-dataframe-analyzer, mcp-anomaly-detector, mcp-market-analyzer';
