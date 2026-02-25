-- Create the agent_memory table for the Central Mind agent network
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    source TEXT NOT NULL, -- e.g. 'picard', 'data'
    type TEXT NOT NULL,   -- e.g. 'pattern', 'insight', 'fix'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create a GIN index for full-text search performance
-- This matches the .textSearch('content', keywords) call in the Supabase client
CREATE INDEX IF NOT EXISTS agent_memory_content_fts_idx 
ON agent_memory USING GIN (to_tsvector('english', content));

-- Enable Row Level Security (RLS)
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (the VS Code extension) to read/write
CREATE POLICY "Enable access for authenticated users" 
ON agent_memory FOR ALL TO authenticated USING (true) WITH CHECK (true);