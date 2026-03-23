-- RPC function to get a full cost summary.
-- This moves aggregation from the client to the database for performance.
create or replace function get_cost_summary(period_days integer, project_filter text default null)
returns json as $$
declare
  from_date timestamp;
  result json;
begin
  from_date := now() - (period_days || ' days')::interval;

  with events as (
    select * from public.llm_usage_events 
    where created_at >= from_date
    and (project_filter is null or project_id = project_filter)
  ),
  totals as (
    select
      coalesce(sum(estimated_cost_usd), 0) as total_cost,
      coalesce(sum(total_tokens), 0) as total_tokens
    from events
  ),
  by_model as (
    select
      coalesce(model, 'unknown') as model,
      coalesce(sum(estimated_cost_usd), 0) as cost,
      coalesce(sum(total_tokens), 0) as tokens
    from events
    group by coalesce(model, 'unknown')
    order by cost desc
  ),
  by_crew_member as (
    select
      coalesce(crew_member, 'unknown') as member,
      coalesce(sum(estimated_cost_usd), 0) as cost,
      coalesce(sum(total_tokens), 0) as tokens
    from events
    group by coalesce(crew_member, 'unknown')
    order by cost desc
  )
  select
    json_build_object(
      'periodDays', period_days,
      'totalCost', (select total_cost from totals),
      'totalTokens', (select total_tokens from totals),
      'byModel', (select coalesce(json_agg(by_model), '[]') from by_model),
      'byCrewMember', (select coalesce(json_agg(by_crew_member), '[]') from by_crew_member)
    )
  into result;

  return result;
end;
$$ language plpgsql;

-- RPC function to get daily cost trends.
create or replace function get_cost_trend(period_days integer, project_filter text default null)
returns json as $$
begin
  return (
    select coalesce(json_agg(daily_data order by date asc), '[]')
    from (
      select
        date(created_at) as date,
        coalesce(sum(estimated_cost_usd), 0) as cost,
        coalesce(sum(total_tokens), 0) as tokens
      from public.llm_usage_events
      where created_at >= (now() - (period_days || ' days')::interval)
      and (project_filter is null or project_id = project_filter)
      group by date(created_at)
    ) as daily_data
  );
end;
$$ language plpgsql;

-- RPC function to get budget change history from memories.
create or replace function get_budget_history(project_filter text)
returns json as $$
begin
  return (
    select coalesce(json_agg(t order by created_at desc), '[]')
    from (
      select
        id,
        created_at,
        content,
        -- Extracts the numeric value from strings like "Set budget to $500.00" or "Set budget to 500"
        (regexp_matches(content, '(\d+\.?\d*)'))[1] as new_budget
      from public.memories
      where project_id = project_filter
      and (
        content ilike '%set budget to%' or
        content ilike '%budget changed to%'
      )
      and type = 'strategic_decision' -- Assuming budget changes are strategic decisions
    ) as t
  );
end;
$$ language plpgsql;

-- RPC function to get a detailed cost summary for a specific date range.
create or replace function get_detailed_cost_summary(start_date text, end_date text, project_filter text default null)
returns json as $$
declare
  from_date timestamp;
  to_date timestamp;
  result json;
begin
  from_date := start_date::timestamp;
  -- Add 1 day to end_date to make it inclusive of the whole day
  to_date := (end_date::date + interval '1 day')::timestamp;

  with events as (
    select * from public.llm_usage_events 
    where created_at >= from_date and created_at < to_date
    and (project_filter is null or project_id = project_filter)
  ),
  totals as (
    select
      coalesce(sum(estimated_cost_usd), 0) as total_cost,
      coalesce(sum(total_tokens), 0) as total_tokens
    from events
  ),
  by_model as (
    select
      coalesce(model, 'unknown') as model,
      coalesce(sum(estimated_cost_usd), 0) as cost,
      coalesce(sum(total_tokens), 0) as tokens
    from events
    group by coalesce(model, 'unknown')
    order by cost desc
  ),
  by_crew_member as (
    select
      coalesce(crew_member, 'unknown') as member,
      coalesce(sum(estimated_cost_usd), 0) as cost,
      coalesce(sum(total_tokens), 0) as tokens
    from events
    group by coalesce(crew_member, 'unknown')
    order by cost desc
  )
  select
    json_build_object(
      'startDate', start_date,
      'endDate', end_date,
      'totalCost', (select total_cost from totals),
      'totalTokens', (select total_tokens from totals),
      'byModel', (select coalesce(json_agg(by_model), '[]') from by_model),
      'byCrewMember', (select coalesce(json_agg(by_crew_member), '[]') from by_crew_member)
    )
  into result;

  return result;
end;
$$ language plpgsql;