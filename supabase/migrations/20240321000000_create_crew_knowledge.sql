-- Create crew_knowledge table for storing data scraped from Memory Alpha
CREATE TABLE IF NOT EXISTS crew_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_member TEXT NOT NULL,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  source_url TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE crew_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON crew_knowledge FOR SELECT USING (true);
CREATE POLICY "Enable insert/update for all users" ON crew_knowledge FOR ALL USING (true) WITH CHECK (true);