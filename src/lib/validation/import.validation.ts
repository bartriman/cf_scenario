import { z } from "zod";

/**
 * Schema for CSV column mapping
 * Defines which CSV columns map to system fields
 */
export const columnMappingSchema = z.object({
  date_due: z.string().min(1, "Data transakcji jest wymagana"),
  amount: z.string().min(1, "Kwota jest wymagana"),
  direction: z.string().min(1, "Kierunek transakcji jest wymagany"),
  currency: z.string().min(1, "Waluta jest wymagana"),
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
    .min(1, "Kod datasetu jest wymagany")
    .max(100, "Kod datasetu nie może przekraczać 100 znaków")
    .regex(/^[a-zA-Z0-9_-]+$/, "Kod może zawierać tylko litery, cyfry, myślniki i podkreślenia"),
  column_mapping: columnMappingSchema,
  skip_invalid_rows: z.boolean().default(false),
  file_name: z.string().optional(),
});

/**
 * Schema for path parameters
 */
export const importParamsSchema = z.object({
  companyId: z.string().uuid("Nieprawidłowy ID firmy"),
  importId: z.string().regex(/^\d+$/, "Nieprawidłowy ID importu").transform(Number),
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
  }, "Nieprawidłowy format daty"),

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
  }, "Nieprawidłowa kwota - musi być liczbą"),

  direction: z.enum(["INFLOW", "OUTFLOW", "IB"], {
    errorMap: () => ({ message: "Kierunek musi być INFLOW, OUTFLOW lub IB (saldo początkowe)" }),
  }),

  currency: z
    .string()
    .length(3, "Kod waluty musi mieć 3 znaki")
    .regex(/^[A-Z]{3}$/, "Kod waluty musi składać się z wielkich liter (np. PLN, USD)"),

  flow_id: z.string().optional().nullable().transform(val => val || undefined),
  counterparty: z.string().optional().nullable().transform(val => val || undefined),
  description: z.string().optional().nullable().transform(val => val || undefined),
  project: z.string().optional().nullable().transform(val => val || undefined),
  document: z.string().optional().nullable().transform(val => val || undefined),
  payment_source: z.string().optional().nullable().transform(val => val || undefined),
});

/**
 * Typy inferred ze schematów
 */
export type InitiateImportInput = z.infer<typeof initiateImportSchema>;
export type ColumnMappingInput = z.infer<typeof columnMappingSchema>;
export type ImportParams = z.infer<typeof importParamsSchema>;
export type CSVRowInput = z.infer<typeof csvRowSchema>;
