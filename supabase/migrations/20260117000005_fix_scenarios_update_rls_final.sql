-- Fix Scenarios RLS by using a security definer function to avoid RLS recursion issues
-- and explicitly facilitating soft-deletes.

-- 1. Helper Function: is_company_member
--    Returns true if the current user is a member of the given company.
--    SECURITY DEFINER ensures we can read company_members regardless of its RLS.
create or replace function public.is_company_member(input_company_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from company_members
    where company_id = input_company_id
      and user_id = auth.uid()
  );
$$;

comment on function public.is_company_member is 'Checks if current user is a member of the company';

-- 2. Clean up Policies
drop policy if exists "scenarios_select_policy_authenticated" on scenarios;
drop policy if exists "scenarios_insert_policy_authenticated" on scenarios;
drop policy if exists "scenarios_update_policy_authenticated" on scenarios;
drop policy if exists "scenarios_delete_policy_service" on scenarios;

-- 3. Recreate Policies

-- SELECT
create policy "scenarios_select_policy_authenticated"
  on scenarios
  for select
  to authenticated
  using (
    deleted_at is null
    and is_company_member(company_id)
  );

-- INSERT
create policy "scenarios_insert_policy_authenticated"
  on scenarios
  for insert
  to authenticated
  with check (
    is_company_member(company_id)
  );

-- UPDATE
-- Note: We intentionally do NOT check 'deleted_at is null' in WITH CHECK.
-- This allows setting deleted_at (soft delete).
create policy "scenarios_update_policy_authenticated"
  on scenarios
  for update
  to authenticated
  using (
    deleted_at is null
    and is_company_member(company_id)
  )
  with check (
    is_company_member(company_id)
  );

-- DELETE (Hard delete service role only)
create policy "scenarios_delete_policy_service"
  on scenarios
  for delete
  to service_role
  using (true);
