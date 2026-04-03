-- ============================================================================
-- VIEW: project_cost_aggregation
-- ============================================================================
-- Purpose: Calculates total aggregate cost per project by summing the 
--          individual cost_usd entries inside the attempt_metadata array.
--          This captures the cost of all retries and model upgrades.
-- ============================================================================

CREATE OR REPLACE VIEW project_cost_aggregation AS
SELECT
    wr.project_id,
    p.name AS project_name,
    ROUND(SUM((elem->>'cost_usd')::numeric), 6) AS total_cost_usd,
    COUNT(elem) AS total_attempts_count,
    MAX((elem->>'timestamp')::timestamptz) AS last_attempt_at
FROM
    workflow_requests wr
LEFT JOIN
    projects p ON wr.project_id = p.id,
    LATERAL jsonb_array_elements(wr.attempt_metadata) AS elem
WHERE
    wr.attempt_metadata IS NOT NULL
    AND jsonb_array_length(wr.attempt_metadata) > 0
GROUP BY
    wr.project_id, p.name;