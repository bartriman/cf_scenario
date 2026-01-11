import { z } from "zod";

/**
 * Validation schema for GET running balance endpoint path parameters
 */
export const GetRunningBalanceParamsSchema = z.object({
  companyId: z.string().uuid("Invalid company ID format"),
  scenarioId: z.coerce.number().int().positive("Scenario ID must be a positive integer"),
});

/**
 * Inferred type from validation schema
 */
export type GetRunningBalanceParams = z.infer<typeof GetRunningBalanceParamsSchema>;
