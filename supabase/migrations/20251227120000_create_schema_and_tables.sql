-- ============================================================================
-- Migration: Create CashFlow Scenarios Schema and Tables
-- ============================================================================
-- Purpose: Initialize database schema for multi-tenant CashFlow scenarios MVP
-- Tables: companies, company_members, user_profiles, imports, import_rows,
--         accounts, transactions, scenarios, scenario_overrides
-- Author: Database Migration
-- Date: 2025-12-27
-- ============================================================================
-- Notes:
-- - All monetary amounts stored as bigint in cents (non-negative)
-- - All timestamps are 'timestamp without time zone', interpreted as UTC
-- - Multi-tenant architecture with company_id on all domain tables
-- - RLS enabled on all tables with policies based on company_members
-- - Transactions are append-only from user perspective
-- - Migration structure: 1) Tables, 2) Enable RLS, 3) Create Policies
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE ALL TABLES
-- ============================================================================

-- ============================================================================
-- Table: companies
-- ============================================================================
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  base_currency char(3) not null check (base_currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'UTC' check (length(trim(timezone)) > 0),
  created_at timestamp without time zone not null default (now() at time zone 'utc')
);

comment on table companies is 'Multi-tenant companies with base currency configuration';
comment on column companies.base_currency is 'ISO 4217 three-letter currency code';
comment on column companies.timezone is 'IANA timezone identifier';

-- ============================================================================
-- Table: company_members
-- ============================================================================
create table company_members (
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null,
  joined_at timestamp without time zone not null default (now() at time zone 'utc'),
  primary key (company_id, user_id)
);

alter table company_members add constraint company_members_user_company_unique unique (user_id, company_id);

comment on table company_members is 'Multi-tenant membership mapping users to companies';
comment on column company_members.user_id is 'References auth.users.id from Supabase Auth';

-- ============================================================================
-- Table: user_profiles
-- ============================================================================
create table user_profiles (
  user_id uuid primary key,
  default_company_id uuid null,
  created_at timestamp without time zone not null default (now() at time zone 'utc'),
  foreign key (user_id, default_company_id) 
    references company_members(user_id, company_id) 
    on delete restrict
);

comment on table user_profiles is 'User profile with default company preference';
comment on column user_profiles.user_id is 'References auth.users.id from Supabase Auth';

-- ============================================================================
-- Table: imports
-- ============================================================================
create table imports (
  id bigint generated always as identity primary key,
  company_id uuid not null references companies(id) on delete cascade,
  dataset_code text not null check (length(trim(dataset_code)) > 0),
  status text not null check (status in ('pending','processing','completed','failed')),
  total_rows integer not null default 0 check (total_rows >= 0),
  valid_rows integer not null default 0 check (valid_rows >= 0),
  invalid_rows integer not null default 0 check (invalid_rows >= 0),
  inserted_transactions_count integer not null default 0 check (inserted_transactions_count >= 0),
  error_report_json jsonb null,
  error_report_url text null,
  file_name text null,
  uploaded_by uuid null,
  created_at timestamp without time zone not null default (now() at time zone 'utc')
);

comment on table imports is 'CSV import batches with processing status and statistics';
comment on column imports.dataset_code is 'Stable identifier for logical dataset';
comment on column imports.uploaded_by is 'User ID who initiated the upload (auth.uid())';

-- ============================================================================
-- Table: import_rows
-- ============================================================================
create table import_rows (
  id bigint generated always as identity primary key,
  company_id uuid not null references companies(id) on delete cascade,
  import_id bigint not null references imports(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  raw_data jsonb not null,
  is_valid boolean not null default false,
  error_message text null,
  created_at timestamp without time zone not null default (now() at time zone 'utc'),
  unique (import_id, row_number)
);

comment on table import_rows is 'Detailed log of CSV rows including validation errors';
comment on column import_rows.raw_data is 'Original CSV row data as JSON';

-- ============================================================================
-- Table: accounts
-- ============================================================================
create table accounts (
  id bigint generated always as identity primary key,
  company_id uuid not null references companies(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  created_at timestamp without time zone not null default (now() at time zone 'utc'),
  unique (company_id, name)
);

comment on table accounts is 'Financial accounts for transaction categorization';
comment on column accounts.currency is 'ISO 4217 three-letter currency code';

-- ============================================================================
-- Table: transactions
-- ============================================================================
create table transactions (
  id bigint generated always as identity primary key,
  company_id uuid not null references companies(id) on delete cascade,
  import_id bigint not null references imports(id) on delete cascade,
  dataset_code text not null check (length(trim(dataset_code)) > 0),
  flow_id text not null check (length(trim(flow_id)) > 0),
  account_id bigint null references accounts(id) on delete set null,
  is_active boolean not null default true,
  
  -- Monetary fields: transaction currency
  amount_tx_cents bigint not null check (amount_tx_cents >= 0),
  currency_tx char(3) not null check (currency_tx ~ '^[A-Z]{3}$'),
  fx_rate numeric(18,6) null check (fx_rate is null or fx_rate > 0),
  
  -- Monetary fields: book currency (always company base_currency)
  amount_book_cents bigint not null check (amount_book_cents >= 0),
  
  -- Dates and categorization
  date_due date not null,
  direction text not null check (direction in ('INFLOW','OUTFLOW')),
  time_slot text not null check (time_slot ~ '^(IB|[0-9]{4})$'),
  
  -- Metadata
  project text null,
  counterparty text null,
  document text null,
  description text null,
  payment_source text not null check (length(trim(payment_source)) > 0),
  
  -- Audit
  created_at timestamp without time zone not null default (now() at time zone 'utc')
);

comment on table transactions is 'Base cash flow transactions (append-only from user perspective)';
comment on column transactions.flow_id is 'Business identifier for transaction within dataset';
comment on column transactions.is_active is 'Supports "one active version" model for transaction updates';
comment on column transactions.amount_tx_cents is 'Amount in transaction currency (cents, non-negative)';
comment on column transactions.amount_book_cents is 'Amount in company base currency (cents, non-negative)';
comment on column transactions.direction is 'Cash flow direction: INFLOW (positive) or OUTFLOW (negative)';
comment on column transactions.time_slot is 'IB for initial balance, YYWW for week number (e.g., 2401)';

-- ============================================================================
-- Table: scenarios
-- ============================================================================
create table scenarios (
  id bigint generated always as identity primary key,
  company_id uuid not null references companies(id) on delete cascade,
  import_id bigint not null references imports(id) on delete cascade,
  dataset_code text not null check (length(trim(dataset_code)) > 0),
  
  name text not null check (length(trim(name)) > 0),
  status text not null check (status in ('Draft','Locked')),
  base_scenario_id bigint null references scenarios(id) on delete set null,
  
  -- Analysis range
  start_date date not null,
  end_date date not null,
  constraint scenarios_date_range_ck check (start_date <= end_date),
  
  -- Locking and soft-delete
  locked_at timestamp without time zone null,
  locked_by uuid null,
  deleted_at timestamp without time zone null,
  
  -- Audit
  created_at timestamp without time zone not null default (now() at time zone 'utc')
);

comment on table scenarios is 'What-if scenarios for cash flow analysis';
comment on column scenarios.dataset_code is 'Links to transactions with same dataset_code';
comment on column scenarios.import_id is 'Points to latest completed import for this dataset_code';
comment on column scenarios.status is 'Draft allows edits, Locked is read-only';
comment on column scenarios.deleted_at is 'Soft-delete timestamp; NULL means active';

-- ============================================================================
-- Table: scenario_overrides
-- ============================================================================
create table scenario_overrides (
  id bigint generated always as identity primary key,
  company_id uuid not null references companies(id) on delete cascade,
  scenario_id bigint not null references scenarios(id) on delete cascade,
  flow_id text not null check (length(trim(flow_id)) > 0),
  
  -- Original values (frozen at first override)
  original_date_due date not null,
  original_amount_book_cents bigint not null check (original_amount_book_cents >= 0),
  
  -- New values (user edits)
  new_date_due date null,
  new_amount_book_cents bigint null check (new_amount_book_cents >= 0),
  
  -- Audit
  created_at timestamp without time zone not null default (now() at time zone 'utc'),
  updated_at timestamp without time zone not null default (now() at time zone 'utc'),
  
  unique (company_id, scenario_id, flow_id)
);

comment on table scenario_overrides is 'Per-scenario overrides for transaction date and amount';
comment on column scenario_overrides.flow_id is 'References transaction flow_id (logical link, no FK)';
comment on column scenario_overrides.original_date_due is 'Original date from transaction (frozen at first override)';
comment on column scenario_overrides.original_amount_book_cents is 'Original amount from transaction (frozen at first override)';

-- ============================================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

alter table companies enable row level security;
alter table company_members enable row level security;
alter table user_profiles enable row level security;
alter table imports enable row level security;
alter table import_rows enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table scenarios enable row level security;
alter table scenario_overrides enable row level security;

-- ============================================================================
-- STEP 3: CREATE RLS POLICIES
-- ============================================================================

-- ============================================================================
-- RLS Policies: companies
-- ============================================================================

-- SELECT: Allow members to view their companies
create policy "companies_select_policy_authenticated"
  on companies
  for select
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = companies.id
        and cm.user_id = auth.uid()
    )
  );

-- INSERT: Only service role
create policy "companies_insert_policy_service"
  on companies
  for insert
  to service_role
  with check (true);

-- UPDATE: Only service role
create policy "companies_update_policy_service"
  on companies
  for update
  to service_role
  using (true)
  with check (true);

-- DELETE: Only service role
create policy "companies_delete_policy_service"
  on companies
  for delete
  to service_role
  using (true);

-- ============================================================================
-- RLS Policies: company_members
-- ============================================================================

-- SELECT: Members can view other members of the same company
create policy "company_members_select_policy_authenticated"
  on company_members
  for select
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = company_members.company_id
        and cm.user_id = auth.uid()
    )
  );

-- INSERT: Only service role
create policy "company_members_insert_policy_service"
  on company_members
  for insert
  to service_role
  with check (true);

-- UPDATE: Only service role
create policy "company_members_update_policy_service"
  on company_members
  for update
  to service_role
  using (true)
  with check (true);

-- DELETE: Only service role
create policy "company_members_delete_policy_service"
  on company_members
  for delete
  to service_role
  using (true);

-- ============================================================================
-- RLS Policies: user_profiles
-- ============================================================================

-- SELECT: Users can only view their own profile
create policy "user_profiles_select_policy_authenticated"
  on user_profiles
  for select
  to authenticated
  using (user_id = auth.uid());

-- INSERT: Users can insert their own profile
create policy "user_profiles_insert_policy_authenticated"
  on user_profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- UPDATE: Users can update their own profile
create policy "user_profiles_update_policy_authenticated"
  on user_profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- DELETE: Only service role
create policy "user_profiles_delete_policy_service"
  on user_profiles
  for delete
  to service_role
  using (true);

-- ============================================================================
-- RLS Policies: imports
-- ============================================================================

-- SELECT: Company members can view imports
create policy "imports_select_policy_authenticated"
  on imports
  for select
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = imports.company_id
        and cm.user_id = auth.uid()
    )
  );

-- INSERT: Only service role
create policy "imports_insert_policy_service"
  on imports
  for insert
  to service_role
  with check (true);

-- UPDATE: Only service role
create policy "imports_update_policy_service"
  on imports
  for update
  to service_role
  using (true)
  with check (true);

-- DELETE: Only service role
create policy "imports_delete_policy_service"
  on imports
  for delete
  to service_role
  using (true);

-- ============================================================================
-- RLS Policies: import_rows
-- ============================================================================

-- SELECT: Company members can view import rows
create policy "import_rows_select_policy_authenticated"
  on import_rows
  for select
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = import_rows.company_id
        and cm.user_id = auth.uid()
    )
  );

-- INSERT: Only service role
create policy "import_rows_insert_policy_service"
  on import_rows
  for insert
  to service_role
  with check (true);

-- UPDATE: Only service role
create policy "import_rows_update_policy_service"
  on import_rows
  for update
  to service_role
  using (true)
  with check (true);

-- DELETE: Only service role
create policy "import_rows_delete_policy_service"
  on import_rows
  for delete
  to service_role
  using (true);

-- ============================================================================
-- RLS Policies: accounts
-- ============================================================================

-- SELECT: Company members can view accounts
create policy "accounts_select_policy_authenticated"
  on accounts
  for select
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = accounts.company_id
        and cm.user_id = auth.uid()
    )
  );

-- INSERT: Company members can insert accounts
create policy "accounts_insert_policy_authenticated"
  on accounts
  for insert
  to authenticated
  with check (
    exists (
      select 1 from company_members cm
      where cm.company_id = accounts.company_id
        and cm.user_id = auth.uid()
    )
  );

-- UPDATE: Company members can update accounts
create policy "accounts_update_policy_authenticated"
  on accounts
  for update
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = accounts.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from company_members cm
      where cm.company_id = accounts.company_id
        and cm.user_id = auth.uid()
    )
  );

-- DELETE: Company members can delete accounts
create policy "accounts_delete_policy_authenticated"
  on accounts
  for delete
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = accounts.company_id
        and cm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS Policies: transactions
-- ============================================================================

-- SELECT: Company members can view transactions
create policy "transactions_select_policy_authenticated"
  on transactions
  for select
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = transactions.company_id
        and cm.user_id = auth.uid()
    )
  );

-- INSERT: Only service role
create policy "transactions_insert_policy_service"
  on transactions
  for insert
  to service_role
  with check (true);

-- UPDATE: Only service role
create policy "transactions_update_policy_service"
  on transactions
  for update
  to service_role
  using (true)
  with check (true);

-- DELETE: Only service role
create policy "transactions_delete_policy_service"
  on transactions
  for delete
  to service_role
  using (true);

-- ============================================================================
-- RLS Policies: scenarios
-- ============================================================================

-- SELECT: Company members can view non-deleted scenarios
create policy "scenarios_select_policy_authenticated"
  on scenarios
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from company_members cm
      where cm.company_id = scenarios.company_id
        and cm.user_id = auth.uid()
    )
  );

-- INSERT: Company members can insert scenarios
create policy "scenarios_insert_policy_authenticated"
  on scenarios
  for insert
  to authenticated
  with check (
    exists (
      select 1 from company_members cm
      where cm.company_id = scenarios.company_id
        and cm.user_id = auth.uid()
    )
  );

-- UPDATE: Company members can update non-deleted scenarios
create policy "scenarios_update_policy_authenticated"
  on scenarios
  for update
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from company_members cm
      where cm.company_id = scenarios.company_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    deleted_at is null
    and exists (
      select 1 from company_members cm
      where cm.company_id = scenarios.company_id
        and cm.user_id = auth.uid()
    )
  );

-- DELETE: Only service role (users should use soft-delete)
create policy "scenarios_delete_policy_service"
  on scenarios
  for delete
  to service_role
  using (true);

-- ============================================================================
-- RLS Policies: scenario_overrides
-- ============================================================================

-- SELECT: Company members can view overrides for non-deleted scenarios
create policy "scenario_overrides_select_policy_authenticated"
  on scenario_overrides
  for select
  to authenticated
  using (
    exists (
      select 1 from scenarios s
      inner join company_members cm on cm.company_id = s.company_id
      where s.id = scenario_overrides.scenario_id
        and s.deleted_at is null
        and cm.user_id = auth.uid()
    )
  );

-- INSERT: Company members can insert overrides for Draft scenarios
create policy "scenario_overrides_insert_policy_authenticated"
  on scenario_overrides
  for insert
  to authenticated
  with check (
    exists (
      select 1 from scenarios s
      inner join company_members cm on cm.company_id = s.company_id
      where s.id = scenario_overrides.scenario_id
        and s.company_id = scenario_overrides.company_id
        and s.status = 'Draft'
        and s.deleted_at is null
        and cm.user_id = auth.uid()
    )
  );

-- UPDATE: Company members can update overrides for Draft scenarios
create policy "scenario_overrides_update_policy_authenticated"
  on scenario_overrides
  for update
  to authenticated
  using (
    exists (
      select 1 from scenarios s
      inner join company_members cm on cm.company_id = s.company_id
      where s.id = scenario_overrides.scenario_id
        and s.status = 'Draft'
        and s.deleted_at is null
        and cm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from scenarios s
      inner join company_members cm on cm.company_id = s.company_id
      where s.id = scenario_overrides.scenario_id
        and s.company_id = scenario_overrides.company_id
        and s.status = 'Draft'
        and s.deleted_at is null
        and cm.user_id = auth.uid()
    )
  );

-- DELETE: Company members can delete overrides for Draft scenarios
create policy "scenario_overrides_delete_policy_authenticated"
  on scenario_overrides
  for delete
  to authenticated
  using (
    exists (
      select 1 from scenarios s
      inner join company_members cm on cm.company_id = s.company_id
      where s.id = scenario_overrides.scenario_id
        and s.status = 'Draft'
        and s.deleted_at is null
        and cm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- End of Migration: Create Schema and Tables
-- ============================================================================
