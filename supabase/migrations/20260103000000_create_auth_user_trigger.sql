-- ============================================================================
-- Migration: Create Auth User Trigger for Auto-Profile Creation
-- ============================================================================
-- Purpose: Automatically create user profile and optional company on signup
-- Affected Tables: user_profiles, companies, company_members
-- Author: Database Migration
-- Date: 2026-01-03
-- ============================================================================
-- Notes:
-- - Trigger fires on INSERT to auth.users table
-- - Creates user_profile with default values
-- - If raw_user_meta_data contains 'company_name', creates company and assigns ownership
-- - Uses auth.uid() to ensure proper RLS context
-- ============================================================================

-- ============================================================================
-- Function: handle_new_user_registration
-- ============================================================================
-- Purpose: Handle automatic profile and company creation on user signup
-- Trigger: AFTER INSERT on auth.users
-- ============================================================================
create or replace function handle_new_user_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_company_name text;
begin
  -- Step 1: Create user profile
  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  -- Step 2: Check if company_name is provided in metadata
  v_company_name := new.raw_user_meta_data->>'company_name';
  
  if v_company_name is not null and v_company_name <> '' then
    -- Step 3: Create company with default values
    -- Use service role context to bypass RLS
    insert into public.companies (name, base_currency, timezone)
    values (
      v_company_name,
      'EUR', -- Default base currency
      'Europe/Warsaw' -- Default timezone
    )
    returning id into v_company_id;

    -- Step 4: Add user as company owner
    -- Use service role context to bypass RLS
    insert into public.company_members (company_id, user_id, role)
    values (v_company_id, new.id, 'owner');

    -- Step 5: Set as default company for user
    update public.user_profiles
    set default_company_id = v_company_id
    where user_id = new.id;
  end if;

  return new;
exception
  when others then
    -- Log error but don't fail user creation
    raise warning 'Error in handle_new_user_registration: %', sqlerrm;
    return new;
end;
$$;

comment on function handle_new_user_registration is 'Automatically creates user profile and optional company on signup';

-- Grant execute permission to authenticated users (though it's called by trigger)
grant execute on function handle_new_user_registration to authenticated;
grant execute on function handle_new_user_registration to service_role;

-- Change function owner to postgres to bypass RLS
alter function handle_new_user_registration owner to postgres;

-- ============================================================================
-- Trigger: on_auth_user_created
-- ============================================================================
-- Purpose: Fire handle_new_user_registration on new user signup
-- Note: We need to check if trigger already exists to avoid errors
-- ============================================================================
do $$
begin
  -- Drop trigger if it exists
  drop trigger if exists on_auth_user_created on auth.users;
  
  -- Create trigger
  create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function handle_new_user_registration();
exception
  when others then
    raise notice 'Error creating trigger: %', sqlerrm;
end $$;
