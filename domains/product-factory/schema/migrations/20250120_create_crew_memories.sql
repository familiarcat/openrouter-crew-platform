-- Create crew_memories table if it doesn't exist
-- This table stores memories/knowledge for each crew member
-- Memories are used to track crew member experience and context

CREATE TABLE IF NOT EXISTS crew_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_member_id TEXT NOT NULL,
  memory_type TEXT DEFAULT 'general',
  memory_content TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  context JSONB,
  metadata JSONB,
  CONSTRAINT valid_crew_member_id CHECK (crew_member_id != '')
);

-- Create index for faster queries by crew_member_id
CREATE INDEX IF NOT EXISTS idx_crew_memories_crew_id 
  ON crew_memories(crew_member_id);

-- Create index for faster filtering by type
CREATE INDEX IF NOT EXISTS idx_crew_memories_type 
  ON crew_memories(memory_type);

-- Create index for faster time-based queries
CREATE INDEX IF NOT EXISTS idx_crew_memories_created_at 
  ON crew_memories(created_at);

-- Create composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_crew_memories_crew_type 
  ON crew_memories(crew_member_id, memory_type);

-- Enable Row Level Security
ALTER TABLE crew_memories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy 1: Service role can read all memories
DROP POLICY IF EXISTS service_role_select ON crew_memories;
CREATE POLICY service_role_select ON crew_memories
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policy 2: Service role can insert
DROP POLICY IF EXISTS service_role_insert ON crew_memories;
CREATE POLICY service_role_insert ON crew_memories
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy 3: Service role can update
DROP POLICY IF EXISTS service_role_update ON crew_memories;
CREATE POLICY service_role_update ON crew_memories
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy 4: Service role can delete
DROP POLICY IF EXISTS service_role_delete ON crew_memories;
CREATE POLICY service_role_delete ON crew_memories
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Sample crew members for initial population
-- This is optional - crew_member_id values should match the crew registry

-- Seed sample memories if table is empty
INSERT INTO crew_memories (crew_member_id, memory_type, memory_content, source, context)
SELECT 
  crew.id,
  'initialization',
  'Crew member initialized from registry',
  'migration',
  jsonb_build_object(
    'name', crew.name,
    'role', crew.role,
    'initialized_at', NOW()::text
  )
FROM (
  VALUES
    ('captain_picard', 'Captain Jean-Luc Picard', 'Strategic Leadership, Mission Planning, Decision Making'),
    ('commander_riker', 'Commander William T. Riker', 'Tactical Execution, Cross-functional Coordination, Leadership'),
    ('commander_data', 'Commander Data', 'Advanced Analysis, Logic Processing, Technical Implementation'),
    ('geordi_la_forge', 'Lt. Cmdr. Geordi La Forge', 'Infrastructure, CI/CD, Terraform, Technical Operations'),
    ('worf', 'Lt. Worf', 'Security Operations, Tactical Defense, Protocol Enforcement'),
    ('crusher', 'Dr. Beverly Crusher', 'System Health, Diagnostics, Documentation, Quality Assurance'),
    ('quark', 'Quark', 'Cost Analysis, ROI, Optimization, Business Strategy'),
    ('chief_obrien', 'Chief Miles O''Brien', 'Infrastructure Management, System Maintenance, Troubleshooting'),
    ('uhura', 'Lt. Uhura', 'Communication, Integration, Cross-team Coordination'),
    ('counselor_troi', 'Counselor Deanna Troi', 'Team Dynamics, Relationship Management, Conflict Resolution')
  ) AS crew(id, name, role)
WHERE NOT EXISTS (
  SELECT 1 FROM crew_memories 
  WHERE crew_member_id = crew.id
)
ON CONFLICT DO NOTHING;

-- Create a function to count memories for a crew member
DROP FUNCTION IF EXISTS count_crew_memories(TEXT);
CREATE OR REPLACE FUNCTION count_crew_memories(p_crew_id TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM crew_memories
  WHERE crew_member_id = p_crew_id;
$$ LANGUAGE SQL STABLE;

-- Grant permissions
GRANT SELECT ON crew_memories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON crew_memories TO service_role;
GRANT EXECUTE ON FUNCTION count_crew_memories TO authenticated;
GRANT EXECUTE ON FUNCTION count_crew_memories TO service_role;
