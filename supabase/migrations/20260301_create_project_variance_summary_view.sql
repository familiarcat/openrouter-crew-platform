-- ============================================================================
-- VIEW: project_cost_variance_summary
-- ============================================================================
-- Purpose: Aggregates cost variance metrics at the project level.
--          Used to identify projects where the ComplexityAnalyzer and 
--          ModelSelector are consistently inaccurate.
-- ============================================================================

CREATE OR REPLACE VIEW project_cost_variance_summary AS
SELECT
    project_id,
    project_name,
    COUNT(*) AS total_requests,
    ROUND(SUM(estimated_cost_usd), 6) AS total_estimated_usd,
    ROUND(SUM(total_actual_cost), 6) AS total_actual_usd,
    ROUND(SUM(total_actual_cost) - SUM(estimated_cost_usd), 6) AS total_variance_usd,
    CASE 
        WHEN SUM(estimated_cost_usd) > 0 
        THEN ROUND(((SUM(total_actual_cost) - SUM(estimated_cost_usd)) / SUM(estimated_cost_usd) * 100), 2)
        ELSE NULL 
    END AS aggregate_variance_percentage,
    COUNT(CASE WHEN budget_alert THEN 1 END) AS critical_alert_count,
    ROUND(AVG(attempt_count), 2) AS avg_attempts_per_request
FROM
    workflow_cost_variance_analysis
GROUP BY
    project_id, project_name
ORDER BY
    ABS(total_variance_usd) DESC;

COMMENT ON VIEW project_cost_variance_summary IS 
'Aggregated variance statistics per project to audit estimation accuracy and financial predictability.';