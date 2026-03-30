-- Enable the pg_net extension to allow HTTP requests from Postgres
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to notify n8n when a deployment fails
CREATE OR REPLACE FUNCTION public.notify_n8n_on_deployment_error()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on 'error' status
  IF (NEW.status = 'error') THEN
    PERFORM net.http_post(
      -- Adjust the URL to match your n8n internal networking
      -- 'host.docker.internal' is typically used for local Docker setups
      url := 'http://host.docker.internal:5678/webhook/crew-optimize',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Webhook-Secret', coalesce(current_setting('app.settings.n8n_webhook_secret', true), 'dev-secret-placeholder')
      ),
      body := jsonb_build_object(
        'event', 'deployment_failure',
        'project_id', NEW.project_id,
        'platform', NEW.platform,
        'environment', NEW.environment,
        'commit_sha', NEW.commit_sha,
        'metadata', NEW.metadata,
        'timestamp', now()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute after a new log is inserted or an existing one updated to 'error'
DROP TRIGGER IF EXISTS tr_notify_n8n_on_error ON deployment_logs;
CREATE TRIGGER tr_notify_n8n_on_error
  AFTER INSERT OR UPDATE OF status ON deployment_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_n8n_on_deployment_error();