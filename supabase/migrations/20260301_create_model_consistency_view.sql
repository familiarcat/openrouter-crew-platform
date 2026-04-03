-- ============================================================================
-- VIEW: model_consistency_stats
-- ============================================================================
-- Purpose: Aggregates consistency scores from the attempt_metadata JSONB array
--          to identify which models are performing most reliably.
-- ============================================================================

CREATE OR REPLACE VIEW model_consistency_stats AS
SELECT
    elem->>'model' AS model,
    ROUND(AVG((elem->>'consistency_score')::numeric), 4) AS avg_consistency_score,
    COUNT(*) AS total_attempts,
    MIN((elem->>'consistency_score')::numeric) AS min_score,
    MAX((elem->>'consistency_score')::numeric) AS max_score
FROM
    workflow_requests,
    LATERAL jsonb_array_elements(attempt_metadata) AS elem
WHERE
    attempt_metadata IS NOT NULL
    AND jsonb_array_length(attempt_metadata) > 0
GROUP BY
    elem->>'model'
ORDER BY
    avg_consistency_score DESC;