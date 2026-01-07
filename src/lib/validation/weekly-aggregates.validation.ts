import { z } from "zod";

/**
 * Validation schema for GET weekly aggregates endpoint path parameters
 */
export const GetWeeklyAggregatesParamsSchema = z.object({
  companyId: z.string().uuid("Invalid company ID format"),
  scenarioId: z.coerce.number().int().positive("Scenario ID must be a positive integer"),
});

/**
 * Inferred type from validation schema
 */
export type GetWeeklyAggregatesParams = z.infer<typeof GetWeeklyAggregatesParamsSchema>;
