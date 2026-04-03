-- ============================================================================
-- MIGRATION: Add severity field to agent_memory
-- ============================================================================
-- Purpose: Allow categorization of insights and violations by impact level.
--          Required for the Dark Forest Protocol audit and Worf security sweeps.
-- ============================================================================

ALTER TABLE public.agent_memory 
ADD COLUMN severity TEXT DEFAULT 'INFO' 
CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

COMMENT ON COLUMN public.agent_memory.severity IS 'The impact level of the insight or violation.';