-- Fix is_company_member function to properly bypass RLS
-- The problem: Even with SECURITY DEFINER, the function still respects RLS on company_members
-- Solution: Use a SECURITY DEFINER function that explicitly reads from company_members
-- with proper permissions

-- First, drop policies that depend on the function
DROP POLICY IF EXISTS "scenarios_select_policy_authenticated" ON scenarios;
DROP POLICY IF EXISTS "scenarios_insert_policy_authenticated" ON scenarios;
DROP POLICY IF EXISTS "scenarios_update_policy_authenticated" ON scenarios;
DROP POLICY IF EXISTS "scenarios_delete_policy_service" ON scenarios;

-- Drop and recreate the function with explicit RLS bypass
DROP FUNCTION IF EXISTS public.is_company_member(uuid);

CREATE OR REPLACE FUNCTION public.is_company_member(input_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE  -- Changed from STABLE to VOLATILE because we use auth.uid()
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Debug: log if user_id is null
  IF v_user_id IS NULL THEN
    RAISE WARNING 'is_company_member: auth.uid() returned NULL';
    RETURN false;
  END IF;
  
  -- Explicitly query company_members bypassing RLS
  -- Since this is SECURITY DEFINER, it runs as the function owner (postgres)
  -- which has full access to all tables
  SELECT EXISTS (
    SELECT 1
    FROM company_members
    WHERE company_id = input_company_id
      AND user_id = v_user_id
  ) INTO v_exists;
  
  RAISE WARNING 'is_company_member: user_id=%, company_id=%, result=%', v_user_id, input_company_id, v_exists;
  
  RETURN v_exists;
END;
$$;

COMMENT ON FUNCTION public.is_company_member IS 'Checks if current user is a member of the company (bypasses RLS)';

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid) TO anon, authenticated, service_role;

-- Recreate the policies using the fixed function

-- SELECT
CREATE POLICY "scenarios_select_policy_authenticated"
  ON scenarios
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_company_member(company_id)
  );

-- INSERT
CREATE POLICY "scenarios_insert_policy_authenticated"
  ON scenarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_company_member(company_id)
  );

-- UPDATE
-- Note: We intentionally do NOT check 'deleted_at is null' in WITH CHECK.
-- This allows setting deleted_at (soft delete).
CREATE POLICY "scenarios_update_policy_authenticated"
  ON scenarios
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_company_member(company_id)
  )
  WITH CHECK (
    is_company_member(company_id)
  );

-- DELETE (Hard delete service role only)
CREATE POLICY "scenarios_delete_policy_service"
  ON scenarios
  FOR DELETE
  TO service_role
  USING (true);
