import type { APIRoute } from "astro";
import { z } from "zod";
import {
  getScenarioDetails,
  updateScenario,
  deleteScenario,
  ForbiddenError,
  DatabaseError,
  ScenarioNotFoundError,
  ValidationError,
  ConflictError,
} from "@/lib/services/scenario.service";
import type { UpdateScenarioRequestDTO } from "@/types";

/**
 * Path parameters schema
 */
const PathParamsSchema = z.object({
  companyId: z.string().uuid("Invalid company ID format"),
  scenarioId: z.coerce.number().int().positive("Invalid scenario ID"),
});

/**
 * GET /api/companies/{companyId}/scenarios/{scenarioId}
 *
 * Returns detailed information about a specific scenario
 */
export const GET: APIRoute = async ({ params, locals }) => {
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
    const scenarioDetails = await getScenarioDetails(supabase, validatedParams.companyId, validatedParams.scenarioId);

    // Step 4: Return scenario details
    return new Response(JSON.stringify(scenarioDetails), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /scenarios/:id] Error:", error);

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
 * Request body schema for updating scenario
 */
const UpdateScenarioBodySchema = z
  .object({
    name: z.string().min(1, "Nazwa jest wymagana").max(255, "Nazwa nie może przekraczać 255 znaków").optional(),
    start_date: z
      .string()
      .min(1, "Data rozpoczęcia jest wymagana")
      .refine((val) => !isNaN(Date.parse(val)), "Nieprawidłowa data rozpoczęcia")
      .optional(),
    end_date: z
      .string()
      .min(1, "Data zakończenia jest wymagana")
      .refine((val) => !isNaN(Date.parse(val)), "Nieprawidłowa data zakończenia")
      .optional(),
  })
  .refine(
    (data) => {
      // If both dates are provided, validate the range
      if (data.start_date && data.end_date) {
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        return start < end;
      }
      return true;
    },
    {
      message: "Data zakończenia musi być późniejsza niż data rozpoczęcia",
      path: ["end_date"],
    }
  );

/**
 * PATCH /api/companies/{companyId}/scenarios/{scenarioId}
 *
 * Updates scenario metadata (Draft scenarios only)
 */
export const PATCH: APIRoute = async ({ params, locals, request }) => {
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

    // Step 3: Parse and validate request body
    let body: UpdateScenarioRequestDTO;
    try {
      const rawBody = await request.json();
      body = UpdateScenarioBodySchema.parse(rawBody);
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
            message: "Invalid JSON body",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Call service layer
    const updatedScenario = await updateScenario(supabase, validatedParams.companyId, validatedParams.scenarioId, body);

    // Step 5: Return updated scenario
    return new Response(JSON.stringify(updatedScenario), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PATCH /scenarios/:id] Error:", error);

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
 * DELETE /api/companies/{companyId}/scenarios/{scenarioId}
 *
 * Soft deletes a scenario (checks for dependent scenarios)
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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
    await deleteScenario(supabase, validatedParams.companyId, validatedParams.scenarioId);

    // Step 4: Return success (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error("[DELETE /scenarios/:id] Error:", error);

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
