-- ============================================================================
-- MIGRATION: Add Project Variance Alert Trigger
-- ============================================================================
-- Purpose: Monitor project-wide cost variance and notify n8n if the 
--          aggregate variance exceeds 30%.
-- ============================================================================

-- Ensure pg_net is available for outgoing notifications
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to evaluate aggregate variance and send notification
CREATE OR REPLACE FUNCTION public.check_project_variance_and_notify()
RETURNS TRIGGER AS $$
DECLARE
  v_variance_pct NUMERIC;
  v_project_name TEXT;
BEGIN
  -- Get the current aggregate variance for the project from the summary view
  -- This view calculates the difference between estimated and actual costs across all requests
  SELECT aggregate_variance_percentage, project_name 
  INTO v_variance_pct, v_project_name
  FROM public.project_cost_variance_summary 
  WHERE project_id = NEW.project_id;

  -- Trigger notification if variance exceeds the 30% threshold
  IF (v_variance_pct > 30) THEN
    PERFORM net.http_post(
      url := 'http://host.docker.internal:5678/webhook/crew-optimize',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Webhook-Secret', coalesce(current_setting('app.settings.n8n_webhook_secret', true), 'dev-secret-placeholder')
      ),
      body := jsonb_build_object(
        'event', 'project_variance_alert',
        'project_id', NEW.project_id,
        'project_name', v_project_name,
        'aggregate_variance_percentage', v_variance_pct,
        'severity', 'CRITICAL',
        'trigger_source', 'workflow_requests_update',
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger firing after cost updates to ensure the view has updated data
DROP TRIGGER IF EXISTS tr_check_project_variance ON public.workflow_requests;
CREATE TRIGGER tr_check_project_variance
  AFTER UPDATE OF actual_cost_usd, attempt_metadata ON public.workflow_requests
  FOR EACH ROW
  WHEN (NEW.project_id IS NOT NULL)
  EXECUTE FUNCTION public.check_project_variance_and_notify();

COMMENT ON FUNCTION public.check_project_variance_and_notify IS 
'Calculates project-wide variance after a request update and notifies n8n if costs are >30% over estimate.';