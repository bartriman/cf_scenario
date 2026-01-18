import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type {
  ScenarioListItemDTO,
  ScenarioDetailsResponseDTO,
  CreateScenarioRequestDTO,
  CreateScenarioResponseDTO,
  UpdateScenarioRequestDTO,
  UpdateScenarioResponseDTO,
  DuplicateScenarioRequestDTO,
  DuplicateScenarioResponseDTO,
  LockScenarioResponseDTO,
  ScenarioListFilters,
  UpsertOverrideRequestDTO,
  UpsertOverrideResponseDTO,
  BatchUpdateOverridesRequestDTO,
  BatchUpdateOverridesResponseDTO,
  ScenarioOverrideDTO,
} from "@/types";

// Custom Error Classes
export class ScenarioNotFoundError extends Error {
  constructor(message = "Scenario not found") {
    super(message);
    this.name = "ScenarioNotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Access forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class DatabaseError extends Error {
  constructor(message = "Database error occurred") {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ValidationError extends Error {
  constructor(message = "Validation error") {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  constructor(message = "Conflict error") {
    super(message);
    this.name = "ConflictError";
  }
}

/**
 * Get list of scenarios for a company
 */
export async function getScenarios(
  supabase: SupabaseClient<Database>,
  companyId: string,
  filters?: ScenarioListFilters
): Promise<{ scenarios: ScenarioListItemDTO[]; total: number }> {
  try {
    // Step 1: Verify user has access to this company
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ForbiddenError("User not authenticated");
    }

    // Check company membership
    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[getScenarios] Membership check error:", membershipError);
      throw new DatabaseError("Failed to verify company access");
    }

    if (!membership) {
      throw new ForbiddenError("User is not a member of this company");
    }

    // Step 2: Build query for scenarios
    let query = supabase
      .from("scenarios")
      .select(
        `
        id,
        company_id,
        import_id,
        dataset_code,
        name,
        status,
        base_scenario_id,
        start_date,
        end_date,
        locked_at,
        locked_by,
        created_at
      `,
        { count: "exact" }
      )
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    // Search query filtering (if implemented)
    // if (filters?.searchQuery) {
    //   query = query.ilike("name", `%${filters.searchQuery}%`);
    // }

    // Step 3: Execute query
    const { data: scenarios, error, count } = await query;

    if (error) {
      console.error("[getScenarios] Query error:", error);
      throw new DatabaseError("Failed to fetch scenarios");
    }

    // Step 4: Transform to DTO format
    const scenariosDTO: ScenarioListItemDTO[] = (scenarios || []).map((scenario) => ({
      id: scenario.id,
      company_id: scenario.company_id,
      import_id: scenario.import_id,
      dataset_code: scenario.dataset_code,
      name: scenario.name,
      status: scenario.status,
      base_scenario_id: scenario.base_scenario_id,
      start_date: scenario.start_date,
      end_date: scenario.end_date,
      locked_at: scenario.locked_at,
      locked_by: scenario.locked_by,
      created_at: scenario.created_at,
    }));

    return {
      scenarios: scenariosDTO,
      total: count || 0,
    };
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof DatabaseError) {
      throw error;
    }
    console.error("[getScenarios] Unexpected error:", error);
    throw new DatabaseError("An unexpected error occurred while fetching scenarios");
  }
}

/**
 * Get scenario details by ID
 */
export async function getScenarioDetails(
  supabase: SupabaseClient<Database>,
  companyId: string,
  scenarioId: number
): Promise<ScenarioDetailsResponseDTO> {
  try {
    // Step 1: Verify user has access to this company
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ForbiddenError("User not authenticated");
    }

    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[getScenarioDetails] Membership check error:", membershipError);
      throw new DatabaseError("Failed to verify company access");
    }

    if (!membership) {
      throw new ForbiddenError("User is not a member of this company");
    }

    // Step 2: Fetch scenario details
    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .select(
        `
        id,
        company_id,
        import_id,
        dataset_code,
        name,
        status,
        base_scenario_id,
        start_date,
        end_date,
        locked_at,
        locked_by,
        created_at
      `
      )
      .eq("id", scenarioId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .maybeSingle();

    if (scenarioError) {
      console.error("[getScenarioDetails] Query error:", scenarioError);
      throw new DatabaseError("Failed to fetch scenario details");
    }

    if (!scenario) {
      throw new ScenarioNotFoundError(`Scenario with ID ${scenarioId} not found`);
    }

    // Step 3: Count overrides for this scenario
    const { count: overridesCount, error: overridesError } = await supabase
      .from("scenario_overrides")
      .select("*", { count: "exact", head: true })
      .eq("scenario_id", scenarioId);

    if (overridesError) {
      console.error("[getScenarioDetails] Overrides count error:", overridesError);
      // Don't fail the request, just set count to 0
    }

    // Step 4: Return details
    return {
      id: scenario.id,
      company_id: scenario.company_id,
      import_id: scenario.import_id,
      dataset_code: scenario.dataset_code,
      name: scenario.name,
      status: scenario.status,
      base_scenario_id: scenario.base_scenario_id,
      start_date: scenario.start_date,
      end_date: scenario.end_date,
      locked_at: scenario.locked_at,
      locked_by: scenario.locked_by,
      created_at: scenario.created_at,
      overrides_count: overridesCount || 0,
    };
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof DatabaseError || error instanceof ScenarioNotFoundError) {
      throw error;
    }
    console.error("[getScenarioDetails] Unexpected error:", error);
    throw new DatabaseError("An unexpected error occurred while fetching scenario details");
  }
}

/**
 * Create a new scenario
 */
export async function createScenario(
  supabase: SupabaseClient<Database>,
  companyId: string,
  data: CreateScenarioRequestDTO
): Promise<CreateScenarioResponseDTO> {
  try {
    // Step 1: Verify user has access to this company
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ForbiddenError("User not authenticated");
    }

    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[createScenario] Membership check error:", membershipError);
      throw new DatabaseError("Failed to verify company access");
    }

    if (!membership) {
      throw new ForbiddenError("User is not a member of this company");
    }

    // Step 2: Validate dates
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ValidationError("Invalid date format");
    }

    if (startDate >= endDate) {
      throw new ValidationError("End date must be after start date");
    }

    // Step 3: If base_scenario_id is provided, verify it exists and belongs to same company
    if (data.base_scenario_id) {
      const { data: baseScenario, error: baseScenarioError } = await supabase
        .from("scenarios")
        .select("id, company_id")
        .eq("id", data.base_scenario_id)
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .maybeSingle();

      if (baseScenarioError) {
        console.error("[createScenario] Base scenario check error:", baseScenarioError);
        throw new DatabaseError("Failed to verify base scenario");
      }

      if (!baseScenario) {
        throw new ValidationError("Base scenario not found or does not belong to this company");
      }
    }

    // Step 4: Check if scenario with same name already exists in this company
    const { data: existingScenario, error: existingError } = await supabase
      .from("scenarios")
      .select("id")
      .eq("company_id", companyId)
      .eq("name", data.name)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("[createScenario] Existing scenario check error:", existingError);
      throw new DatabaseError("Failed to check for existing scenario");
    }

    if (existingScenario) {
      throw new ConflictError("A scenario with this name already exists");
    }

    // Step 5: Verify import exists and belongs to this company
    const { data: importData, error: importError } = await supabase
      .from("imports")
      .select("id, company_id, dataset_code")
      .eq("id", data.import_id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (importError) {
      throw new DatabaseError("Failed to verify import");
    }

    if (!importData) {
      throw new ValidationError("Import not found or does not belong to this company");
    }

    // Step 6: Create new scenario
    const { data: newScenario, error: insertError } = await supabase
      .from("scenarios")
      .insert({
        company_id: companyId,
        import_id: data.import_id,
        dataset_code: data.dataset_code,
        name: data.name,
        status: "Draft" as const,
        base_scenario_id: data.base_scenario_id ?? null,
        start_date: data.start_date,
        end_date: data.end_date,
      })
      .select(
        `
        id,
        company_id,
        import_id,
        dataset_code,
        name,
        status,
        base_scenario_id,
        start_date,
        end_date,
        created_at
      `
      )
      .single();

    if (insertError) {
      console.error("[createScenario] Insert error:", insertError);
      throw new DatabaseError("Failed to create scenario");
    }

    return {
      id: newScenario.id,
      company_id: newScenario.company_id,
      import_id: newScenario.import_id,
      dataset_code: newScenario.dataset_code,
      name: newScenario.name,
      status: newScenario.status,
      base_scenario_id: newScenario.base_scenario_id,
      start_date: newScenario.start_date,
      end_date: newScenario.end_date,
      created_at: newScenario.created_at,
    };
  } catch (error) {
    if (
      error instanceof ForbiddenError ||
      error instanceof DatabaseError ||
      error instanceof ValidationError ||
      error instanceof ConflictError
    ) {
      throw error;
    }
    console.error("[createScenario] Unexpected error:", error);
    throw new DatabaseError("An unexpected error occurred while creating scenario");
  }
}

/**
 * Update an existing scenario (Draft only)
 */
export async function updateScenario(
  supabase: SupabaseClient<Database>,
  companyId: string,
  scenarioId: number,
  data: UpdateScenarioRequestDTO
): Promise<UpdateScenarioResponseDTO> {
  try {
    // Step 1: Verify user has access to this company
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ForbiddenError("User not authenticated");
    }

    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[updateScenario] Membership check error:", membershipError);
      throw new DatabaseError("Failed to verify company access");
    }

    if (!membership) {
      throw new ForbiddenError("User is not a member of this company");
    }

    // Step 2: Check if scenario exists and is Draft
    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .select("id, status, name, start_date, end_date")
      .eq("id", scenarioId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .maybeSingle();

    if (scenarioError) {
      console.error("[updateScenario] Query error:", scenarioError);
      throw new DatabaseError("Failed to fetch scenario");
    }

    if (!scenario) {
      throw new ScenarioNotFoundError(`Scenario with ID ${scenarioId} not found`);
    }

    if (scenario.status !== "Draft") {
      throw new ValidationError("Only Draft scenarios can be edited");
    }

    // Step 3: Validate dates if provided
    if (data.start_date || data.end_date) {
      const startDate = new Date(data.start_date ?? scenario.start_date);
      const endDate = new Date(data.end_date ?? scenario.end_date);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new ValidationError("Invalid date format");
      }

      if (startDate >= endDate) {
        throw new ValidationError("End date must be after start date");
      }
    }

    // Step 4: Check if new name conflicts with existing scenario
    if (data.name && data.name !== scenario.name) {
      const { data: existingScenario, error: existingError } = await supabase
        .from("scenarios")
        .select("id")
        .eq("company_id", companyId)
        .eq("name", data.name)
        .neq("id", scenarioId)
        .is("deleted_at", null)
        .maybeSingle();

      if (existingError && existingError.code !== "PGRST116") {
        console.error("[updateScenario] Existing scenario check error:", existingError);
        throw new DatabaseError("Failed to check for existing scenario");
      }

      if (existingScenario) {
        throw new ConflictError("A scenario with this name already exists");
      }
    }

    // Step 5: Update scenario
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.start_date !== undefined) updateData.start_date = data.start_date;
    if (data.end_date !== undefined) updateData.end_date = data.end_date;

    const { data: updatedScenario, error: updateError } = await supabase
      .from("scenarios")
      .update(updateData)
      .eq("id", scenarioId)
      .eq("company_id", companyId)
      .select(
        `
        id,
        company_id,
        import_id,
        dataset_code,
        name,
        status,
        base_scenario_id,
        start_date,
        end_date,
        updated_at
      `
      )
      .single();

    if (updateError) {
      console.error("[updateScenario] Update error:", updateError);
      throw new DatabaseError("Failed to update scenario");
    }

    return {
      id: updatedScenario.id,
      company_id: updatedScenario.company_id,
      import_id: updatedScenario.import_id,
      dataset_code: updatedScenario.dataset_code,
      name: updatedScenario.name,
      status: updatedScenario.status,
      base_scenario_id: updatedScenario.base_scenario_id,
      start_date: updatedScenario.start_date,
      end_date: updatedScenario.end_date,
      updated_at: updatedScenario.updated_at!,
    };
  } catch (error) {
    if (
      error instanceof ForbiddenError ||
      error instanceof DatabaseError ||
      error instanceof ValidationError ||
      error instanceof ConflictError ||
      error instanceof ScenarioNotFoundError
    ) {
      throw error;
    }
    console.error("[updateScenario] Unexpected error:", error);
    throw new DatabaseError("An unexpected error occurred while updating scenario");
  }
}

/**
 * Soft delete a scenario (check for dependent scenarios)
 */
export async function deleteScenario(
  supabase: SupabaseClient<Database>,
  companyId: string,
  scenarioId: number
): Promise<void> {
  try {
    console.log(`[deleteScenario] Starting deletion for scenario ${scenarioId} in company ${companyId}`);
    
    // Step 1: Verify user has access to this company
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("[deleteScenario] No authenticated user");
      throw new ForbiddenError("User not authenticated");
    }

    console.log(`[deleteScenario] User authenticated: ${user.id}`);

    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[deleteScenario] Membership check error:", membershipError);
      throw new DatabaseError("Failed to verify company access");
    }

    if (!membership) {
      console.error("[deleteScenario] User is not a member of company");
      throw new ForbiddenError("User is not a member of this company");
    }

    console.log("[deleteScenario] Membership verified");

    // Step 2: Check if scenario exists
    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .select("id")
      .eq("id", scenarioId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .maybeSingle();

    if (scenarioError) {
      console.error("[deleteScenario] Query error:", scenarioError);
      throw new DatabaseError("Failed to fetch scenario");
    }

    if (!scenario) {
      console.error(`[deleteScenario] Scenario ${scenarioId} not found`);
      throw new ScenarioNotFoundError(`Scenario with ID ${scenarioId} not found`);
    }

    console.log(`[deleteScenario] Scenario ${scenarioId} found`);

    // Step 3: Check for dependent scenarios (scenarios that use this as base)
    const { data: dependentScenarios, error: dependentError } = await supabase
      .from("scenarios")
      .select("id, name")
      .eq("base_scenario_id", scenarioId)
      .is("deleted_at", null)
      .limit(1);

    if (dependentError) {
      console.error("[deleteScenario] Dependent scenarios check error:", dependentError);
      throw new DatabaseError("Failed to check for dependent scenarios");
    }

    if (dependentScenarios && dependentScenarios.length > 0) {
      console.error(`[deleteScenario] Found dependent scenario: ${dependentScenarios[0].name}`);
      throw new ConflictError(
        `Cannot delete scenario: it has dependent scenarios (e.g., "${dependentScenarios[0].name}")`
      );
    }

    console.log("[deleteScenario] No dependent scenarios found");

    // Step 4: Soft delete the scenario using RPC function to bypass RLS issues
    const { data: deleted, error: deleteError } = await supabase
      .rpc("soft_delete_scenario", {
        p_scenario_id: scenarioId,
        p_user_id: user.id,
      });

    if (deleteError) {
      console.error("[deleteScenario] Delete error:", deleteError);
      throw new DatabaseError("Failed to delete scenario");
    }

    if (!deleted) {
      console.error("[deleteScenario] Scenario was not deleted");
      throw new DatabaseError("Failed to delete scenario");
    }

    console.log(`[deleteScenario] Successfully deleted scenario ${scenarioId}`);
  } catch (error) {
    if (
      error instanceof ForbiddenError ||
      error instanceof DatabaseError ||
      error instanceof ConflictError ||
      error instanceof ScenarioNotFoundError
    ) {
      throw error;
    }
    console.error("[deleteScenario] Unexpected error:", error);
    throw new DatabaseError("An unexpected error occurred while deleting scenario");
  }
}

/**
 * Duplicate a scenario with all its overrides
 */
export async function duplicateScenario(
  supabase: SupabaseClient<Database>,
  companyId: string,
  scenarioId: number,
  data: DuplicateScenarioRequestDTO
): Promise<DuplicateScenarioResponseDTO> {
  try {
    // Step 1: Verify user has access to this company
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ForbiddenError("User not authenticated");
    }

    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[duplicateScenario] Membership check error:", membershipError);
      throw new DatabaseError("Failed to verify company access");
    }

    if (!membership) {
      throw new ForbiddenError("User is not a member of this company");
    }

    // Step 2: Fetch source scenario
    const { data: sourceScenario, error: sourceError } = await supabase
      .from("scenarios")
      .select(
        `
        id,
        company_id,
        import_id,
        dataset_code,
        start_date,
        end_date
      `
      )
      .eq("id", scenarioId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .maybeSingle();

    if (sourceError) {
      console.error("[duplicateScenario] Source scenario query error:", sourceError);
      throw new DatabaseError("Failed to fetch source scenario");
    }

    if (!sourceScenario) {
      throw new ScenarioNotFoundError(`Scenario with ID ${scenarioId} not found`);
    }

    // Step 3: Check if scenario with new name already exists
    const { data: existingScenario, error: existingError } = await supabase
      .from("scenarios")
      .select("id")
      .eq("company_id", companyId)
      .eq("name", data.name)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("[duplicateScenario] Existing scenario check error:", existingError);
      throw new DatabaseError("Failed to check for existing scenario");
    }

    if (existingScenario) {
      throw new ConflictError("A scenario with this name already exists");
    }

    // Step 4: Create new scenario as Draft with source scenario as base
    const { data: newScenario, error: insertError } = await supabase
      .from("scenarios")
      .insert({
        company_id: companyId,
        import_id: sourceScenario.import_id,
        dataset_code: sourceScenario.dataset_code,
        name: data.name,
        status: "Draft" as const,
        base_scenario_id: scenarioId,
        start_date: sourceScenario.start_date,
        end_date: sourceScenario.end_date,
      })
      .select(
        `
        id,
        company_id,
        import_id,
        dataset_code,
        name,
        status,
        base_scenario_id,
        start_date,
        end_date,
        created_at
      `
      )
      .single();

    if (insertError) {
      console.error("[duplicateScenario] Insert error:", insertError);
      throw new DatabaseError("Failed to create duplicate scenario");
    }

    // Step 5: Copy all overrides from source scenario
    const { data: sourceOverrides, error: overridesError } = await supabase
      .from("scenario_overrides")
      .select(
        `
        transaction_id,
        new_amount_book_cents,
        new_currency,
        new_date_due
      `
      )
      .eq("scenario_id", scenarioId);

    if (overridesError) {
      console.error("[duplicateScenario] Fetch overrides error:", overridesError);
      // Don't fail the duplication, just log the error
    }

    let overridesCount = 0;

    if (sourceOverrides && sourceOverrides.length > 0) {
      const overridesToInsert = sourceOverrides.map((override) => ({
        company_id: companyId,
        scenario_id: newScenario.id,
        transaction_id: override.transaction_id,
        new_amount_book_cents: override.new_amount_book_cents,
        new_currency: override.new_currency,
        new_date_due: override.new_date_due,
      }));

      const { data: insertedOverrides, error: insertOverridesError } = await supabase
        .from("scenario_overrides")
        .insert(overridesToInsert)
        .select("id");

      if (insertOverridesError) {
        console.error("[duplicateScenario] Insert overrides error:", insertOverridesError);
        // Don't fail the duplication, just log the error
      } else {
        overridesCount = insertedOverrides?.length ?? 0;
      }
    }

    // Step 6: Return new scenario details
    return {
      id: newScenario.id,
      company_id: newScenario.company_id,
      import_id: newScenario.import_id,
      dataset_code: newScenario.dataset_code,
      name: newScenario.name,
      status: newScenario.status,
      base_scenario_id: newScenario.base_scenario_id,
      start_date: newScenario.start_date,
      end_date: newScenario.end_date,
      created_at: newScenario.created_at,
      overrides_count: overridesCount,
    };
  } catch (error) {
    if (
      error instanceof ForbiddenError ||
      error instanceof DatabaseError ||
      error instanceof ConflictError ||
      error instanceof ScenarioNotFoundError
    ) {
      throw error;
    }
    console.error("[duplicateScenario] Unexpected error:", error);
    throw new DatabaseError("An unexpected error occurred while duplicating scenario");
  }
}

/**
 * Create scenario from completed import with auto-calculated date range
 */
export async function createScenarioFromImport(
  supabase: SupabaseClient<Database>,
  companyId: string,
  importId: number,
  name: string,
  startDate?: string,
  endDate?: string
): Promise<CreateScenarioResponseDTO> {
  try {
    // Step 1: Verify user has access to this company
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ForbiddenError("User not authenticated");
    }

    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      throw new ForbiddenError("User is not a member of this company");
    }

    // Step 2: Verify import exists and is completed
    const { data: importRecord, error: importError } = await supabase
      .from("imports")
      .select("id, company_id, dataset_code, status")
      .eq("id", importId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (importError) {
      console.error("[createScenarioFromImport] Import fetch error:", importError);
      throw new DatabaseError("Failed to fetch import");
    }

    if (!importRecord) {
      throw new ValidationError(`Import ${importId} not found`);
    }

    if (importRecord.status !== "completed") {
      throw new ValidationError(`Import must be completed. Current status: ${importRecord.status}`);
    }

    // Step 3: Calculate date range from transactions if not provided
    let finalStartDate = startDate;
    let finalEndDate = endDate;

    if (!finalStartDate || !finalEndDate) {
      const { data: dateRange, error: rangeError } = await supabase
        .from("transactions")
        .select("date_due")
        .eq("import_id", importId)
        .order("date_due", { ascending: true });

      if (rangeError) {
        console.error("[createScenarioFromImport] Date range calculation error:", rangeError);
      }

      if (dateRange && dateRange.length > 0) {
        finalStartDate = finalStartDate || dateRange[0].date_due;
        finalEndDate = finalEndDate || dateRange[dateRange.length - 1].date_due;
      } else {
        // Default to current month if no transactions
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        finalStartDate = finalStartDate || firstDay.toISOString().split("T")[0];
        finalEndDate = finalEndDate || lastDay.toISOString().split("T")[0];
      }
    }

    // Step 4: Create scenario
    const { data: newScenario, error: createError } = await supabase
      .from("scenarios")
      .insert({
        company_id: companyId,
        import_id: importId,
        dataset_code: importRecord.dataset_code,
        name,
        status: "Draft",
        base_scenario_id: null,
        start_date: finalStartDate,
        end_date: finalEndDate,
        locked_at: null,
        locked_by: null,
        deleted_at: null,
      })
      .select()
      .single();

    if (createError) {
      console.error("[createScenarioFromImport] Create error:", createError);
      throw new DatabaseError("Failed to create scenario");
    }

    // Step 5: Return scenario details
    return {
      id: newScenario.id,
      company_id: newScenario.company_id,
      import_id: newScenario.import_id,
      dataset_code: newScenario.dataset_code,
      name: newScenario.name,
      status: newScenario.status,
      base_scenario_id: newScenario.base_scenario_id,
      start_date: newScenario.start_date,
      end_date: newScenario.end_date,
      created_at: newScenario.created_at,
    };
  } catch (error) {
    if (
      error instanceof ForbiddenError ||
      error instanceof DatabaseError ||
      error instanceof ValidationError
    ) {
      throw error;
    }
    console.error("[createScenarioFromImport] Unexpected error:", error);
    throw new DatabaseError("An unexpected error occurred while creating scenario");
  }
}

/**
 * Lock a scenario to prevent further modifications
 */
export async function lockScenario(
  supabase: SupabaseClient<Database>,
  companyId: string,
  scenarioId: number
): Promise<LockScenarioResponseDTO> {
  try {
    // Step 1: Verify user has access to this company
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ForbiddenError("User not authenticated");
    }

    const { data: memberCheck, error: memberError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberCheck) {
      throw new ForbiddenError("You do not have access to this company");
    }

    // Step 2: Verify scenario exists and belongs to this company
    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .select("id, company_id, status, is_active")
      .eq("id", scenarioId)
      .eq("company_id", companyId)
      .eq("is_active", true)
      .single();

    if (scenarioError || !scenario) {
      throw new ScenarioNotFoundError(`Scenario with ID ${scenarioId} not found`);
    }

    // Step 3: Check if already locked
    if (scenario.status === "Locked") {
      throw new ConflictError("Scenario is already locked");
    }

    // Step 4: Lock the scenario
    const now = new Date().toISOString();
    const { data: lockedScenario, error: lockError } = await supabase
      .from("scenarios")
      .update({
        status: "Locked",
        locked_at: now,
        locked_by: user.id,
      })
      .eq("id", scenarioId)
      .eq("company_id", companyId)
      .select("id, status, locked_at, locked_by")
      .single();

    if (lockError || !lockedScenario) {
      console.error("[scenario.service] Error locking scenario:", lockError);
      throw new DatabaseError("Failed to lock scenario");
    }

    // Step 5: Return response
    return {
      id: lockedScenario.id,
      status: lockedScenario.status,
      locked_at: lockedScenario.locked_at || now,
      locked_by: lockedScenario.locked_by || user.id,
    };
  } catch (error) {
    if (
      error instanceof ForbiddenError ||
      error instanceof ScenarioNotFoundError ||
      error instanceof ConflictError ||
      error instanceof DatabaseError
    ) {
      throw error;
    }
    console.error("[lockScenario] Unexpected error:", error);
    throw new DatabaseError("An unexpected error occurred while locking scenario");
  }
}

/**
 * Upsert a single override for a transaction in a scenario
 * Creates or updates an override for a specific flow_id
 */
export async function upsertOverride(
  supabase: SupabaseClient<Database>,
  companyId: string,
  scenarioId: number,
  flowId: string,
  data: UpsertOverrideRequestDTO
): Promise<UpsertOverrideResponseDTO> {
  try {
    // Step 1: Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ForbiddenError("User not authenticated");
    }

    // Step 2: Verify company membership
    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[upsertOverride] Membership check error:", membershipError);
      throw new DatabaseError("Failed to verify company access");
    }

    if (!membership) {
      throw new ForbiddenError("User is not a member of this company");
    }

    // Step 3: Verify scenario exists and belongs to company
    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .select("id, status, company_id")
      .eq("id", scenarioId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (scenarioError) {
      console.error("[upsertOverride] Scenario fetch error:", scenarioError);
      throw new DatabaseError("Failed to fetch scenario");
    }

    if (!scenario) {
      throw new ScenarioNotFoundError(`Scenario with ID ${scenarioId} not found`);
    }

    // Step 4: Check if scenario is Draft (only Draft can be edited)
    if (scenario.status !== "Draft") {
      throw new ConflictError("Cannot modify overrides for a Locked scenario");
    }

    // Step 5: Get the original transaction to freeze original values
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .select("flow_id, date_due, amount_book_cents")
      .eq("company_id", companyId)
      .eq("flow_id", flowId)
      .maybeSingle();

    if (transactionError) {
      console.error("[upsertOverride] Transaction fetch error:", transactionError);
      throw new DatabaseError("Failed to fetch transaction");
    }

    if (!transaction) {
      throw new ValidationError(`Transaction with flow_id '${flowId}' not found`);
    }

    // Step 6: Check if override already exists
    const { data: existingOverride, error: checkError } = await supabase
      .from("scenario_overrides")
      .select("*")
      .eq("company_id", companyId)
      .eq("scenario_id", scenarioId)
      .eq("flow_id", flowId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows returned (OK)
      console.error("[upsertOverride] Override check error:", checkError);
      throw new DatabaseError("Failed to check existing override");
    }

    // Step 7: Upsert the override
    const overrideData = {
      company_id: companyId,
      scenario_id: scenarioId,
      flow_id: flowId,
      // Preserve original values from existing override, or set from transaction
      original_date_due: existingOverride?.original_date_due || transaction.date_due,
      original_amount_book_cents: existingOverride?.original_amount_book_cents || transaction.amount_book_cents,
      // Update new values from request
      new_date_due: data.new_date_due !== undefined ? data.new_date_due : existingOverride?.new_date_due,
      new_amount_book_cents:
        data.new_amount_book_cents !== undefined ? data.new_amount_book_cents : existingOverride?.new_amount_book_cents,
    };

    const { data: upsertedOverride, error: upsertError } = await supabase
      .from("scenario_overrides")
      .upsert(overrideData, {
        onConflict: "company_id,scenario_id,flow_id",
      })
      .select("*")
      .single();

    if (upsertError) {
      console.error("[upsertOverride] Upsert error:", upsertError);
      throw new DatabaseError("Failed to save override");
    }

    // Step 8: Return response DTO
    return {
      id: upsertedOverride.id,
      scenario_id: upsertedOverride.scenario_id,
      flow_id: upsertedOverride.flow_id,
      original_date_due: upsertedOverride.original_date_due,
      original_amount_book_cents: upsertedOverride.original_amount_book_cents,
      new_date_due: upsertedOverride.new_date_due,
      new_amount_book_cents: upsertedOverride.new_amount_book_cents,
      created_at: upsertedOverride.created_at,
      updated_at: upsertedOverride.updated_at,
    };
  } catch (error) {
    if (
      error instanceof ForbiddenError ||
      error instanceof ScenarioNotFoundError ||
      error instanceof ValidationError ||
      error instanceof ConflictError ||
      error instanceof DatabaseError
    ) {
      throw error;
    }
    console.error("[upsertOverride] Unexpected error:", error);
    throw new DatabaseError("An unexpected error occurred while saving override");
  }
}

/**
 * Batch upsert overrides for multiple transactions
 * Used for drag & drop operations
 */
export async function batchUpdateOverrides(
  supabase: SupabaseClient<Database>,
  companyId: string,
  scenarioId: number,
  data: BatchUpdateOverridesRequestDTO
): Promise<BatchUpdateOverridesResponseDTO> {
  try {
    // Step 1: Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ForbiddenError("User not authenticated");
    }

    // Step 2: Verify company membership
    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[batchUpdateOverrides] Membership check error:", membershipError);
      throw new DatabaseError("Failed to verify company access");
    }

    if (!membership) {
      throw new ForbiddenError("User is not a member of this company");
    }

    // Step 3: Verify scenario exists and is Draft
    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .select("id, status, company_id")
      .eq("id", scenarioId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (scenarioError) {
      console.error("[batchUpdateOverrides] Scenario fetch error:", scenarioError);
      throw new DatabaseError("Failed to fetch scenario");
    }

    if (!scenario) {
      throw new ScenarioNotFoundError(`Scenario with ID ${scenarioId} not found`);
    }

    if (scenario.status !== "Draft") {
      throw new ConflictError("Cannot modify overrides for a Locked scenario");
    }

    // Step 4: Validate that all flow_ids exist
    const flowIds = data.overrides.map((o) => o.flow_id);
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("flow_id, date_due, amount_book_cents")
      .eq("company_id", companyId)
      .in("flow_id", flowIds);

    if (transactionsError) {
      console.error("[batchUpdateOverrides] Transactions fetch error:", transactionsError);
      throw new DatabaseError("Failed to fetch transactions");
    }

    if (!transactions || transactions.length !== flowIds.length) {
      const foundFlowIds = transactions?.map((t) => t.flow_id) || [];
      const missingFlowIds = flowIds.filter((id) => !foundFlowIds.includes(id));
      throw new ValidationError(`Transactions not found for flow_ids: ${missingFlowIds.join(", ")}`);
    }

    // Step 5: Get existing overrides for these flow_ids
    const { data: existingOverrides, error: overridesError } = await supabase
      .from("scenario_overrides")
      .select("*")
      .eq("company_id", companyId)
      .eq("scenario_id", scenarioId)
      .in("flow_id", flowIds);

    if (overridesError && overridesError.code !== "PGRST116") {
      console.error("[batchUpdateOverrides] Existing overrides fetch error:", overridesError);
      throw new DatabaseError("Failed to fetch existing overrides");
    }

    // Step 6: Build upsert data
    const overridesMap = new Map(existingOverrides?.map((o) => [o.flow_id, o]) || []);
    const transactionsMap = new Map(transactions.map((t) => [t.flow_id, t]));

    const upsertData = data.overrides.map((override) => {
      const existing = overridesMap.get(override.flow_id);
      const transaction = transactionsMap.get(override.flow_id)!;

      return {
        company_id: companyId,
        scenario_id: scenarioId,
        flow_id: override.flow_id,
        // Freeze original values from transaction if this is first override
        original_date_due: existing?.original_date_due || transaction.date_due,
        original_amount_book_cents: existing?.original_amount_book_cents || transaction.amount_book_cents,
        // Update new values from request
        new_date_due: override.new_date_due !== undefined ? override.new_date_due : existing?.new_date_due,
        new_amount_book_cents:
          override.new_amount_book_cents !== undefined
            ? override.new_amount_book_cents
            : existing?.new_amount_book_cents,
      };
    });

    // Step 7: Batch upsert
    const { data: upsertedOverrides, error: upsertError } = await supabase
      .from("scenario_overrides")
      .upsert(upsertData, {
        onConflict: "company_id,scenario_id,flow_id",
      })
      .select("id, flow_id, new_date_due, new_amount_book_cents");

    if (upsertError) {
      console.error("[batchUpdateOverrides] Batch upsert error:", upsertError);
      throw new DatabaseError("Failed to save overrides");
    }

    console.log("[batchUpdateOverrides] Successfully saved overrides:", {
      scenarioId,
      count: upsertedOverrides?.length || 0,
      overrides: upsertedOverrides?.map(o => ({
        flow_id: o.flow_id,
        new_date_due: o.new_date_due,
      }))
    });

    // Step 8: Return response
    return {
      updated_count: upsertedOverrides?.length || 0,
      overrides: (upsertedOverrides || []).map((o) => ({
        id: o.id,
        flow_id: o.flow_id,
        new_date_due: o.new_date_due,
        new_amount_book_cents: o.new_amount_book_cents,
      })),
    };
  } catch (error) {
    if (
      error instanceof ForbiddenError ||
      error instanceof ScenarioNotFoundError ||
      error instanceof ValidationError ||
      error instanceof ConflictError ||
      error instanceof DatabaseError
    ) {
      throw error;
    }
    console.error("[batchUpdateOverrides] Unexpected error:", error);
    throw new DatabaseError("An unexpected error occurred while batch updating overrides");
  }
}

