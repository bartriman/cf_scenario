-- Modify existing soft_delete_scenario function to add permission checks
-- Original function only took scenario_id, new version adds user_id for explicit permission check

DROP FUNCTION IF EXISTS public.soft_delete_scenario(bigint);
DROP FUNCTION IF EXISTS public.soft_delete_scenario(bigint, uuid);

CREATE OR REPLACE FUNCTION public.soft_delete_scenario(
  p_scenario_id bigint,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_is_member boolean;
  v_has_dependents boolean;
BEGIN
  -- Step 1: Get the scenario's company_id
  SELECT company_id INTO v_company_id
  FROM scenarios
  WHERE id = p_scenario_id
    AND deleted_at IS NULL;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Scenario not found or already deleted';
  END IF;
  
  -- Step 2: Check if user is a member of the company
  SELECT EXISTS (
    SELECT 1
    FROM company_members
    WHERE company_id = v_company_id
      AND user_id = p_user_id
  ) INTO v_is_member;
  
  IF NOT v_is_member THEN
    RAISE EXCEPTION 'User is not a member of this company';
  END IF;
  
  -- Step 3: Check for dependent scenarios
  SELECT EXISTS (
    SELECT 1
    FROM scenarios
    WHERE base_scenario_id = p_scenario_id
      AND deleted_at IS NULL
    LIMIT 1
  ) INTO v_has_dependents;
  
  IF v_has_dependents THEN
    RAISE EXCEPTION 'Cannot delete scenario: it has dependent scenarios';
  END IF;
  
  -- Step 4: Perform soft delete
  UPDATE scenarios
  SET deleted_at = NOW() AT TIME ZONE 'utc'
  WHERE id = p_scenario_id
    AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.soft_delete_scenario(bigint, uuid) IS 'Soft-delete a scenario with permission checks (bypasses RLS)';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.soft_delete_scenario(bigint, uuid) TO authenticated;

