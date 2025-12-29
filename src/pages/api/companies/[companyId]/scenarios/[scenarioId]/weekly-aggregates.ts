import type { APIRoute } from 'astro';
import { GetWeeklyAggregatesParamsSchema } from '../../../../../../lib/validation/weekly-aggregates.validation';
import { 
  getWeeklyAggregates, 
  ScenarioNotFoundError, 
  ForbiddenError, 
  DatabaseError 
} from '../../../../../../lib/services/scenario-analytics.service';
import { z } from 'zod';

/**
 * GET /api/companies/{companyId}/scenarios/{scenarioId}/weekly-aggregates
 * 
 * Returns weekly aggregates with Top-5 transactions for a scenario
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Get Supabase client from locals (set by middleware)
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 2: Validate path parameters
    let validatedParams;
    try {
      validatedParams = GetWeeklyAggregatesParamsSchema.parse({
        companyId: params.companyId,
        scenarioId: params.scenarioId
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request parameters',
              details: error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
              }))
            }
          }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
      throw error;
    }

    // Step 3: Call service layer
    const result = await getWeeklyAggregates(
      supabase,
      validatedParams.companyId,
      validatedParams.scenarioId
    );

    // Step 4: Return success response
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    // Error handling
    console.error('Error in weekly-aggregates endpoint:', error);

    // Handle custom error types
    if (error instanceof ScenarioNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    if (error instanceof ForbiddenError) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FORBIDDEN',
            message: error.message
          }
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    if (error instanceof DatabaseError) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An internal error occurred'
          }
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred'
        }
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

// Disable prerendering for API routes
export const prerender = false;
