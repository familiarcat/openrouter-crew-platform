-- Deployment Logs for Vercel and AWS tracking
CREATE TABLE IF NOT EXISTS deployment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('vercel', 'aws', 'local')),
  deployment_id TEXT, -- Vercel Deployment ID or AWS Task ARN
  environment TEXT NOT NULL DEFAULT 'development' CHECK (environment IN ('local', 'development', 'staging', 'production')),
  status TEXT NOT NULL DEFAULT 'queued',
  build_url TEXT,
  commit_sha TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime for the dashboard to track builds
ALTER PUBLICATION supabase_realtime ADD TABLE deployment_logs;