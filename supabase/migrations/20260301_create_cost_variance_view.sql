-- ============================================================================
-- VIEW: workflow_cost_variance_analysis
-- ============================================================================
-- Purpose: Compares the initial pre-execution estimated_cost_usd against the 
--          summed actual costs from all attempts stored in attempt_metadata.
--          Helps tune the ComplexityAnalyzer and ModelSelector logic.
-- ============================================================================

CREATE OR REPLACE VIEW workflow_cost_variance_analysis AS
SELECT
    wr.id AS request_id,
    wr.project_id,
    p.name AS project_name,
    wr.workflow_name,
    wr.status,
    ROUND(wr.estimated_cost_usd, 6) AS estimated_cost_usd,
    ROUND(COALESCE(actual_totals.total_actual_cost, 0), 6) AS total_actual_cost,
    ROUND(COALESCE(actual_totals.total_actual_cost, 0) - wr.estimated_cost_usd, 6) AS variance_usd,
    CASE 
        WHEN wr.estimated_cost_usd > 0 
        THEN ROUND(((COALESCE(actual_totals.total_actual_cost, 0) - wr.estimated_cost_usd) / wr.estimated_cost_usd * 100), 2)
        ELSE NULL 
    END AS variance_percentage,
    CASE 
        WHEN wr.estimated_cost_usd > 0 THEN COALESCE(actual_totals.total_actual_cost, 0) > (wr.estimated_cost_usd * 1.2)
        ELSE COALESCE(actual_totals.total_actual_cost, 0) > 0
    END AS budget_alert,
    COALESCE(jsonb_array_length(wr.attempt_metadata), 0) AS attempt_count
FROM
    workflow_requests wr
LEFT JOIN
    projects p ON wr.project_id = p.id
LEFT JOIN LATERAL (
    SELECT 
        SUM((elem->>'cost_usd')::numeric) AS total_actual_cost
    FROM 
        jsonb_array_elements(wr.attempt_metadata) AS elem
) AS actual_totals ON true;

COMMENT ON VIEW workflow_cost_variance_analysis IS 
'Compares estimated vs actual costs at the request level to monitor model routing accuracy.';