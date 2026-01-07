import type { APIRoute } from "astro";
import { z } from "zod";
import {
  getScenarios,
  createScenario,
  ForbiddenError,
  DatabaseError,
  ValidationError,
  ConflictError,
} from "@/lib/services/scenario.service";
import type { ScenarioListResponseDTO, CreateScenarioRequestDTO } from "@/types";
import { createScenarioSchema } from "@/lib/validation/scenario.validation";

/**
 * Query parameters schema for listing scenarios
 */
const ListScenariosQuerySchema = z.object({
  status: z.enum(["Draft", "Locked", "all"]).optional(),
  dataset_code: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Path parameters schema
 */
const PathParamsSchema = z.object({
  companyId: z.string().uuid("Invalid company ID format"),
});

/**
 * GET /api/companies/{companyId}/scenarios
 *
 * Returns a list of scenarios for a company with optional filtering
 *
 * Query parameters:
 * - status: Filter by status (Draft, Locked, or all)
 * - dataset_code: Filter by dataset code
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
  try {
    // Step 1: Check authentication
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate path parameters
    let validatedParams;
    try {
      validatedParams = PathParamsSchema.parse({
        companyId: params.companyId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid path parameters",
              details: error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    // Step 3: Validate query parameters
    let queryParams;
    try {
      const searchParams = Object.fromEntries(url.searchParams);
      queryParams = ListScenariosQuerySchema.parse(searchParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid query parameters",
              details: error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    // Step 4: Build filters for service layer
    const filters = {
      status: queryParams.status || "all",
      searchQuery: "",
    };

    // Step 5: Call service layer
    const { scenarios, total } = await getScenarios(supabase, validatedParams.companyId, filters);

    // Step 6: Calculate pagination
    const page = queryParams.page;
    const limit = queryParams.limit;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Apply pagination to results (client-side for now, can be moved to service layer)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedScenarios = scenarios.slice(startIndex, endIndex);

    // Step 7: Build response
    const response: ScenarioListResponseDTO = {
      scenarios: paginatedScenarios,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: hasNextPage,
        has_prev: hasPreviousPage,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /scenarios] Error:", error);

    // Handle custom error types
    if (error instanceof ForbiddenError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof DatabaseError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "DATABASE_ERROR",
            message: error.message,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * POST /api/companies/{companyId}/scenarios
 *
 * Creates a new scenario for a company
 *
 * Request body:
 * - name: Scenario name
 * - dataset_code: Dataset identifier
 * - start_date: Start date (ISO format)
 * - end_date: End date (ISO format)
 * - base_scenario_id: Optional ID of base scenario to derive from
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Check authentication
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate path parameters
    let validatedParams;
    try {
      validatedParams = PathParamsSchema.parse({
        companyId: params.companyId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid path parameters",
              details: error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    // Step 3: Parse and validate request body
    let requestBody: CreateScenarioRequestDTO;
    try {
      const body = await request.json();
      requestBody = createScenarioSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request body",
              details: error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Call service layer to create scenario
    const newScenario = await createScenario(supabase, validatedParams.companyId, requestBody);

    // Step 5: Return created scenario
    return new Response(JSON.stringify(newScenario), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[POST /scenarios] Error:", error);

    // Handle custom error types
    if (error instanceof ForbiddenError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof ConflictError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "CONFLICT",
            message: error.message,
          },
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof DatabaseError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "DATABASE_ERROR",
            message: error.message,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
