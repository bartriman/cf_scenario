import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

import {
  upsertOverride,
  ForbiddenError,
  DatabaseError,
  ScenarioNotFoundError,
  ValidationError,
  ConflictError,
} from "@/lib/services/scenario.service";
import { upsertOverrideSchema } from "@/lib/validation/scenario.validation";
import type { UpsertOverrideRequestDTO } from "@/types";

/**
 * Path parameters schema
 */
const PathParamsSchema = z.object({
  companyId: z.string().uuid("Invalid company ID format"),
  scenarioId: z.coerce.number().int().positive("Invalid scenario ID"),
  flowId: z.string().min(1, "flow_id is required"),
});

/**
 * PUT /api/companies/{companyId}/scenarios/{scenarioId}/overrides/{flowId}
 *
 * Upsert (create or update) an override for a specific transaction (flow_id)
 * Used for manual editing of individual transactions
 *
 * Body: UpsertOverrideRequestDTO
 * - new_date_due?: string | null
 * - new_amount_book_cents?: number | null
 *
 * Returns: UpsertOverrideResponseDTO (ScenarioOverrideDTO)
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
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
        flowId: params.flowId,
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
    let requestData: UpsertOverrideRequestDTO;
    try {
      const body = await request.json();
      requestData = upsertOverrideSchema.parse(body);
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
            code: "VALIDATION_ERROR",
            message: "Invalid JSON in request body",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Call service layer
    const overrideResponse = await upsertOverride(
      supabase,
      validatedParams.companyId,
      validatedParams.scenarioId,
      validatedParams.flowId,
      requestData
    );

    // Step 5: Return success response
    return new Response(JSON.stringify(overrideResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PUT /scenarios/:scenarioId/overrides/:flowId] Error:", error);

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
            code: "INTERNAL_ERROR",
            message: error.message,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
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
