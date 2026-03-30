import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with Service Role Key to manage internal logs
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const payload = await req.json()
    const { 
      project_id, 
      platform, 
      environment, 
      status, 
      commit_sha, 
      build_url, 
      deployment_id,
      metadata 
    } = payload

    // Basic validation for bedrock fields
    if (!project_id || !platform || !status) {
      throw new Error('Missing required fields: project_id, platform, and status are mandatory.')
    }

    let logId = payload.id;

    // Logic: If no specific ID is provided but we have a commit_sha, 
    // try to find an existing 'building' or 'queued' record to update 
    // instead of creating a duplicate for the same build.
    if (!logId && commit_sha && platform !== 'local') {
      const { data: existing } = await supabaseClient
        .from('deployment_logs')
        .select('id')
        .eq('project_id', project_id)
        .eq('commit_sha', commit_sha)
        .eq('platform', platform)
        .in('status', ['queued', 'building'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (existing) logId = existing.id
    }

    const logEntry = {
      project_id,
      platform,
      environment: environment || 'development',
      status,
      commit_sha,
      build_url,
      deployment_id,
      metadata: metadata || {},
      updated_at: new Date().toISOString(),
    }

    const request = logId 
      ? supabaseClient.from('deployment_logs').update(logEntry).eq('id', logId).select()
      : supabaseClient.from('deployment_logs').insert([logEntry]).select()

    const { data, error } = await request
    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})