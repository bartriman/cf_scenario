-- ============================================================================
-- Migration: Fix Initial Balance (IB) Logic
-- ============================================================================
-- Purpose: Update weekly_aggregates_v to properly handle Initial Balance
--          - Identify IB by time_slot='IB' OR due_date='IB'
--          - Sum IB as net (INFLOW - OUTFLOW) in week 0
--          - Prevent overrides for IB transactions
-- Author: Database Migration
-- Date: 2026-01-18
-- ============================================================================

-- ============================================================================
-- Step 1: Update weekly_aggregates_v to handle due_date='IB' condition
-- ============================================================================

drop view if exists weekly_aggregates_v;

create or replace view weekly_aggregates_v as
with 
-- Base data with effective values and scenario metadata
base_data as (
  select
    stv.company_id,
    stv.scenario_id,
    stv.transaction_id,
    stv.flow_id,
    stv.direction,
    stv.time_slot,
    stv.amount_book_cents_effective,
    stv.date_due_effective,
    stv.counterparty,
    stv.description,
    stv.project,
    s.start_date as scenario_start_date
  from scenario_transactions_v stv
  inner join scenarios s on s.id = stv.scenario_id and s.company_id = stv.company_id
),

-- Calculate week_index: 0 for IB (time_slot='IB' OR date_due='IB'), week number from scenario start for others
week_assigned as (
  select
    company_id,
    scenario_id,
    transaction_id,
    flow_id,
    direction,
    time_slot,
    amount_book_cents_effective,
    date_due_effective,
    counterparty,
    description,
    project,
    case
      -- Initial Balance: check both time_slot and date_due (cast date to text for comparison)
      when time_slot = 'IB' or date_due_effective::text = 'IB' then 0
      -- Calculate week index: 1-based, from scenario start date
      else 1 + ((date_due_effective::date - scenario_start_date) / 7)::integer
    end as week_index
  from base_data
),

-- Rank transactions within each week and direction
ranked_transactions as (
  select
    company_id,
    scenario_id,
    week_index,
    direction,
    transaction_id,
    flow_id,
    amount_book_cents_effective,
    date_due_effective,
    counterparty,
    description,
    project,
    row_number() over (
      partition by company_id, scenario_id, week_index, direction
      order by amount_book_cents_effective desc
    ) as rank
  from week_assigned
),

-- Top 5 transactions per week and direction
top5_transactions as (
  select
    company_id,
    scenario_id,
    week_index,
    direction,
    jsonb_agg(
      jsonb_build_object(
        'flow_id', flow_id,
        'amount_book_cents', amount_book_cents_effective,
        'counterparty', counterparty,
        'description', description,
        'date_due', date_due_effective,
        'project', project
      )
      order by rank
    ) as top5_list
  from ranked_transactions
  where rank <= 5
  group by company_id, scenario_id, week_index, direction
),

-- Sum of all transactions (for totals)
week_totals as (
  select
    company_id,
    scenario_id,
    week_index,
    direction,
    sum(amount_book_cents_effective) as total_amount
  from week_assigned
  group by company_id, scenario_id, week_index, direction
),

-- Sum of top 5 (to calculate "Other")
top5_sums as (
  select
    company_id,
    scenario_id,
    week_index,
    direction,
    sum(amount_book_cents_effective) as top5_sum
  from ranked_transactions
  where rank <= 5
  group by company_id, scenario_id, week_index, direction
),

-- Get all unique weeks
all_weeks as (
  select distinct
    company_id,
    scenario_id,
    week_index
  from week_assigned
)

-- Final aggregation: pivot by direction
select
  w.company_id,
  w.scenario_id,
  w.week_index,
  
  -- Inflow totals and details
  coalesce(wt_in.total_amount, 0) as inflow_total_book_cents,
  coalesce(t5_in.top5_list, '[]'::jsonb) as inflow_top5,
  coalesce(wt_in.total_amount - ts_in.top5_sum, 0) as inflow_other_book_cents,
  
  -- Outflow totals and details
  coalesce(wt_out.total_amount, 0) as outflow_total_book_cents,
  coalesce(t5_out.top5_list, '[]'::jsonb) as outflow_top5,
  coalesce(wt_out.total_amount - ts_out.top5_sum, 0) as outflow_other_book_cents

from all_weeks w

-- Join INFLOW data
left join week_totals wt_in
  on wt_in.company_id = w.company_id
  and wt_in.scenario_id = w.scenario_id
  and wt_in.week_index = w.week_index
  and wt_in.direction = 'INFLOW'
left join top5_transactions t5_in
  on t5_in.company_id = w.company_id
  and t5_in.scenario_id = w.scenario_id
  and t5_in.week_index = w.week_index
  and t5_in.direction = 'INFLOW'
left join top5_sums ts_in
  on ts_in.company_id = w.company_id
  and ts_in.scenario_id = w.scenario_id
  and ts_in.week_index = w.week_index
  and ts_in.direction = 'INFLOW'

-- Join OUTFLOW data
left join week_totals wt_out
  on wt_out.company_id = w.company_id
  and wt_out.scenario_id = w.scenario_id
  and wt_out.week_index = w.week_index
  and wt_out.direction = 'OUTFLOW'
left join top5_transactions t5_out
  on t5_out.company_id = w.company_id
  and t5_out.scenario_id = w.scenario_id
  and t5_out.week_index = w.week_index
  and t5_out.direction = 'OUTFLOW'
left join top5_sums ts_out
  on ts_out.company_id = w.company_id
  and ts_out.scenario_id = w.scenario_id
  and ts_out.week_index = w.week_index
  and ts_out.direction = 'OUTFLOW'

order by w.company_id, w.scenario_id, w.week_index;

comment on view weekly_aggregates_v is 'Weekly aggregations with Top-5 transactions and Other category - week_index=0 for IB (time_slot=IB or date_due=IB), calculated from date_due_effective for others';

-- ============================================================================
-- Step 2: Add trigger to prevent overrides for Initial Balance transactions
-- ============================================================================

create or replace function prevent_ib_override()
returns trigger
language plpgsql
as $$
declare
  v_time_slot text;
  v_date_due date;
begin
  -- Get the transaction's time_slot and date_due
  select time_slot, date_due
  into v_time_slot, v_date_due
  from transactions
  where company_id = NEW.company_id
    and flow_id = NEW.flow_id
  limit 1;

  -- Check if transaction is Initial Balance
  if v_time_slot = 'IB' or v_date_due::text = 'IB' then
    raise exception 'Cannot create override for Initial Balance (IB) transaction. IB transactions are read-only.'
      using errcode = 'check_violation',
            detail = format('flow_id: %s is an Initial Balance transaction', NEW.flow_id);
  end if;

  return NEW;
end;
$$;

comment on function prevent_ib_override() is 'Prevents creation of overrides for Initial Balance transactions (time_slot=IB or date_due=IB)';

-- Create trigger on scenario_overrides table
drop trigger if exists prevent_ib_override_trigger on scenario_overrides;

create trigger prevent_ib_override_trigger
  before insert or update on scenario_overrides
  for each row
  execute function prevent_ib_override();

comment on trigger prevent_ib_override_trigger on scenario_overrides is 'Blocks override creation/update for IB transactions';
