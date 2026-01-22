-- Migration: Add delete_test_users function for E2E test cleanup
-- This function allows deleting test users from auth.users table
-- Used by Playwright E2E global teardown

CREATE OR REPLACE FUNCTION public.delete_test_users(email_list text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete users from auth.users table
  -- CASCADE should handle related auth tables
  DELETE FROM auth.users
  WHERE email = ANY(email_list);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Grant execute permission to authenticated users (for test cleanup)
GRANT EXECUTE ON FUNCTION public.delete_test_users(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_test_users(text[]) TO anon;

COMMENT ON FUNCTION public.delete_test_users IS 'Delete test users from auth.users table. Used for E2E test cleanup.';
