-- Migration: Update delete_test_users function to also delete companies
-- This function now deletes test users AND their companies from database
-- Used by Playwright E2E global teardown

DROP FUNCTION IF EXISTS public.delete_test_users(text[]);

CREATE OR REPLACE FUNCTION public.delete_test_users(email_list text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_ids uuid[];
  company_ids_to_delete uuid[];
  deleted_users integer := 0;
  deleted_companies integer := 0;
  result jsonb;
BEGIN
  -- Get user IDs from emails
  SELECT ARRAY_AGG(id) INTO user_ids
  FROM auth.users
  WHERE email = ANY(email_list);
  
  IF user_ids IS NULL OR array_length(user_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'deleted_users', 0,
      'deleted_companies', 0,
      'message', 'No users found'
    );
  END IF;
  
  -- Get company IDs for these users
  SELECT ARRAY_AGG(DISTINCT company_id) INTO company_ids_to_delete
  FROM public.company_members
  WHERE user_id = ANY(user_ids);
  
  -- Delete in correct order (respecting foreign keys)
  -- 1. User profiles (references company_members)
  DELETE FROM public.user_profiles WHERE user_id = ANY(user_ids);
  
  -- 2. Company members
  DELETE FROM public.company_members WHERE user_id = ANY(user_ids);
  
  -- 3. Companies (only those belonging to test users)
  IF company_ids_to_delete IS NOT NULL AND array_length(company_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.companies WHERE id = ANY(company_ids_to_delete);
    GET DIAGNOSTICS deleted_companies = ROW_COUNT;
  END IF;
  
  -- 4. Delete users from auth.users table (CASCADE handles related auth tables)
  DELETE FROM auth.users WHERE email = ANY(email_list);
  GET DIAGNOSTICS deleted_users = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'deleted_users', deleted_users,
    'deleted_companies', deleted_companies,
    'message', 'Cleanup complete'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_test_users(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_test_users(text[]) TO anon;

COMMENT ON FUNCTION public.delete_test_users IS 'Delete test users and their companies from database. Used for E2E test cleanup. Returns JSON with deletion counts.';
