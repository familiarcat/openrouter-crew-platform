-- Migration: Create Crew Drill and Optimization System Tables
-- Purpose: Enable weekly crew performance drills with Picard evaluation and system optimization
-- Created: 2025-12-20

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table 1: drill_scenarios
-- Stores test scenarios (synthetic, real-world, and benchmark)
-- ============================================================================

CREATE TABLE IF NOT EXISTS drill_scenarios (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Scenario metadata
    scenario_type VARCHAR(50) NOT NULL CHECK (scenario_type IN ('synthetic', 'real_world', 'benchmark')),
    category VARCHAR(100) NOT NULL,  -- 'architecture', 'bug_fix', 'feature', 'security', etc.
    complexity_level VARCHAR(20) NOT NULL CHECK (complexity_level IN ('critical', 'important', 'routine', 'trivial')),

    -- Scenario content
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    user_request TEXT NOT NULL,  -- The actual task prompt to test
    expected_expertise TEXT[] NOT NULL,  -- Required crew specializations

    -- Test parameters
    success_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,  -- JSON defining success metrics
    baseline_metrics JSONB,  -- Historical baseline if available
    context_data JSONB DEFAULT '{}'::jsonb,  -- Additional context for scenario

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Validation
    CONSTRAINT valid_title CHECK (length(title) > 0),
    CONSTRAINT valid_user_request CHECK (length(user_request) > 0),
    CONSTRAINT valid_expertise CHECK (array_length(expected_expertise, 1) > 0)
);

-- Indexes for drill_scenarios
CREATE INDEX IF NOT EXISTS idx_scenarios_type ON drill_scenarios(scenario_type);
CREATE INDEX IF NOT EXISTS idx_scenarios_complexity ON drill_scenarios(complexity_level);
CREATE INDEX IF NOT EXISTS idx_scenarios_category ON drill_scenarios(category);
CREATE INDEX IF NOT EXISTS idx_scenarios_active ON drill_scenarios(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_scenarios_created ON drill_scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenarios_tags ON drill_scenarios USING GIN(tags);

-- ============================================================================
-- Table 2: drill_runs
-- Tracks weekly/manual drill sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS drill_runs (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Run metadata
    run_type VARCHAR(20) NOT NULL CHECK (run_type IN ('weekly_auto', 'manual', 'on_demand')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),

    -- Summary metrics (updated during execution)
    total_scenarios INTEGER DEFAULT 0,
    total_executions INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10, 6) DEFAULT 0,
    average_quality_score DECIMAL(5, 2),
    average_execution_time_ms INTEGER,

    -- Configuration
    config JSONB DEFAULT '{}'::jsonb,  -- Drill configuration parameters

    -- Results (set after completion)
    picard_evaluation_id UUID,  -- References drill_evaluations (set after evaluation)
    updates_applied JSONB DEFAULT '{}'::jsonb,  -- What was updated (crew configs, orchestrator, etc.)
    error_log TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Validation
    CONSTRAINT valid_total_scenarios CHECK (total_scenarios >= 0),
    CONSTRAINT valid_total_executions CHECK (total_executions >= 0),
    CONSTRAINT valid_total_cost CHECK (total_cost_usd >= 0)
);

-- Indexes for drill_runs
CREATE INDEX IF NOT EXISTS idx_drill_runs_type ON drill_runs(run_type);
CREATE INDEX IF NOT EXISTS idx_drill_runs_status ON drill_runs(status);
CREATE INDEX IF NOT EXISTS idx_drill_runs_started ON drill_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_drill_runs_completed ON drill_runs(completed_at DESC) WHERE completed_at IS NOT NULL;

-- ============================================================================
-- Table 3: drill_executions
-- Individual scenario executions with performance metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS drill_executions (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drill_run_id UUID NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES drill_scenarios(id) ON DELETE SET NULL,

    -- Execution metadata
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    execution_status VARCHAR(20) NOT NULL CHECK (execution_status IN ('success', 'failed', 'timeout', 'error')),

    -- Crew configuration tested
    activated_crew TEXT[] NOT NULL,
    llm_tier_assignments JSONB NOT NULL,  -- {crew_id: tier}
    task_complexity VARCHAR(20) NOT NULL,
    tier_configuration_label VARCHAR(50),  -- 'current_default', 'all_premium', 'all_budget', 'mixed_optimized'

    -- Performance metrics
    total_cost_usd DECIMAL(10, 6) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    tokens_used JSONB DEFAULT '{}'::jsonb,  -- {crew_id: {input: n, output: n}}

    -- Quality metrics (set by evaluator after execution)
    quality_score DECIMAL(5, 2),  -- 0-100
    accuracy_score DECIMAL(5, 2),  -- 0-100
    response_quality_score DECIMAL(5, 2),  -- 0-100

    -- Execution data
    orchestration_result JSONB NOT NULL,  -- Full orchestrator output
    crew_responses JSONB,  -- Individual crew member outputs (if captured)
    error_log TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Validation
    CONSTRAINT valid_cost CHECK (total_cost_usd >= 0),
    CONSTRAINT valid_execution_time CHECK (execution_time_ms >= 0),
    CONSTRAINT valid_quality_score CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100)),
    CONSTRAINT valid_accuracy_score CHECK (accuracy_score IS NULL OR (accuracy_score >= 0 AND accuracy_score <= 100)),
    CONSTRAINT valid_response_quality_score CHECK (response_quality_score IS NULL OR (response_quality_score >= 0 AND response_quality_score <= 100))
);

-- Indexes for drill_executions
CREATE INDEX IF NOT EXISTS idx_drill_exec_run ON drill_executions(drill_run_id);
CREATE INDEX IF NOT EXISTS idx_drill_exec_scenario ON drill_executions(scenario_id);
CREATE INDEX IF NOT EXISTS idx_drill_exec_cost ON drill_executions(total_cost_usd);
CREATE INDEX IF NOT EXISTS idx_drill_exec_time ON drill_executions(execution_time_ms);
CREATE INDEX IF NOT EXISTS idx_drill_exec_status ON drill_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_drill_exec_created ON drill_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drill_exec_tier_config ON drill_executions(tier_configuration_label);

-- ============================================================================
-- Table 4: drill_evaluations
-- Picard's holistic evaluation and recommendations
-- ============================================================================

CREATE TABLE IF NOT EXISTS drill_evaluations (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drill_run_id UUID NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Evaluator
    evaluated_by VARCHAR(50) DEFAULT 'captain_picard',

    -- Overall assessment
    overall_score DECIMAL(5, 2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    assessment_summary TEXT NOT NULL,
    detailed_analysis TEXT,

    -- Metric scores (0-100)
    cost_efficiency_score DECIMAL(5, 2) NOT NULL CHECK (cost_efficiency_score >= 0 AND cost_efficiency_score <= 100),
    quality_accuracy_score DECIMAL(5, 2) NOT NULL CHECK (quality_accuracy_score >= 0 AND quality_accuracy_score <= 100),
    response_quality_score DECIMAL(5, 2) NOT NULL CHECK (response_quality_score >= 0 AND response_quality_score <= 100),
    speed_latency_score DECIMAL(5, 2) NOT NULL CHECK (speed_latency_score >= 0 AND speed_latency_score <= 100),

    -- Recommendations
    recommended_changes JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Specific configuration updates
    crew_performance_analysis JSONB DEFAULT '{}'::jsonb,  -- Per-crew member analysis
    tier_recommendations JSONB DEFAULT '{}'::jsonb,  -- Recommended tier assignments by crew
    orchestrator_updates JSONB DEFAULT '{}'::jsonb,  -- Keyword/logic updates for orchestrator

    -- Insights
    key_findings TEXT[] DEFAULT '{}',
    improvement_areas TEXT[] DEFAULT '{}',
    successful_patterns TEXT[] DEFAULT '{}',

    -- Confidence
    confidence_level INTEGER DEFAULT 85 CHECK (confidence_level >= 0 AND confidence_level <= 100),

    -- LLM details
    llm_model_used VARCHAR(100),
    llm_tokens_used JSONB,  -- {input: n, output: n}
    evaluation_cost_usd DECIMAL(10, 6),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Validation
    CONSTRAINT valid_summary CHECK (length(assessment_summary) > 0),
    CONSTRAINT valid_evaluation_cost CHECK (evaluation_cost_usd IS NULL OR evaluation_cost_usd >= 0)
);

-- Indexes for drill_evaluations
CREATE INDEX IF NOT EXISTS idx_drill_eval_run ON drill_evaluations(drill_run_id);
CREATE INDEX IF NOT EXISTS idx_drill_eval_score ON drill_evaluations(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_drill_eval_cost_efficiency ON drill_evaluations(cost_efficiency_score DESC);
CREATE INDEX IF NOT EXISTS idx_drill_eval_quality ON drill_evaluations(quality_accuracy_score DESC);
CREATE INDEX IF NOT EXISTS idx_drill_eval_created ON drill_evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drill_eval_confidence ON drill_evaluations(confidence_level DESC);

-- ============================================================================
-- Foreign Key Constraint (added after both tables exist)
-- ============================================================================

ALTER TABLE drill_runs
    ADD CONSTRAINT fk_drill_runs_evaluation
    FOREIGN KEY (picard_evaluation_id) REFERENCES drill_evaluations(id) ON DELETE SET NULL;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE drill_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_evaluations ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public can read drill_scenarios"
    ON drill_scenarios FOR SELECT
    USING (true);

CREATE POLICY "Public can read drill_runs"
    ON drill_runs FOR SELECT
    USING (true);

CREATE POLICY "Public can read drill_executions"
    ON drill_executions FOR SELECT
    USING (true);

CREATE POLICY "Public can read drill_evaluations"
    ON drill_evaluations FOR SELECT
    USING (true);

-- Public insert/update for drill system (workflows need to write)
CREATE POLICY "Public can insert drill_scenarios"
    ON drill_scenarios FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public can update drill_scenarios"
    ON drill_scenarios FOR UPDATE
    USING (true) WITH CHECK (true);

CREATE POLICY "Public can insert drill_runs"
    ON drill_runs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public can update drill_runs"
    ON drill_runs FOR UPDATE
    USING (true) WITH CHECK (true);

CREATE POLICY "Public can insert drill_executions"
    ON drill_executions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public can update drill_executions"
    ON drill_executions FOR UPDATE
    USING (true) WITH CHECK (true);

CREATE POLICY "Public can insert drill_evaluations"
    ON drill_evaluations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public can update drill_evaluations"
    ON drill_evaluations FOR UPDATE
    USING (true) WITH CHECK (true);

-- ============================================================================
-- Utility Functions
-- ============================================================================

-- Function to calculate average scores for a drill run
CREATE OR REPLACE FUNCTION calculate_drill_run_averages(p_drill_run_id UUID)
RETURNS TABLE (
    avg_quality DECIMAL(5,2),
    avg_cost DECIMAL(10,6),
    avg_time INTEGER,
    success_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        AVG(quality_score)::DECIMAL(5,2) AS avg_quality,
        AVG(total_cost_usd)::DECIMAL(10,6) AS avg_cost,
        AVG(execution_time_ms)::INTEGER AS avg_time,
        (COUNT(*) FILTER (WHERE execution_status = 'success')::DECIMAL / NULLIF(COUNT(*), 0) * 100)::DECIMAL(5,2) AS success_rate
    FROM drill_executions
    WHERE drill_run_id = p_drill_run_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get drill run summary
CREATE OR REPLACE FUNCTION get_drill_run_summary(p_drill_run_id UUID)
RETURNS JSONB AS $$
DECLARE
    run_summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'run_id', dr.id,
        'run_type', dr.run_type,
        'status', dr.status,
        'started_at', dr.started_at,
        'completed_at', dr.completed_at,
        'total_scenarios', dr.total_scenarios,
        'total_executions', dr.total_executions,
        'total_cost', dr.total_cost_usd,
        'evaluation_score', de.overall_score,
        'cost_efficiency_score', de.cost_efficiency_score,
        'quality_score', de.quality_accuracy_score,
        'recommendations_count', jsonb_array_length(COALESCE(de.key_findings::jsonb, '[]'::jsonb))
    )
    INTO run_summary
    FROM drill_runs dr
    LEFT JOIN drill_evaluations de ON dr.picard_evaluation_id = de.id
    WHERE dr.id = p_drill_run_id;

    RETURN run_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Analytics Views
-- ============================================================================

-- View: Recent drill runs with evaluations
CREATE OR REPLACE VIEW drill_runs_with_evaluations AS
SELECT
    dr.id AS run_id,
    dr.run_type,
    dr.status,
    dr.started_at,
    dr.completed_at,
    dr.total_scenarios,
    dr.total_executions,
    dr.total_cost_usd,
    dr.average_quality_score,
    de.overall_score AS evaluation_overall_score,
    de.cost_efficiency_score,
    de.quality_accuracy_score,
    de.response_quality_score,
    de.speed_latency_score,
    de.confidence_level AS evaluation_confidence,
    EXTRACT(EPOCH FROM (dr.completed_at - dr.started_at))::INTEGER AS duration_seconds
FROM drill_runs dr
LEFT JOIN drill_evaluations de ON dr.picard_evaluation_id = de.id
ORDER BY dr.started_at DESC;

-- View: Crew performance trends
CREATE OR REPLACE VIEW crew_performance_trends AS
SELECT
    unnest(de.activated_crew) AS crew_member,
    AVG(de.total_cost_usd) AS avg_cost,
    AVG(de.execution_time_ms) AS avg_time_ms,
    AVG(de.quality_score) AS avg_quality,
    COUNT(*) AS total_executions,
    COUNT(*) FILTER (WHERE de.execution_status = 'success') AS successful_executions
FROM drill_executions de
GROUP BY crew_member
ORDER BY avg_quality DESC;

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_drill_scenarios_updated_at
    BEFORE UPDATE ON drill_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drill_runs_updated_at
    BEFORE UPDATE ON drill_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify all tables created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_name IN ('drill_scenarios', 'drill_runs', 'drill_executions', 'drill_evaluations')
    AND table_schema = 'public';

    IF table_count = 4 THEN
        RAISE NOTICE '✅ All 4 drill system tables created successfully';
    ELSE
        RAISE EXCEPTION '❌ Expected 4 tables but found %', table_count;
    END IF;
END $$;

-- Display table structure summary
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) AS index_count
FROM information_schema.tables t
WHERE t.table_name IN ('drill_scenarios', 'drill_runs', 'drill_executions', 'drill_evaluations')
AND t.table_schema = 'public'
ORDER BY t.table_name;
