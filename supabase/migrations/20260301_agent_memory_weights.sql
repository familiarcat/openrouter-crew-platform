-- Agent Memory Weighted Interpolation System
-- Inspired by Hinton's distributed neural representations
-- Memory is scoped by project_id (shared pool); crew_id = attribution only

-- memory_nodes: enhanced memory nodes with hierarchical layers
CREATE TABLE IF NOT EXISTS memory_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  crew_id TEXT,               -- which crew member created this (attribution, not isolation)
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Hierarchical layer (Hinton's feature hierarchy)
  layer INT NOT NULL DEFAULT 1 CHECK (layer BETWEEN 1 AND 4),
  -- Layer 1=observation, 2=pattern, 3=strategy, 4=institutional

  content TEXT NOT NULL,      -- full memory text
  summary TEXT,               -- short summary for prompt injection
  tags TEXT[] DEFAULT '{}',   -- semantic tags

  retention_tier TEXT NOT NULL DEFAULT 'standard'
    CHECK (retention_tier IN ('eternal','standard','temporary','session')),
  confidence_weight FLOAT NOT NULL DEFAULT 1.0
    CHECK (confidence_weight BETWEEN 0 AND 1),

  activation_count INT NOT NULL DEFAULT 0,
  last_activated_at TIMESTAMPTZ,

  context_keywords TEXT[] DEFAULT '{}',  -- extracted keywords from context
  legacy_memory_id UUID,      -- bridge to crew_memory_vectors for migration
  expires_at TIMESTAMPTZ,     -- 30-day retention
  deleted_at TIMESTAMPTZ      -- soft delete
);

-- memory_edges: weighted connections between co-activated nodes (synapse strengths)
CREATE TABLE IF NOT EXISTS memory_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES memory_nodes(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES memory_nodes(id) ON DELETE CASCADE,

  weight FLOAT NOT NULL DEFAULT 0.1 CHECK (weight BETWEEN 0 AND 1),
  co_activation_count INT NOT NULL DEFAULT 1,
  last_co_activated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(source_id, target_id)
);

-- memory_contexts: fingerprints of contexts that triggered memory activations
CREATE TABLE IF NOT EXISTS memory_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),

  session_id TEXT NOT NULL,
  crew_id TEXT NOT NULL,
  context_hash TEXT NOT NULL,
  context_summary TEXT,

  activated_node_ids UUID[] NOT NULL DEFAULT '{}',
  activation_weights FLOAT[] NOT NULL DEFAULT '{}',
  used_in_prompt BOOLEAN DEFAULT false
);

-- memory_outcomes: outcome tracking for weight reinforcement (backprop-like)
CREATE TABLE IF NOT EXISTS memory_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),

  session_id TEXT NOT NULL,
  context_id UUID REFERENCES memory_contexts(id) ON DELETE SET NULL,
  activated_node_ids UUID[] NOT NULL DEFAULT '{}',

  outcome TEXT NOT NULL CHECK (outcome IN ('success','failure','partial')),
  outcome_delta FLOAT NOT NULL DEFAULT 0.0,  -- +/- confidence adjustment

  crew_member TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_memory_nodes_project_layer
  ON memory_nodes(project_id, layer, confidence_weight DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_memory_nodes_keywords
  ON memory_nodes USING GIN(context_keywords);

CREATE INDEX IF NOT EXISTS idx_memory_edges_source
  ON memory_edges(source_id, weight DESC);

CREATE INDEX IF NOT EXISTS idx_memory_edges_target
  ON memory_edges(target_id, weight DESC);

CREATE INDEX IF NOT EXISTS idx_memory_contexts_session
  ON memory_contexts(session_id, crew_id);

CREATE INDEX IF NOT EXISTS idx_memory_outcomes_session
  ON memory_outcomes(session_id);

CREATE INDEX IF NOT EXISTS idx_memory_contexts_hash
  ON memory_contexts(context_hash);

-- Grant permissions for application user
ALTER TABLE memory_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: authenticated users can read/write memories for their projects
CREATE POLICY "Users can view project memories"
  ON memory_nodes FOR SELECT
  USING (project_id IN (
    SELECT id FROM projects
    WHERE owner_id = auth.uid()
      OR id IN (SELECT project_id FROM projects)
  ));

CREATE POLICY "Users can create memories"
  ON memory_nodes FOR INSERT
  WITH CHECK (project_id IN (
    SELECT id FROM projects
    WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can update memories"
  ON memory_nodes FOR UPDATE
  USING (project_id IN (
    SELECT id FROM projects
    WHERE owner_id = auth.uid()
  ));
