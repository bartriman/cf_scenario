import type { APIRoute } from "astro";
import { z } from "zod";
import {
  lockScenario,
  ForbiddenError,
  DatabaseError,
  ScenarioNotFoundError,
  ConflictError,
} from "@/lib/services/scenario.service";

export const prerender = false;

/**
 * Path parameters schema
 */
const PathParamsSchema = z.object({
  companyId: z.string().uuid("Invalid company ID format"),
  scenarioId: z.coerce.number().int().positive("Invalid scenario ID"),
});

/**
 * POST /api/companies/{companyId}/scenarios/{scenarioId}/lock
 *
 * Locks a scenario to prevent further modifications
 */
export const POST: APIRoute = async ({ params, locals }) => {
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
        scenarioId: params.scenarioId,
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

    // Step 3: Call service layer
    const lockedScenario = await lockScenario(supabase, validatedParams.companyId, validatedParams.scenarioId);

    // Step 4: Return locked scenario details
    return new Response(JSON.stringify(lockedScenario), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[POST /scenarios/:id/lock] Error:", error);

    // Handle custom error types
    if (error instanceof ScenarioNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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
