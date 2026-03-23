-- Create agent_configurations table for shared memory and self-learning
CREATE TABLE IF NOT EXISTS agent_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  config_type TEXT NOT NULL CHECK (config_type IN ('agent', 'claude', 'gemini')),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (agent_name, config_type)
);

-- Enable Row Level Security
ALTER TABLE agent_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies (permissive for internal crew operation)
CREATE POLICY "Enable read access for all users" 
ON agent_configurations FOR SELECT USING (true);

CREATE POLICY "Enable insert/update for all users" 
ON agent_configurations FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_agent_configs_lookup ON agent_configurations(agent_name, config_type);