-- ============================================================================
-- Migration: Create Indexes for CashFlow Scenarios
-- ============================================================================
-- Purpose: Add performance indexes for multi-tenant queries and aggregations
-- Affected Tables: company_members, imports, import_rows, accounts, 
--                  transactions, scenarios, scenario_overrides
-- Author: Database Migration
-- Date: 2025-12-27
-- ============================================================================
-- Notes:
-- - All indexes include company_id as first component for tenant isolation
-- - Partial indexes used for business key constraints (is_active, deleted_at)
-- - GIN index for full-text search on transactions
-- - Indexes support RLS policies, aggregations, and common query patterns
-- ============================================================================

-- ============================================================================
-- Indexes: company_members
-- ============================================================================
-- Purpose: Support RLS checks and user-company lookup
-- ============================================================================

-- Primary key already provides: (company_id, user_id)
-- Unique constraint already provides: (user_id, company_id)

comment on constraint company_members_pkey on company_members is 'Supports RLS EXISTS checks by company_id';
comment on constraint company_members_user_company_unique on company_members is 'Supports queries for user memberships and FK from user_profiles';

-- ============================================================================
-- Indexes: imports
-- ============================================================================
-- Purpose: Find latest import for dataset_code, filter by status
-- ============================================================================

-- Find most recent import for a dataset within a company
create index imports_company_dataset_created_idx 
  on imports(company_id, dataset_code, created_at desc);

comment on index imports_company_dataset_created_idx is 'Supports finding latest import for dataset_code per company';

-- Filter imports by status (e.g., show only completed imports)
create index imports_company_status_created_idx 
  on imports(company_id, status, created_at desc);

comment on index imports_company_status_created_idx is 'Supports filtering imports by status and ordering by date';

-- ============================================================================
-- Indexes: import_rows
-- ============================================================================
-- Purpose: Access rows for specific import, filter valid/invalid
-- ============================================================================

-- Unique constraint already provides: (import_id, row_number)

-- Access all rows for a company's import
create index import_rows_company_import_idx 
  on import_rows(company_id, import_id);

comment on index import_rows_company_import_idx is 'Supports querying all rows for a company import';

-- Filter valid vs invalid rows for error reporting
create index import_rows_import_is_valid_idx 
  on import_rows(import_id, is_valid);

comment on index import_rows_import_is_valid_idx is 'Supports filtering rows by validation status';

-- ============================================================================
-- Indexes: accounts
-- ============================================================================
-- Purpose: Unique account names per company, filter by currency
-- ============================================================================

-- Unique constraint already provides: (company_id, name)

-- Filter accounts by currency
create index accounts_company_currency_idx 
  on accounts(company_id, currency);

comment on index accounts_company_currency_idx is 'Supports filtering accounts by currency';

-- ============================================================================
-- Indexes: transactions
-- ============================================================================
-- Purpose: Business key uniqueness, date-range queries, aggregations, search
-- ============================================================================

-- Business key: One active version per (company_id, dataset_code, flow_id)
-- Partial index only on active records
create unique index transactions_active_key_ux 
  on transactions(company_id, dataset_code, flow_id) 
  where is_active = true;

comment on index transactions_active_key_ux is 'Enforces unique active transaction per (company_id, dataset_code, flow_id)';

-- Date-range queries (core for cash flow analysis)
create index transactions_company_date_idx 
  on transactions(company_id, date_due);

comment on index transactions_company_date_idx is 'Supports date-range queries for cash flow reports';

-- Filter by direction and date (INFLOW vs OUTFLOW aggregations)
create index transactions_company_direction_date_idx 
  on transactions(company_id, direction, date_due);

comment on index transactions_company_direction_date_idx is 'Supports filtering by direction and date for aggregations';

-- Filter by time_slot (IB vs weekly periods)
create index transactions_company_time_slot_idx 
  on transactions(company_id, time_slot);

comment on index transactions_company_time_slot_idx is 'Supports filtering by time slot (IB or YYWW)';

-- Filter by dataset_code (scenario data isolation)
create index transactions_company_dataset_idx 
  on transactions(company_id, dataset_code);

comment on index transactions_company_dataset_idx is 'Supports filtering transactions by dataset_code for scenarios';

-- Access transactions by import (audit trail)
create index transactions_company_import_idx 
  on transactions(company_id, import_id);

comment on index transactions_company_import_idx is 'Supports querying all transactions from a specific import';

-- Filter by project (nullable, but useful for grouping)
create index transactions_company_project_idx 
  on transactions(company_id, project);

comment on index transactions_company_project_idx is 'Supports filtering and grouping by project (includes NULL)';

-- Filter by counterparty (nullable, but useful for grouping)
create index transactions_company_counterparty_idx 
  on transactions(company_id, counterparty);

comment on index transactions_company_counterparty_idx is 'Supports filtering and grouping by counterparty (includes NULL)';

-- Full-text search on description, counterparty, project, document
-- Using 'simple' configuration (no stemming) for exact phrase matching
create index transactions_search_gin 
  on transactions 
  using gin (
    to_tsvector('simple', 
      coalesce(description,'') || ' ' || 
      coalesce(counterparty,'') || ' ' || 
      coalesce(project,'') || ' ' || 
      coalesce(document,'')
    )
  );

comment on index transactions_search_gin is 'Full-text search on description, counterparty, project, and document';

-- ============================================================================
-- Indexes: scenarios
-- ============================================================================
-- Purpose: Find scenarios by dataset, status, unique names
-- ============================================================================

-- Filter scenarios by dataset_code
create index scenarios_company_dataset_idx 
  on scenarios(company_id, dataset_code);

comment on index scenarios_company_dataset_idx is 'Supports finding all scenarios for a dataset_code';

-- Filter scenarios by status (Draft vs Locked)
create index scenarios_company_status_idx 
  on scenarios(company_id, status);

comment on index scenarios_company_status_idx is 'Supports filtering scenarios by status';

-- Order scenarios by creation date
create index scenarios_company_created_idx 
  on scenarios(company_id, created_at desc);

comment on index scenarios_company_created_idx is 'Supports ordering scenarios by creation date';

-- Unique scenario name per company and import (excluding soft-deleted)
-- Partial index only on non-deleted records
create unique index scenarios_name_ux 
  on scenarios(company_id, import_id, name) 
  where deleted_at is null;

comment on index scenarios_name_ux is 'Enforces unique scenario name per (company_id, import_id) for active scenarios';

-- ============================================================================
-- Indexes: scenario_overrides
-- ============================================================================
-- Purpose: Lookup overrides by scenario and flow_id
-- ============================================================================

-- Unique constraint already provides: (company_id, scenario_id, flow_id)

-- Access all overrides for a scenario
create index scenario_overrides_company_scenario_idx 
  on scenario_overrides(company_id, scenario_id);

comment on index scenario_overrides_company_scenario_idx is 'Supports querying all overrides for a scenario';

-- Find override for a specific flow_id across scenarios (rare, but possible)
create index scenario_overrides_company_flow_idx 
  on scenario_overrides(company_id, flow_id);

comment on index scenario_overrides_company_flow_idx is 'Supports finding overrides for a specific flow_id';

-- ============================================================================
-- End of Migration: Create Indexes
-- ============================================================================
