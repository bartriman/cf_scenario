-- Fix infinite recursion in company_members RLS policy

-- Drop existing policy
DROP POLICY IF EXISTS "company_members_select_policy_authenticated" ON company_members;

-- Create new policy without recursion
-- Allow users to see their own membership records
CREATE POLICY "company_members_select_policy_own"
  ON company_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
