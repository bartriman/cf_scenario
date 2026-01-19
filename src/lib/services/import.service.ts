import type { SupabaseClient } from "@/db/supabase.client";
import type { Import, ImportRow, ImportInsert, ImportRowInsert, TransactionInsert } from "@/types";
import type { ColumnMappingInput } from "@/lib/validation/import.validation";

// =============================================================================
// CUSTOM ERRORS
// =============================================================================

export class ImportNotFoundError extends Error {
  constructor(importId: number) {
    super(`Import with ID ${importId} not found`);
    this.name = "ImportNotFoundError";
  }
}

export class CompanyNotFoundError extends Error {
  constructor(companyId: string) {
    super(`Company with ID ${companyId} not found`);
    this.name = "CompanyNotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Access denied to this resource") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: any[]
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * Create a new import record
 * @param supabase - Supabase client
 * @param companyId - Company UUID
 * @param datasetCode - Dataset identifier
 * @param fileName - Original file name
 * @param uploadedBy - User ID who initiated the upload
 * @returns Created import record
 */
export async function createImport(
  supabase: SupabaseClient,
  companyId: string,
  datasetCode: string,
  fileName?: string,
  uploadedBy?: string
): Promise<Import> {
  // Verify user has access to company
  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("company_id", companyId)
    .eq("user_id", uploadedBy || "")
    .single();

  if (!membership) {
    throw new ForbiddenError(`User does not have access to company ${companyId}`);
  }

  // Create import record
  const importData: ImportInsert = {
    company_id: companyId,
    dataset_code: datasetCode,
    status: "pending",
    total_rows: 0,
    valid_rows: 0,
    invalid_rows: 0,
    inserted_transactions_count: 0,
    file_name: fileName,
    uploaded_by: uploadedBy,
  };

  const { data, error } = await supabase.from("imports").insert(importData).select().single();

  if (error) {
    console.error("Database error creating import:", error);
    throw new DatabaseError("Failed to create import record", error);
  }

  return data;
}

/**
 * Get import by ID with permission check
 * @param supabase - Supabase client
 * @param companyId - Company UUID
 * @param importId - Import ID
 * @returns Import record
 */
export async function getImport(supabase: SupabaseClient, companyId: string, importId: number): Promise<Import> {
  const { data, error } = await supabase
    .from("imports")
    .select("*")
    .eq("id", importId)
    .eq("company_id", companyId)
    .single();

  if (error || !data) {
    if (error?.code === "PGRST116") {
      throw new ImportNotFoundError(importId);
    }
    console.error("Database error fetching import:", error);
    throw new DatabaseError("Failed to fetch import", error);
  }

  return data;
}

/**
 * Update import status and statistics
 * @param supabase - Supabase client
 * @param importId - Import ID
 * @param updates - Fields to update
 */
export async function updateImportStatus(
  supabase: SupabaseClient,
  importId: number,
  updates: {
    status?: "pending" | "processing" | "completed" | "failed";
    total_rows?: number;
    valid_rows?: number;
    invalid_rows?: number;
    inserted_transactions_count?: number;
    error_report_json?: any;
  }
): Promise<Import> {
  const { data, error } = await supabase.from("imports").update(updates).eq("id", importId).select().single();

  if (error) {
    console.error("Database error updating import:", error);
    throw new DatabaseError("Failed to update import status", error);
  }

  return data;
}

/**
 * Save import rows to database
 * @param supabase - Supabase client
 * @param importId - Import ID
 * @param companyId - Company UUID
 * @param rows - Array of CSV rows with validation results
 */
export async function saveImportRows(
  supabase: SupabaseClient,
  importId: number,
  companyId: string,
  rows: {
    row_number: number;
    raw_data: any;
    is_valid: boolean;
    error_message?: string;
  }[]
): Promise<void> {
  const importRows: ImportRowInsert[] = rows.map((row) => ({
    company_id: companyId,
    import_id: importId,
    row_number: row.row_number,
    raw_data: row.raw_data,
    is_valid: row.is_valid,
    error_message: row.error_message || null,
  }));

  // Insert in batches of 1000 to avoid payload size limits
  const batchSize = 1000;
  for (let i = 0; i < importRows.length; i += batchSize) {
    const batch = importRows.slice(i, i + batchSize);

    const { error } = await supabase.from("import_rows").insert(batch);

    if (error) {
      console.error("Database error saving import rows:", error);
      throw new DatabaseError(`Failed to save import rows (batch ${i / batchSize + 1})`, error);
    }
  }
}

/**
 * Get import errors for reporting
 * @param supabase - Supabase client
 * @param importId - Import ID
 * @param limit - Maximum number of errors to return
 * @returns Array of validation errors
 */
export async function getImportErrors(supabase: SupabaseClient, importId: number, limit = 100): Promise<ImportRow[]> {
  const { data, error } = await supabase
    .from("import_rows")
    .select("*")
    .eq("import_id", importId)
    .eq("is_valid", false)
    .order("row_number", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Database error fetching import errors:", error);
    throw new DatabaseError("Failed to fetch import errors", error);
  }

  return data || [];
}

/**
 * Parse CSV data and apply column mapping
 * @param csvData - Raw CSV data as array of arrays
 * @param headers - CSV headers
 * @param mapping - Column mapping configuration
 * @returns Mapped rows ready for validation
 */
export function mapCSVRows(csvData: string[][], headers: string[], mapping: ColumnMappingInput): Record<string, any>[] {
  return csvData.map((row) => {
    const mappedRow: Record<string, any> = {};

    // Map each system field to its corresponding CSV column
    Object.entries(mapping).forEach(([systemField, csvColumn]) => {
      if (csvColumn) {
        const columnIndex = headers.indexOf(csvColumn);
        if (columnIndex !== -1) {
          let value = row[columnIndex]?.trim() || null;
          
          // Normalize direction field to uppercase
          if (systemField === "direction" && value) {
            value = value.toUpperCase();
          }
          
          mappedRow[systemField] = value;
        }
      }
    });

    return mappedRow;
  });
}

/**
 * Validate mapped CSV rows
 * @param mappedRows - Rows after column mapping
 * @param validator - Zod schema for validation
 * @returns Array with validation results
 */
export function validateCSVRows(
  mappedRows: Record<string, any>[],
  validator: any
): {
  row_number: number;
  raw_data: any;
  is_valid: boolean;
  error_message?: string;
  parsed_data?: any;
}[] {
  return mappedRows.map((row, index) => {
    const result = validator.safeParse(row);

    return {
      row_number: index + 1,
      raw_data: row,
      is_valid: result.success,
      error_message: result.success
        ? undefined
        : result.error.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; "),
      parsed_data: result.success ? result.data : undefined,
    };
  });
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Process CSV import in batch - validates and saves all rows
 * @param supabase - Supabase client
 * @param importId - Import ID
 * @param companyId - Company UUID
 * @param csvData - Raw CSV data
 * @param csvHeaders - CSV column headers
 * @param mapping - Column mapping configuration
 * @param validator - Zod validation schema
 * @param skipInvalidRows - Whether to skip invalid rows during processing
 * @returns Processing result with statistics
 */
export async function processCsvBatch(
  supabase: SupabaseClient,
  importId: number,
  companyId: string,
  csvData: string[][],
  csvHeaders: string[],
  mapping: ColumnMappingInput,
  validator: any,
  skipInvalidRows = false
): Promise<{
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  error_report: any[];
}> {
  try {
    // Step 1: Update status to processing
    await updateImportStatus(supabase, importId, {
      status: "processing",
      total_rows: csvData.length,
    });

    // Step 2: Map CSV columns to system fields
    const mappedRows = mapCSVRows(csvData, csvHeaders, mapping);

    // Step 3: Validate all rows
    const validationResults = validateCSVRows(mappedRows, validator);

    // Step 4: Calculate statistics
    const validRows = validationResults.filter((r) => r.is_valid);
    const invalidRows = validationResults.filter((r) => !r.is_valid);

    // Step 5: Save all rows to import_rows table
    await saveImportRows(supabase, importId, companyId, validationResults);

    // Step 6: Build error report for invalid rows
    const errorReport = invalidRows.map((row) => ({
      row_number: row.row_number,
      error_message: row.error_message,
      raw_data: row.raw_data,
    }));

    // Step 7: Update import status with results
    const finalStatus = invalidRows.length > 0 && !skipInvalidRows ? "failed" : "completed";

    await updateImportStatus(supabase, importId, {
      status: finalStatus,
      valid_rows: validRows.length,
      invalid_rows: invalidRows.length,
      error_report_json: errorReport.length > 0 ? errorReport : null,
    });

    return {
      total_rows: csvData.length,
      valid_rows: validRows.length,
      invalid_rows: invalidRows.length,
      error_report: errorReport,
    };
  } catch (error) {
    // Update import status to failed on error
    await updateImportStatus(supabase, importId, {
      status: "failed",
    });
    throw error;
  }
}

// =============================================================================
// TRANSACTION CREATION
// =============================================================================

/**
 * Create transactions from validated import rows
 * @param supabase - Supabase client
 * @param importId - Import ID
 * @param companyId - Company UUID
 * @param baseCurrency - Company's base currency (e.g., "PLN")
 * @returns Number of transactions created
 */
export async function createTransactionsFromImport(
  supabase: SupabaseClient,
  importId: number,
  companyId: string,
  baseCurrency: string
): Promise<number> {
  // Step 1: Get import record
  const { data: importRecord, error: importError } = await supabase
    .from("imports")
    .select("*")
    .eq("id", importId)
    .eq("company_id", companyId)
    .single();

  if (importError || !importRecord) {
    throw new ImportNotFoundError(importId);
  }

  // Step 2: Get all valid import rows
  const { data: validRows, error: rowsError } = await supabase
    .from("import_rows")
    .select("*")
    .eq("import_id", importId)
    .eq("is_valid", true)
    .order("row_number", { ascending: true });

  if (rowsError) {
    console.error("Database error fetching valid rows:", rowsError);
    throw new DatabaseError("Failed to fetch valid import rows", rowsError);
  }

  if (!validRows || validRows.length === 0) {
    return 0;
  }

  // Step 3: Transform rows into transactions
  const transactions: TransactionInsert[] = [];

  for (const row of validRows) {
    const data = row.raw_data as Record<string, any>;

    // Parse amount (handle Polish format with spaces, commas, and parentheses for negatives)
    let amountStr = String(data.amount || "0").trim();
    
    // Handle negative amounts in parentheses: (123.45) -> -123.45
    const isNegativeParentheses = amountStr.startsWith("(") && amountStr.endsWith(")");
    if (isNegativeParentheses) {
      amountStr = "-" + amountStr.slice(1, -1).trim();
    }
    
    // Remove spaces (thousand separators)
    amountStr = amountStr.replace(/\s/g, "");
    
    // Replace comma with dot for decimal separator (Polish format)
    // Only if there's one comma and it's followed by 1-2 digits
    if ((amountStr.match(/,/g) || []).length === 1 && /,\d{1,2}$/.test(amountStr)) {
      amountStr = amountStr.replace(",", ".");
    } else {
      // Remove commas as thousand separators
      amountStr = amountStr.replace(/,/g, "");
    }
    
    const amountFloat = parseFloat(amountStr);
    // Amounts are always positive in the system - direction field determines inflow/outflow
    const amountTxCents = Math.round(Math.abs(amountFloat) * 100);

    // Determine if currency conversion is needed
    const currencyTx = data.currency || baseCurrency;
    const fxRate = currencyTx === baseCurrency ? null : 1.0; // TODO: Lookup actual FX rate
    const amountBookCents = fxRate ? Math.round(amountTxCents * fxRate) : amountTxCents;

    // Generate flow_id if not provided
    const flowId = data.flow_id || `import-${importId}-row-${row.row_number}`;

    // Handle Initial Balance (IB) transactions
    let actualDirection = data.direction;
    let timeSlot: string;
    
    if (data.direction === 'IB') {
      // For IB, determine direction from amount sign
      // Positive amount = INFLOW, Negative amount = OUTFLOW
      actualDirection = amountFloat >= 0 ? 'INFLOW' : 'OUTFLOW';
      timeSlot = 'IB';
    } else {
      // Regular transaction - calculate time_slot from date
      timeSlot = calculateTimeSlot(new Date(data.date_due));
    }

    // Parse date
    const dateDue = new Date(data.date_due).toISOString().split("T")[0];

    transactions.push({
      company_id: companyId,
      import_id: importId,
      dataset_code: importRecord.dataset_code,
      flow_id: flowId,
      account_id: null, // TODO: Lookup or create account
      is_active: true,
      amount_tx_cents: amountTxCents,
      currency_tx: currencyTx,
      fx_rate: fxRate,
      amount_book_cents: amountBookCents,
      date_due: dateDue,
      direction: actualDirection,
      time_slot: timeSlot,
      project: data.project || null,
      counterparty: data.counterparty || null,
      document: data.document || null,
      description: data.description || null,
      payment_source: data.payment_source || "CSV_IMPORT",
    });
  }

  // Step 4: Insert transactions in batches
  let insertedCount = 0;
  const batchSize = 1000;

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);

    const { error: insertError } = await supabase.from("transactions").insert(batch);

    if (insertError) {
      console.error("Database error inserting transactions:", insertError);
      throw new DatabaseError(`Failed to insert transactions (batch ${i / batchSize + 1})`, insertError);
    }

    insertedCount += batch.length;
  }

  // Step 5: Update import record with transaction count
  await updateImportStatus(supabase, importId, {
    inserted_transactions_count: insertedCount,
  });

  return insertedCount;
}

/**
 * Calculate time_slot in YYWW format from date
 * @param date - Transaction date
 * @returns Time slot string (e.g., "2501" for week 1 of 2025)
 */
function calculateTimeSlot(date: Date): string {
  // Get year (last 2 digits)
  const year = date.getFullYear().toString().slice(-2);

  // Calculate week number (ISO week)
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);

  // Format as YYWW (pad week with zero if needed)
  return `${year}${weekNumber.toString().padStart(2, "0")}`;
}

/**
 * Get or create company by ID
 * @param supabase - Supabase client
 * @param companyId - Company UUID
 * @returns Company record with base_currency
 */
export async function getCompany(
  supabase: SupabaseClient,
  companyId: string
): Promise<{ id: string; base_currency: string }> {
  const { data, error } = await supabase.from("companies").select("id, base_currency").eq("id", companyId).single();

  if (error || !data) {
    throw new CompanyNotFoundError(companyId);
  }

  return data;
}
