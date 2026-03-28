-- =====================================================
-- Dashboard E2E Test Data Seed
-- Version: 1.0.0
-- Description: Hydrates Supabase with sample data for Dashboard verification
-- Usage: Run in Supabase SQL Editor
-- =====================================================

-- 1. LLM Usage Events (Cost Tracking)
-- Generates 30 days of usage data for cost charts
INSERT INTO llm_usage_events (project_id, model, input_tokens, output_tokens, cost_usd, provider, created_at)
SELECT
  'ecommerce-platform', -- Assumes project exists (from 002 seed)
  CASE floor(random() * 3)
    WHEN 0 THEN 'anthropic/claude-3-opus'
    WHEN 1 THEN 'anthropic/claude-3-sonnet'
    ELSE 'openai/gpt-4o'
  END,
  floor(random() * 1000) + 500,
  floor(random() * 2000) + 100,
  (random() * 0.05) + 0.001,
  'openrouter',
  NOW() - (interval '1 day' * floor(random() * 30))
FROM generate_series(1, 50);

-- 2. Crew Memories (Knowledge Base)
-- Populates memories for the "Knowledge" tab
INSERT INTO crew_memories (crew_member_id, content, type, confidence, created_at)
VALUES
('commander_data', 'Analyzed 43% efficiency gain in RAG pipeline using vector compression.', 'insight', 0.95, NOW() - interval '2 hours'),
('captain_picard', 'Strategic alignment achieved for Q1 objectives. Team morale is high.', 'strategy', 0.88, NOW() - interval '1 day'),
('geordi_la_forge', 'Warp core containment field (database connection pool) stabilized after reconfiguration.', 'technical', 0.92, NOW() - interval '3 days'),
('counselor_troi', 'User sentiment analysis indicates frustration with loading times on mobile.', 'ux', 0.85, NOW() - interval '4 days'),
('lt_worf', 'Security protocols successfully repelled unauthorized access attempt on port 443.', 'security', 0.99, NOW() - interval '5 days');

-- 3. Workflow Executions (Activity Monitor)
-- Populates recent activity
INSERT INTO workflow_executions (workflow_id, status, started_at, completed_at, metadata)
VALUES
('wf-cost-opt', 'success', NOW() - interval '10 minutes', NOW() - interval '9 minutes', '{"savings": 0.45}'),
('wf-security-scan', 'success', NOW() - interval '1 hour', NOW() - interval '55 minutes', '{"vulnerabilities": 0}'),
('wf-content-gen', 'failed', NOW() - interval '2 hours', NOW() - interval '2 hours', '{"error": "Context limit exceeded"}'),
('wf-deployment', 'success', NOW() - interval '1 day', NOW() - interval '23 hours', '{"env": "production"}');

-- 4. Verify Counts
SELECT 'llm_usage_events' as table, count(*) FROM llm_usage_events
UNION ALL
SELECT 'crew_memories', count(*) FROM crew_memories;