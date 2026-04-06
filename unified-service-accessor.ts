/**
 * unified-service-accessor.ts
 * Stub created by crew-fix-remaining.sh
 *
 * This utility was originally sourced from outside the domain boundary.
 * Wire up the real implementation against your Supabase/n8n service layer.
 *
 * TODO: Replace stub exports with real implementations from
 *       @openrouter-crew/crew-api-client or domains/shared/
 */

export interface ServiceAccessorConfig {
  supabaseUrl?: string
  supabaseKey?: string
  n8nWebhookUrl?: string
}

export function getServiceAccessor(config?: ServiceAccessorConfig) {
  const url  = config?.supabaseUrl   ?? process.env.NEXT_PUBLIC_SUPABASE_URL   ?? ''
  const key  = config?.supabaseKey   ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const hook = config?.n8nWebhookUrl ?? process.env.N8N_WEBHOOK_URL            ?? ''

  return {
    supabaseUrl:   url,
    supabaseKey:   key,
    n8nWebhookUrl: hook,
    isConfigured:  Boolean(url && key),
  }
}

export default getServiceAccessor