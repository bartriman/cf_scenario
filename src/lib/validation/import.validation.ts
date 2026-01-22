import { z } from "zod";

/**
 * Schema for CSV column mapping
 * Defines which CSV columns map to system fields
 */
export const columnMappingSchema = z.object({
  date_due: z.string().min(1, "Transaction date is required"),
  amount: z.string().min(1, "Amount is required"),
  direction: z.string().min(1, "Transaction direction is required"),
  currency: z.string().min(1, "Currency is required"),
  flow_id: z.string().optional().nullable(),
  counterparty: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  project: z.string().optional().nullable(),
  document: z.string().optional().nullable(),
  payment_source: z.string().optional().nullable(),
});

/**
 * Schema for initiating CSV import
 * POST /api/companies/{companyId}/imports
 */
export const initiateImportSchema = z.object({
  dataset_code: z
    .string()
    .min(1, "Dataset code is required")
    .max(100, "Dataset code cannot exceed 100 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Code can only contain letters, numbers, hyphens and underscores"),
  column_mapping: columnMappingSchema,
  skip_invalid_rows: z.boolean().default(false),
  file_name: z.string().optional(),
});

/**
 * Schema for path parameters
 */
export const importParamsSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  importId: z.string().regex(/^\d+$/, "Invalid import ID").transform(Number),
});

/**
 * Schema for validating a single CSV row
 * Used during batch processing
 */
export const csvRowSchema = z.object({
  date_due: z.string().refine((val) => {
    // Check if date is in valid format (YYYY-MM-DD, DD/MM/YYYY, etc.)
    const parsed = Date.parse(val);
    return !isNaN(parsed);
  }, "Invalid date format"),

  amount: z.string().refine((val) => {
    // Allow formats:
    // - 1234.56, 1,234.56 (English)
    // - 1234,56, 1 234,56 (Polish)
    // - (1234.56), (1 234,56) (Negative in parentheses)
    // - -1234.56 (Negative with minus)

    let cleaned = val.trim();

    // Handle negative amounts in parentheses: (123.45) -> -123.45
    const isNegativeParentheses = cleaned.startsWith("(") && cleaned.endsWith(")");
    if (isNegativeParentheses) {
      cleaned = "-" + cleaned.slice(1, -1).trim();
    }

    // Remove spaces (thousand separators)
    cleaned = cleaned.replace(/\s/g, "");

    // Replace comma with dot for decimal separator (Polish format)
    // Only if there's one comma and it's followed by 1-2 digits
    if ((cleaned.match(/,/g) || []).length === 1 && /,\d{1,2}$/.test(cleaned)) {
      cleaned = cleaned.replace(",", ".");
    } else {
      // Remove commas as thousand separators
      cleaned = cleaned.replace(/,/g, "");
    }

    const num = parseFloat(cleaned);
    return !isNaN(num);
  }, "Invalid amount - must be a number"),

  direction: z.enum(["INFLOW", "OUTFLOW", "IB"], {
    errorMap: () => ({ message: "Direction must be INFLOW, OUTFLOW or IB (initial balance)" }),
  }),

  currency: z
    .string()
    .length(3, "Currency code must be 3 characters")
    .regex(/^[A-Z]{3}$/, "Currency code must consist of capital letters (e.g. PLN, USD)"),

  flow_id: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  counterparty: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  project: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  document: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  payment_source: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
});

/**
 * Typy inferred ze schematów
 */
export type InitiateImportInput = z.infer<typeof initiateImportSchema>;
export type ColumnMappingInput = z.infer<typeof columnMappingSchema>;
export type ImportParams = z.infer<typeof importParamsSchema>;
export type CSVRowInput = z.infer<typeof csvRowSchema>;
