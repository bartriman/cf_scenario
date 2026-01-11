import type { APIRoute } from "astro";
import { z } from "zod";
import { importParamsSchema } from "@/lib/validation/import.validation";
import {
  getImport,
  getImportErrors,
  ImportNotFoundError,
  ForbiddenError,
  DatabaseError,
} from "@/lib/services/import.service";

/**
 * GET /api/companies/{companyId}/imports/{importId}/status
 *
 * Returns the current status of a CSV import with progress information
 *
 * Response:
 * - import_id: number
 * - status: "pending" | "processing" | "completed" | "failed"
 * - dataset_code: string
 * - total_rows: number - Total rows in the import
 * - valid_rows: number - Number of valid rows
 * - invalid_rows: number - Number of invalid rows
 * - inserted_transactions_count: number - Transactions created
 * - progress: number - Percentage (0-100)
 * - errors: Array<ValidationError> - Sample of validation errors (max 100)
 * - file_name: string | null
 * - created_at: string
 * - error_report_json: object | null - Full error report if available
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Get Supabase client and user from locals
    const supabase = locals.supabase;
    const user = locals.user;

    if (!supabase || !user) {
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
      validatedParams = importParamsSchema.parse({
        companyId: params.companyId,
        importId: params.importId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request parameters",
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

    // Step 3: Fetch import record
    const importRecord = await getImport(supabase, validatedParams.companyId, validatedParams.importId);

    // Step 4: Calculate progress percentage
    const progress =
      importRecord.total_rows > 0
        ? Math.round(((importRecord.valid_rows + importRecord.invalid_rows) / importRecord.total_rows) * 100)
        : 0;

    // Step 5: Fetch validation errors (if any)
    let errors = [];
    if (importRecord.invalid_rows > 0) {
      const errorRows = await getImportErrors(supabase, validatedParams.importId, 100);

      errors = errorRows.map((row) => ({
        row_number: row.row_number,
        error_message: row.error_message || "Unknown error",
        raw_data: row.raw_data,
      }));
    }

    // Step 6: Return status response
    return new Response(
      JSON.stringify({
        import_id: importRecord.id,
        status: importRecord.status,
        dataset_code: importRecord.dataset_code,
        total_rows: importRecord.total_rows,
        valid_rows: importRecord.valid_rows,
        invalid_rows: importRecord.invalid_rows,
        inserted_transactions_count: importRecord.inserted_transactions_count,
        progress,
        errors,
        file_name: importRecord.file_name,
        created_at: importRecord.created_at,
        error_report_json: importRecord.error_report_json,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in GET /imports/{importId}/status endpoint:", error);

    // Handle custom error types
    if (error instanceof ImportNotFoundError) {
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
            code: "INTERNAL_ERROR",
            message: "Database operation failed",
            details: error.message,
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

export const prerender = false;
