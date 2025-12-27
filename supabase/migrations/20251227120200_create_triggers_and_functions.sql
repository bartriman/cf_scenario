-- ============================================================================
-- Migration: Create Triggers and Functions for CashFlow Scenarios
-- ============================================================================
-- Purpose: Implement business rules and data consistency via triggers
-- Affected Tables: imports, scenario_overrides, scenarios
-- Author: Database Migration
-- Date: 2025-12-27
-- ============================================================================
-- Notes:
-- - Block dataset_code changes after import completion
-- - Auto-update updated_at timestamp on scenario_overrides
-- - Enforce company_id consistency in scenario_overrides
-- - Validate flow_id exists in transactions (optional)
-- - Helper function to get latest import for dataset_code
-- ============================================================================

-- ============================================================================
-- Function: get_latest_import_id
-- ============================================================================
-- Purpose: Get the most recent completed import for a dataset_code
-- Usage: Called when creating/updating scenarios to ensure they point to
--        the latest import
-- ============================================================================
create or replace function get_latest_import_id(
  p_company_id uuid,
  p_dataset_code text
)
returns bigint
language sql
stable
as $$
  select id
  from imports
  where company_id = p_company_id
    and dataset_code = p_dataset_code
    and status = 'completed'
  order by created_at desc
  limit 1;
$$;

comment on function get_latest_import_id is 'Returns the most recent completed import ID for a dataset_code';

-- ============================================================================
-- Trigger Function: prevent_dataset_code_change_after_completion
-- ============================================================================
-- Purpose: Block changes to imports.dataset_code after status='completed'
-- Reason: Scenarios and transactions reference dataset_code; changing it
--         would break referential integrity
-- ============================================================================
create or replace function prevent_dataset_code_change_after_completion()
returns trigger
language plpgsql
as $$
begin
  -- Only check on UPDATE when status is already 'completed'
  if old.status = 'completed' and new.dataset_code <> old.dataset_code then
    raise exception 'Cannot change dataset_code after import is completed (import_id: %)', old.id;
  end if;
  
  return new;
end;
$$;

comment on function prevent_dataset_code_change_after_completion is 'Prevents modifying dataset_code after import completion';

-- Create trigger on imports table
create trigger trg_prevent_dataset_code_change
  before update on imports
  for each row
  execute function prevent_dataset_code_change_after_completion();

comment on trigger trg_prevent_dataset_code_change on imports is 'Blocks dataset_code changes after status=completed';

-- ============================================================================
-- Trigger Function: update_scenario_overrides_updated_at
-- ============================================================================
-- Purpose: Auto-update updated_at timestamp on scenario_overrides changes
-- Reason: Track when overrides were last modified for audit purposes
-- ============================================================================
create or replace function update_scenario_overrides_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now() at time zone 'utc';
  return new;
end;
$$;

comment on function update_scenario_overrides_updated_at is 'Auto-updates updated_at timestamp on override changes';

-- Create trigger on scenario_overrides table
create trigger trg_update_scenario_overrides_updated_at
  before update on scenario_overrides
  for each row
  execute function update_scenario_overrides_updated_at();

comment on trigger trg_update_scenario_overrides_updated_at on scenario_overrides is 'Maintains updated_at timestamp';

-- ============================================================================
-- Trigger Function: enforce_scenario_override_company_id
-- ============================================================================
-- Purpose: Ensure scenario_overrides.company_id matches scenarios.company_id
-- Reason: Maintain data consistency and prevent cross-company data leaks
-- ============================================================================
create or replace function enforce_scenario_override_company_id()
returns trigger
language plpgsql
as $$
declare
  v_scenario_company_id uuid;
begin
  -- Get the company_id from the referenced scenario
  select company_id into v_scenario_company_id
  from scenarios
  where id = new.scenario_id;
  
  -- Check if scenario exists
  if v_scenario_company_id is null then
    raise exception 'Scenario not found (scenario_id: %)', new.scenario_id;
  end if;
  
  -- Enforce company_id consistency
  if new.company_id <> v_scenario_company_id then
    raise exception 'scenario_overrides.company_id (%) must match scenarios.company_id (%) for scenario_id %',
      new.company_id, v_scenario_company_id, new.scenario_id;
  end if;
  
  return new;
end;
$$;

comment on function enforce_scenario_override_company_id is 'Enforces company_id consistency between scenario_overrides and scenarios';

-- Create trigger on scenario_overrides table
create trigger trg_enforce_scenario_override_company_id
  before insert or update on scenario_overrides
  for each row
  execute function enforce_scenario_override_company_id();

comment on trigger trg_enforce_scenario_override_company_id on scenario_overrides is 'Validates company_id matches scenario';

-- ============================================================================
-- Trigger Function: validate_override_flow_id_exists (OPTIONAL)
-- ============================================================================
-- Purpose: Check that flow_id exists in active transactions for the scenario
-- Reason: Prevent orphaned overrides for non-existent transactions
-- Note: This is optional - uncomment if strict validation is desired
-- ============================================================================
create or replace function validate_override_flow_id_exists()
returns trigger
language plpgsql
as $$
declare
  v_dataset_code text;
  v_transaction_exists boolean;
begin
  -- Get dataset_code from the scenario
  select dataset_code into v_dataset_code
  from scenarios
  where id = new.scenario_id;
  
  -- Check if an active transaction exists for this flow_id
  select exists(
    select 1
    from transactions
    where company_id = new.company_id
      and dataset_code = v_dataset_code
      and flow_id = new.flow_id
      and is_active = true
  ) into v_transaction_exists;
  
  -- Raise exception if no matching transaction found
  if not v_transaction_exists then
    raise exception 'No active transaction found for flow_id "%" in dataset "%" (company_id: %)',
      new.flow_id, v_dataset_code, new.company_id;
  end if;
  
  return new;
end;
$$;

comment on function validate_override_flow_id_exists is 'Validates that override flow_id exists in active transactions';

-- OPTIONAL: Uncomment to enable strict flow_id validation
-- create trigger trg_validate_override_flow_id_exists
--   before insert or update on scenario_overrides
--   for each row
--   execute function validate_override_flow_id_exists();

-- comment on trigger trg_validate_override_flow_id_exists on scenario_overrides is 'Validates flow_id exists in transactions';

-- ============================================================================
-- Trigger Function: prevent_locked_scenario_modification
-- ============================================================================
-- Purpose: Prevent modification of scenario fields when status='Locked'
-- Reason: Locked scenarios should be immutable (except for soft-delete)
-- Allowed changes: deleted_at can always be set
-- ============================================================================
create or replace function prevent_locked_scenario_modification()
returns trigger
language plpgsql
as $$
begin
  -- Only check on UPDATE when status is 'Locked'
  if old.status = 'Locked' then
    -- Allow soft-delete (setting deleted_at)
    if new.deleted_at is distinct from old.deleted_at then
      return new;
    end if;
    
    -- Block any other changes to locked scenarios
    if new.name <> old.name 
      or new.start_date <> old.start_date 
      or new.end_date <> old.end_date 
      or new.base_scenario_id is distinct from old.base_scenario_id
      or new.dataset_code <> old.dataset_code
      or new.import_id <> old.import_id then
      raise exception 'Cannot modify locked scenario (scenario_id: %). Only unlocking or deletion is allowed.', old.id;
    end if;
  end if;
  
  return new;
end;
$$;

comment on function prevent_locked_scenario_modification is 'Prevents modifying locked scenarios except for soft-delete';

-- Create trigger on scenarios table
create trigger trg_prevent_locked_scenario_modification
  before update on scenarios
  for each row
  execute function prevent_locked_scenario_modification();

comment on trigger trg_prevent_locked_scenario_modification on scenarios is 'Blocks modifications to locked scenarios';

-- ============================================================================
-- Function: set_scenario_locked
-- ============================================================================
-- Purpose: Helper function to lock a scenario (sets status='Locked', locked_at, locked_by)
-- Usage: Called from application or Edge Functions to lock scenarios
-- ============================================================================
create or replace function set_scenario_locked(
  p_scenario_id bigint,
  p_locked_by uuid
)
returns void
language plpgsql
security definer -- Runs with owner privileges
as $$
begin
  update scenarios
  set 
    status = 'Locked',
    locked_at = now() at time zone 'utc',
    locked_by = p_locked_by
  where id = p_scenario_id
    and status = 'Draft'; -- Only lock Draft scenarios
  
  if not found then
    raise exception 'Scenario % not found or already locked', p_scenario_id;
  end if;
end;
$$;

comment on function set_scenario_locked is 'Locks a scenario by setting status=Locked and audit fields';

-- ============================================================================
-- Function: set_scenario_unlocked
-- ============================================================================
-- Purpose: Helper function to unlock a scenario (sets status='Draft', clears locked_*)
-- Usage: Called from application or Edge Functions to unlock scenarios
-- ============================================================================
create or replace function set_scenario_unlocked(
  p_scenario_id bigint
)
returns void
language plpgsql
security definer -- Runs with owner privileges
as $$
begin
  update scenarios
  set 
    status = 'Draft',
    locked_at = null,
    locked_by = null
  where id = p_scenario_id
    and status = 'Locked'; -- Only unlock Locked scenarios
  
  if not found then
    raise exception 'Scenario % not found or already unlocked', p_scenario_id;
  end if;
end;
$$;

comment on function set_scenario_unlocked is 'Unlocks a scenario by setting status=Draft and clearing lock fields';

-- ============================================================================
-- Function: soft_delete_scenario
-- ============================================================================
-- Purpose: Helper function to soft-delete a scenario (sets deleted_at)
-- Usage: Called from application to mark scenarios as deleted
-- ============================================================================
create or replace function soft_delete_scenario(
  p_scenario_id bigint
)
returns void
language plpgsql
security definer -- Runs with owner privileges
as $$
begin
  update scenarios
  set deleted_at = now() at time zone 'utc'
  where id = p_scenario_id
    and deleted_at is null; -- Only delete non-deleted scenarios
  
  if not found then
    raise exception 'Scenario % not found or already deleted', p_scenario_id;
  end if;
end;
$$;

comment on function soft_delete_scenario is 'Soft-deletes a scenario by setting deleted_at timestamp';

-- ============================================================================
-- End of Migration: Create Triggers and Functions
-- ============================================================================
