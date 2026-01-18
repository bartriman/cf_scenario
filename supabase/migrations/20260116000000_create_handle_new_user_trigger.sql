-- ============================================================================
-- Migration: Create handle_new_user Trigger
-- ============================================================================
-- Purpose: Automatically create company, profile, and member records when
--          a new user registers via Supabase Auth
-- Author: Database Migration
-- Date: 2026-01-16
-- ============================================================================

-- ============================================================================
-- Function: handle_new_user
-- ============================================================================
-- Purpose: Trigger function that executes after new user signup
-- Actions:
--   1. Create a default company for the user (if company_name provided)
--   2. Add user to company_members with role 'owner'
--   3. Create user_profile with reference to default company
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_company_name text;
begin
  -- Extract company name from user metadata (set during registration)
  v_company_name := new.raw_user_meta_data->>'company_name';
  
  -- Only create company if company_name was provided
  if v_company_name is not null and v_company_name <> '' then
    -- Create default company for the user
    insert into public.companies (name, base_currency, timezone)
    values (
      v_company_name,
      'EUR', -- default base currency
      'Europe/Warsaw' -- default timezone
    )
    returning id into v_company_id;
    
    -- Add user as company member
    insert into public.company_members (company_id, user_id)
    values (v_company_id, new.id);
    
    -- Create user profile with default company
    insert into public.user_profiles (user_id, default_company_id)
    values (new.id, v_company_id);
  else
    -- Create user profile without default company
    -- User will need to create/join a company later
    insert into public.user_profiles (user_id, default_company_id)
    values (new.id, null);
  end if;
  
  return new;
end;
$$;

comment on function public.handle_new_user is 'Creates company and user profile when a new user signs up';

-- ============================================================================
-- Trigger: on_auth_user_created
-- ============================================================================
-- Purpose: Execute handle_new_user function after user signup
-- ============================================================================
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Note: Cannot add comment to auth.users trigger due to permissions

-- ============================================================================
-- End of Migration
-- ============================================================================
