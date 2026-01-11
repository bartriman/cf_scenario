import type { APIRoute } from "astro";
import { z } from "zod";
import { initiateImportSchema, csvRowSchema } from "@/lib/validation/import.validation";
import {
  createImport,
  processCsvBatch,
  createTransactionsFromImport,
  getCompany,
  ForbiddenError,
  DatabaseError,
} from "@/lib/services/import.service";
import { createScenarioFromImport } from "@/lib/services/scenario.service";

/**
 * POST /api/companies/{companyId}/imports
 *
 * Initiates a CSV import process
 *
 * Request body:
 * - dataset_code: string - Unique identifier for the dataset
 * - column_mapping: object - Mapping of CSV columns to system fields
 * - skip_invalid_rows: boolean - Whether to skip invalid rows during import
 * - file_name: string (optional) - Original file name
 * - csv_data: string[][] - Array of CSV rows (without headers)
 * - csv_headers: string[] - CSV column headers
 *
 * Response:
 * - import_id: number - ID of created import
 * - status: string - Import status (pending, processing)
 * - message: string - Success message
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
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
    const { companyId } = params;
    if (!companyId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Company ID is required",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
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

    // Validate with extended schema that includes CSV data
    const extendedSchema = initiateImportSchema.extend({
      csv_data: z.array(z.array(z.string())).min(1, "CSV data cannot be empty"),
      csv_headers: z.array(z.string()).min(1, "CSV headers are required"),
    });

    let validatedData;
    try {
      validatedData = extendedSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request data",
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

    // Step 4: Create import record
    const importRecord = await createImport(
      supabase,
      companyId,
      validatedData.dataset_code,
      validatedData.file_name,
      user.id
    );

    // Step 5: Process CSV batch - validate and save rows
    try {
      const processingResult = await processCsvBatch(
        supabase,
        importRecord.id,
        companyId,
        validatedData.csv_data,
        validatedData.csv_headers,
        validatedData.column_mapping,
        csvRowSchema,
        validatedData.skip_invalid_rows
      );

      // Step 6: If validation successful, create transactions
      let transactionCount = 0;
      let scenarioId: number | null = null;

      if (processingResult.valid_rows > 0) {
        try {
          // Get company base currency
          const company = await getCompany(supabase, companyId);

          // Create transactions from valid rows
          transactionCount = await createTransactionsFromImport(
            supabase,
            importRecord.id,
            companyId,
            company.base_currency
          );

          // Step 7: Automatically create base scenario
          const scenarioName = `Import ${validatedData.dataset_code} - ${new Date().toISOString().split("T")[0]}`;
          const scenario = await createScenarioFromImport(supabase, companyId, importRecord.id, scenarioName);

          scenarioId = scenario.id;
        } catch (transactionError) {
          console.error("Transaction/Scenario creation error:", transactionError);
          // Don't fail the import, just log the error
        }
      }

      // Step 8: Return success response with processing results
      return new Response(
        JSON.stringify({
          import_id: importRecord.id,
          status: processingResult.invalid_rows > 0 && !validatedData.skip_invalid_rows ? "failed" : "completed",
          message:
            processingResult.invalid_rows > 0
              ? `Import processed with ${processingResult.invalid_rows} validation errors`
              : "Import completed successfully",
          dataset_code: importRecord.dataset_code,
          total_rows: processingResult.total_rows,
          valid_rows: processingResult.valid_rows,
          invalid_rows: processingResult.invalid_rows,
          transaction_count: transactionCount,
          scenario_id: scenarioId,
          errors: processingResult.error_report.slice(0, 10), // Return first 10 errors
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (processingError) {
      // If processing fails, return the import_id anyway so user can check status
      console.error("CSV processing error:", processingError);
      return new Response(
        JSON.stringify({
          import_id: importRecord.id,
          status: "failed",
          message: "Import created but processing failed. Check status endpoint for details.",
          error: processingError instanceof Error ? processingError.message : "Unknown error",
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in POST /imports endpoint:", error);

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
