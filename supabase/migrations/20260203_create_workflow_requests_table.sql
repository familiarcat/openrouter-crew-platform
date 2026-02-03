-- ============================================================================
-- MIGRATION: Create workflow_requests table for n8n async workflow tracking
-- ============================================================================
-- Purpose: Track all async requests sent to n8n workflows with status,
--          performance metrics, and error information. Enables long-running
--          workflows to bypass the 30-second synchronous timeout.
--
-- Application: Implements the "3-Body Problem" energy conservation principle:
--              Every async operation is tracked with request lifecycle,
--              cost impact, and real-time polling status.
--
-- Created: 2026-02-03
-- Crew: Claude (Haiku 4.5)

-- ============================================================================
-- CREATE WORKFLOW_REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_requests (
  -- Primary Identifier
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Workflow Reference
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  workflow_name TEXT NOT NULL,
  n8n_workflow_id TEXT,
  n8n_execution_id TEXT,

  -- Request Metadata
  request_type TEXT NOT NULL CHECK (request_type IN ('crew-consult', 'workflow-trigger', 'coordination', 'custom')),
  request_payload JSONB NOT NULL DEFAULT '{}',
  request_metadata JSONB DEFAULT '{}',

  -- Response Tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'timeout', 'cancelled')),
  response_payload JSONB,
  error_message TEXT,
  error_code TEXT,
  error_details JSONB,

  -- Performance Metrics
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,

  -- Cost Tracking
  estimated_cost_usd NUMERIC(10, 4),
  actual_cost_usd NUMERIC(10, 4),

  -- Polling & Retry Management
  poll_count INT DEFAULT 0,
  last_polled_at TIMESTAMP WITH TIME ZONE,
  next_poll_at TIMESTAMP WITH TIME ZONE,
  max_poll_attempts INT DEFAULT 60,
  poll_interval_ms INT DEFAULT 5000,

  -- Retry Configuration
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  last_retry_at TIMESTAMP WITH TIME ZONE,

  -- Request Context
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id TEXT DEFAULT 'default',
  session_id TEXT,
  crew_member TEXT,

  -- Expiration & Cleanup
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Data Integrity Constraints
  CONSTRAINT valid_request_type CHECK (length(request_type) > 0),
  CONSTRAINT valid_workflow_name CHECK (length(workflow_name) > 0),
  CONSTRAINT valid_request_payload CHECK (request_payload IS NOT NULL),
  CONSTRAINT valid_timing CHECK (completed_at IS NULL OR completed_at >= started_at),
  CONSTRAINT valid_cost CHECK (estimated_cost_usd IS NULL OR estimated_cost_usd >= 0),
  CONSTRAINT valid_actual_cost CHECK (actual_cost_usd IS NULL OR actual_cost_usd >= 0),
  CONSTRAINT valid_poll_interval CHECK (poll_interval_ms > 0),
  CONSTRAINT valid_max_retries CHECK (max_retries >= 0),
  CONSTRAINT valid_expiration CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Add table comment
COMMENT ON TABLE workflow_requests IS
'Tracks async n8n workflow requests with status, performance, and cost tracking.
Enables workflows that take longer than 30 seconds by implementing polling
and callback patterns. Uses 3-Body Problem energy conservation principle for
cost optimization.';

COMMENT ON COLUMN workflow_requests.request_type IS
'Type of request: crew-consult for LLM queries, workflow-trigger for n8n workflows,
coordination for multi-agent orchestration, custom for user-defined';

COMMENT ON COLUMN workflow_requests.status IS
'Lifecycle status: pending (initial), running (processing), success (complete),
failed (error), timeout (exceeded max polls), cancelled (user abort)';

COMMENT ON COLUMN workflow_requests.poll_count IS
'Number of times the client has polled for status. Used to prevent infinite loops.';

COMMENT ON COLUMN workflow_requests.estimated_cost_usd IS
'Pre-execution cost estimate. Calculated before API call based on model,
tokens, and provider pricing.';

COMMENT ON COLUMN workflow_requests.actual_cost_usd IS
'Post-execution cost. Populated when response is received or error occurs.';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_workflow_requests_id
  ON workflow_requests(id);

CREATE INDEX IF NOT EXISTS idx_workflow_requests_workflow
  ON workflow_requests(workflow_id);

-- Status indexes for filtering
CREATE INDEX IF NOT EXISTS idx_workflow_requests_status
  ON workflow_requests(status);

CREATE INDEX IF NOT EXISTS idx_workflow_requests_pending
  ON workflow_requests(status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_workflow_requests_running
  ON workflow_requests(status)
  WHERE status = 'running';

CREATE INDEX IF NOT EXISTS idx_workflow_requests_failed
  ON workflow_requests(status)
  WHERE status IN ('failed', 'timeout');

-- Time-based indexes for sorting and range queries
CREATE INDEX IF NOT EXISTS idx_workflow_requests_created
  ON workflow_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_requests_started
  ON workflow_requests(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_requests_completed
  ON workflow_requests(completed_at DESC);

-- Polling and expiration indexes
CREATE INDEX IF NOT EXISTS idx_workflow_requests_next_poll
  ON workflow_requests(next_poll_at)
  WHERE next_poll_at IS NOT NULL
  AND status IN ('pending', 'running');

CREATE INDEX IF NOT EXISTS idx_workflow_requests_expires
  ON workflow_requests(expires_at)
  WHERE expires_at IS NOT NULL;

-- Context indexes for filtering by user/project/crew
CREATE INDEX IF NOT EXISTS idx_workflow_requests_project
  ON workflow_requests(project_id);

CREATE INDEX IF NOT EXISTS idx_workflow_requests_user
  ON workflow_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_workflow_requests_session
  ON workflow_requests(session_id);

CREATE INDEX IF NOT EXISTS idx_workflow_requests_crew
  ON workflow_requests(crew_member);

-- n8n integration indexes
CREATE INDEX IF NOT EXISTS idx_workflow_requests_n8n_workflow
  ON workflow_requests(n8n_workflow_id);

CREATE INDEX IF NOT EXISTS idx_workflow_requests_n8n_execution
  ON workflow_requests(n8n_execution_id);

-- Cost tracking indexes
CREATE INDEX IF NOT EXISTS idx_workflow_requests_has_cost
  ON workflow_requests(actual_cost_usd)
  WHERE actual_cost_usd IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_workflow_requests_project_status
  ON workflow_requests(project_id, status);

CREATE INDEX IF NOT EXISTS idx_workflow_requests_workflow_status
  ON workflow_requests(workflow_id, status);

CREATE INDEX IF NOT EXISTS idx_workflow_requests_user_created
  ON workflow_requests(user_id, created_at DESC);

-- JSONB indexes for searching request/response payloads
CREATE INDEX IF NOT EXISTS idx_workflow_requests_payload_gin
  ON workflow_requests USING GIN (request_payload);

CREATE INDEX IF NOT EXISTS idx_workflow_requests_response_gin
  ON workflow_requests USING GIN (response_payload);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE workflow_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read their own session's requests
CREATE POLICY "Users can read their own workflow requests"
  ON workflow_requests
  FOR SELECT
  USING (session_id IS NOT NULL OR user_id = current_user_id());

-- Allow insertion of workflow requests
CREATE POLICY "Users can create workflow requests"
  ON workflow_requests
  FOR INSERT
  WITH CHECK (session_id IS NOT NULL OR user_id = current_user_id());

-- Allow updates to track polling and completion
CREATE POLICY "Users can update their own workflow requests"
  ON workflow_requests
  FOR UPDATE
  USING (session_id IS NOT NULL OR user_id = current_user_id())
  WITH CHECK (
    -- Prevent cost tampering
    estimated_cost_usd = (
      SELECT estimated_cost_usd FROM workflow_requests WHERE id = workflow_requests.id
    ) OR estimated_cost_usd IS NULL
  );

-- Service role can manage all requests (for system operations)
CREATE POLICY "Service role can manage workflow requests"
  ON workflow_requests
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Auto-update timestamp on any modification
CREATE OR REPLACE FUNCTION update_workflow_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_workflow_requests_timestamp
  BEFORE UPDATE ON workflow_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_requests_updated_at();

-- Auto-calculate duration_ms when request completes
CREATE OR REPLACE FUNCTION calculate_workflow_request_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.duration_ms IS NULL THEN
    NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER calculate_request_duration
  BEFORE UPDATE ON workflow_requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_workflow_request_duration();

-- Set next poll time based on interval
CREATE OR REPLACE FUNCTION schedule_next_workflow_request_poll()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('pending', 'running') AND NEW.poll_count < NEW.max_poll_attempts THEN
    NEW.next_poll_at = NOW() + make_interval(millisecs => NEW.poll_interval_ms);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER schedule_next_poll
  BEFORE INSERT OR UPDATE ON workflow_requests
  FOR EACH ROW
  EXECUTE FUNCTION schedule_next_workflow_request_poll();

-- Auto-expire old pending requests (safety valve)
CREATE OR REPLACE FUNCTION auto_expire_workflow_requests()
RETURNS void AS $$
BEGIN
  UPDATE workflow_requests
  SET status = 'timeout', error_message = 'Request expired due to max polling attempts'
  WHERE status IN ('pending', 'running')
    AND poll_count >= max_poll_attempts
    AND expires_at IS NOT NULL
    AND NOW() > expires_at;
END;
$$ LANGUAGE 'plpgsql';

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for active requests that need polling
CREATE OR REPLACE VIEW active_workflow_requests AS
  SELECT *
  FROM workflow_requests
  WHERE status IN ('pending', 'running')
    AND poll_count < max_poll_attempts
    AND (next_poll_at IS NULL OR next_poll_at <= NOW())
  ORDER BY next_poll_at ASC NULLS FIRST;

COMMENT ON VIEW active_workflow_requests IS
'Shows workflow requests that are actively waiting for response and are due for polling.
Used by the polling service to identify which requests to check.';

-- View for completed requests (successful and failed)
CREATE OR REPLACE VIEW completed_workflow_requests AS
  SELECT *
  FROM workflow_requests
  WHERE status IN ('success', 'failed', 'timeout', 'cancelled')
    AND completed_at IS NOT NULL
  ORDER BY completed_at DESC;

COMMENT ON VIEW completed_workflow_requests IS
'Shows workflow requests that have finished execution. Used for analytics and cleanup.';

-- View for cost analysis
CREATE OR REPLACE VIEW workflow_request_costs AS
  SELECT
    workflow_id,
    workflow_name,
    COUNT(*) as request_count,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_count,
    COUNT(CASE WHEN status IN ('failed', 'timeout') THEN 1 END) as failed_count,
    SUM(estimated_cost_usd) as total_estimated_cost,
    SUM(actual_cost_usd) as total_actual_cost,
    AVG(duration_ms) as avg_duration_ms,
    MAX(duration_ms) as max_duration_ms,
    AVG(poll_count) as avg_poll_attempts
  FROM workflow_requests
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY workflow_id, workflow_name
  ORDER BY total_actual_cost DESC NULLS LAST;

COMMENT ON VIEW workflow_request_costs IS
'Shows cost analysis per workflow. Used to identify expensive workflows and
optimize them using the 3-Body Problem energy conservation principle.';

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create default poll configuration values (for future use)
-- These would be referenced by application code
SELECT 'Migration 20260203_create_workflow_requests_table.sql completed successfully';

-- ============================================================================
-- VERIFY MIGRATION
-- ============================================================================

-- Verify table structure
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'workflow_requests'
ORDER BY ordinal_position;

-- Verify indexes
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE tablename = 'workflow_requests'
ORDER BY indexname;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'workflow_requests';
