-- ============================================================================
-- Migration: Create Analytical Views for CashFlow Scenarios
-- ============================================================================
-- Purpose: Create views for scenario analysis, aggregations, and exports
-- Views: scenario_transactions_v, weekly_aggregates_v, running_balance_v,
--        scenario_export_v
-- Author: Database Migration
-- Date: 2025-12-27
-- ============================================================================
-- Notes:
-- - Views do NOT use SECURITY DEFINER (rely on caller's RLS)
-- - All views include company_id and scenario_id for filtering
-- - Views merge transactions with scenario overrides
-- - Support Top-5 analysis, running balance, and Excel exports
-- ============================================================================

-- ============================================================================
-- View: scenario_transactions_v
-- ============================================================================
-- Purpose: Merge transactions with scenario overrides to show "effective" values
-- Contract:
-- - company_id, scenario_id for filtering
-- - original values from transactions
-- - effective values with COALESCE(override, original)
-- - filtered by scenario date range (except IB)
-- ============================================================================
create or replace view scenario_transactions_v as
select
  -- Identifiers
  s.company_id,
  s.id as scenario_id,
  t.id as transaction_id,
  t.dataset_code,
  t.flow_id,
  
  -- Classification
  t.direction,
  t.time_slot,
  
  -- Transaction currency (immutable)
  t.currency_tx,
  t.amount_tx_cents,
  t.fx_rate,
  
  -- Original values (from transactions)
  t.amount_book_cents as amount_book_cents_original,
  t.date_due as date_due_original,
  
  -- Effective values (with scenario overrides applied)
  coalesce(so.new_amount_book_cents, t.amount_book_cents) as amount_book_cents_effective,
  coalesce(so.new_date_due, t.date_due) as date_due_effective,
  
  -- Metadata
  t.project,
  t.counterparty,
  t.document,
  t.description,
  t.payment_source,
  
  -- Optional references
  t.account_id,
  
  -- Override tracking
  so.id as override_id,
  case when so.id is not null then true else false end as is_overridden
  
from scenarios s
inner join transactions t
  on t.company_id = s.company_id
  and t.dataset_code = s.dataset_code
  and t.is_active = true
left join scenario_overrides so
  on so.scenario_id = s.id
  and so.flow_id = t.flow_id
  and so.company_id = s.company_id

where
  -- Exclude soft-deleted scenarios
  s.deleted_at is null
  
  -- Date range filter: IB always included, others must be in range
  and (
    t.time_slot = 'IB'
    or coalesce(so.new_date_due, t.date_due) between s.start_date and s.end_date
  );

comment on view scenario_transactions_v is 'Merges transactions with scenario overrides to show effective values';

-- ============================================================================
-- View: weekly_aggregates_v
-- ============================================================================
-- Purpose: Weekly aggregations with Top-5 inflows/outflows and "Other"
-- Contract:
-- - company_id, scenario_id for filtering
-- - week_index (0 for IB, 1..N for weeks)
-- - total inflow/outflow amounts
-- - top5 JSON arrays for largest transactions
-- - other amounts (sum of non-top5)
-- ============================================================================
create or replace view weekly_aggregates_v as
with 
-- Base data with effective values
base_data as (
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
    project
  from scenario_transactions_v
),

-- Assign week_index: 0 for IB, extract week number from YYWW for others
week_assigned as (
  select
    *,
    case
      when time_slot = 'IB' then 0
      else substring(time_slot from 3 for 2)::integer
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

comment on view weekly_aggregates_v is 'Weekly aggregations with Top-5 transactions and Other category';

-- ============================================================================
-- View: running_balance_v
-- ============================================================================
-- Purpose: Calculate running balance (cumulative cash flow)
-- Contract:
-- - company_id, scenario_id for filtering
-- - as_of_date for each day
-- - delta_book_cents (signed: inflow positive, outflow negative)
-- - running_balance_book_cents (cumulative sum)
-- ============================================================================
create or replace view running_balance_v as
with 
-- Daily aggregates (signed amounts)
daily_flows as (
  select
    company_id,
    scenario_id,
    date_due_effective as as_of_date,
    sum(
      case 
        when direction = 'INFLOW' then amount_book_cents_effective
        when direction = 'OUTFLOW' then -amount_book_cents_effective
        else 0
      end
    ) as delta_book_cents
  from scenario_transactions_v
  group by company_id, scenario_id, date_due_effective
)

-- Calculate running balance using window function
select
  company_id,
  scenario_id,
  as_of_date,
  delta_book_cents,
  sum(delta_book_cents) over (
    partition by company_id, scenario_id
    order by as_of_date
    rows between unbounded preceding and current row
  ) as running_balance_book_cents
from daily_flows
order by company_id, scenario_id, as_of_date;

comment on view running_balance_v is 'Daily running balance with cumulative cash flow';

-- ============================================================================
-- View: scenario_export_v
-- ============================================================================
-- Purpose: Final scenario state with all details for Excel export
-- Contract:
-- - All transaction fields with effective values
-- - Running balance (optional, via LEFT JOIN)
-- - Suitable for direct export to Excel/CSV
-- ============================================================================
create or replace view scenario_export_v as
select
  st.company_id,
  st.scenario_id,
  
  -- Transaction identifiers
  st.transaction_id,
  st.flow_id,
  
  -- Effective values (after overrides)
  st.date_due_effective,
  st.amount_book_cents_effective,
  
  -- Classification
  st.direction,
  st.time_slot,
  
  -- Metadata
  st.project,
  st.counterparty,
  st.document,
  st.description,
  st.payment_source,
  
  -- Transaction currency details
  st.currency_tx,
  st.amount_tx_cents,
  st.fx_rate,
  
  -- Original values (for comparison)
  st.amount_book_cents_original,
  st.date_due_original,
  
  -- Override indicator
  st.is_overridden,
  
  -- Running balance (optional)
  rb.running_balance_book_cents,
  rb.delta_book_cents
  
from scenario_transactions_v st
left join running_balance_v rb
  on rb.company_id = st.company_id
  and rb.scenario_id = st.scenario_id
  and rb.as_of_date = st.date_due_effective

order by st.company_id, st.scenario_id, st.date_due_effective, st.transaction_id;

comment on view scenario_export_v is 'Complete scenario data for Excel/CSV export with running balance';

-- ============================================================================
-- View: scenario_summary_v (BONUS)
-- ============================================================================
-- Purpose: High-level scenario statistics and metrics
-- Contract:
-- - Total inflows, outflows, net balance
-- - Number of transactions, overrides
-- - Date range coverage
-- ============================================================================
create or replace view scenario_summary_v as
select
  s.company_id,
  s.id as scenario_id,
  s.name as scenario_name,
  s.status as scenario_status,
  s.dataset_code,
  s.start_date,
  s.end_date,
  s.created_at,
  s.locked_at,
  s.locked_by,
  
  -- Transaction counts
  count(st.transaction_id) as total_transactions,
  sum(case when st.is_overridden then 1 else 0 end) as overridden_transactions,
  
  -- Financial totals
  sum(case when st.direction = 'INFLOW' then st.amount_book_cents_effective else 0 end) as total_inflow_book_cents,
  sum(case when st.direction = 'OUTFLOW' then st.amount_book_cents_effective else 0 end) as total_outflow_book_cents,
  sum(
    case 
      when st.direction = 'INFLOW' then st.amount_book_cents_effective
      when st.direction = 'OUTFLOW' then -st.amount_book_cents_effective
      else 0
    end
  ) as net_balance_book_cents,
  
  -- Date coverage
  min(st.date_due_effective) as earliest_transaction_date,
  max(st.date_due_effective) as latest_transaction_date

from scenarios s
left join scenario_transactions_v st
  on st.scenario_id = s.id
  and st.company_id = s.company_id

where s.deleted_at is null

group by 
  s.company_id, s.id, s.name, s.status, s.dataset_code,
  s.start_date, s.end_date, s.created_at, s.locked_at, s.locked_by

order by s.company_id, s.created_at desc;

comment on view scenario_summary_v is 'High-level scenario statistics and financial summary';

-- ============================================================================
-- End of Migration: Create Analytical Views
-- ============================================================================
