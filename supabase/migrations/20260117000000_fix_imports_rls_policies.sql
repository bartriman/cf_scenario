-- ============================================================================
-- Migration: Fix RLS Policies for Imports
-- ============================================================================
-- Purpose: Allow authenticated company members to insert imports
-- Date: 2026-01-17
-- ============================================================================

-- Drop existing INSERT policy that only allows service_role
DROP POLICY IF EXISTS "imports_insert_policy_service" ON imports;

-- Create new INSERT policy for authenticated company members
CREATE POLICY "imports_insert_policy_authenticated"
  ON imports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = imports.company_id
        AND cm.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "imports_insert_policy_authenticated" ON imports IS 'Allow company members to create imports';

-- Also update UPDATE policy to allow authenticated users
DROP POLICY IF EXISTS "imports_update_policy_service" ON imports;

CREATE POLICY "imports_update_policy_authenticated"
  ON imports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = imports.company_id
        AND cm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = imports.company_id
        AND cm.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "imports_update_policy_authenticated" ON imports IS 'Allow company members to update their imports';

-- Keep DELETE policy as service_role only for safety
-- Users can soft-delete via application logic if needed

-- ============================================================================
-- Fix RLS Policies for import_rows
-- ============================================================================

-- Drop existing INSERT policy that only allows service_role
DROP POLICY IF EXISTS "import_rows_insert_policy_service" ON import_rows;

-- Create new INSERT policy for authenticated company members
CREATE POLICY "import_rows_insert_policy_authenticated"
  ON import_rows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = import_rows.company_id
        AND cm.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "import_rows_insert_policy_authenticated" ON import_rows IS 'Allow company members to create import rows';

-- Also update UPDATE policy to allow authenticated users
DROP POLICY IF EXISTS "import_rows_update_policy_service" ON import_rows;

CREATE POLICY "import_rows_update_policy_authenticated"
  ON import_rows
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = import_rows.company_id
        AND cm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = import_rows.company_id
        AND cm.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "import_rows_update_policy_authenticated" ON import_rows IS 'Allow company members to update import rows';

-- ============================================================================
-- Fix RLS Policies for transactions
-- ============================================================================

-- Drop existing INSERT policy that only allows service_role
DROP POLICY IF EXISTS "transactions_insert_policy_service" ON transactions;

-- Create new INSERT policy for authenticated company members
CREATE POLICY "transactions_insert_policy_authenticated"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = transactions.company_id
        AND cm.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "transactions_insert_policy_authenticated" ON transactions IS 'Allow company members to create transactions';

-- Also update UPDATE policy to allow authenticated users
DROP POLICY IF EXISTS "transactions_update_policy_service" ON transactions;

CREATE POLICY "transactions_update_policy_authenticated"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = transactions.company_id
        AND cm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = transactions.company_id
        AND cm.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "transactions_update_policy_authenticated" ON transactions IS 'Allow company members to update transactions';

-- ============================================================================
-- End of Migration
-- ============================================================================
