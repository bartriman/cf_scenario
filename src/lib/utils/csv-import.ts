import Papa from "papaparse";
import type { ColumnMapping } from "@/types";

/**
 * Detect and decode CSV file with proper encoding (UTF-8 or Windows-1250/ANSI)
 */
async function decodeCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        reject(new Error("Failed to read file"));
        return;
      }

      // Try UTF-8 first
      let decoded = new TextDecoder("utf-8").decode(arrayBuffer);
      
      // Check for replacement characters (�) which indicate encoding issues
      if (decoded.includes("�") || decoded.includes("\ufffd")) {
        // Try Windows-1250 (ANSI for Central European languages including Polish)
        try {
          decoded = new TextDecoder("windows-1250").decode(arrayBuffer);
        } catch {
          // If Windows-1250 fails, try ISO-8859-2 as fallback
          try {
            decoded = new TextDecoder("iso-8859-2").decode(arrayBuffer);
          } catch {
            // Fall back to UTF-8 if all else fails
            decoded = new TextDecoder("utf-8").decode(arrayBuffer);
          }
        }
      }

      resolve(decoded);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse entire CSV file and return all data rows
 */
export async function parseFullCSV(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  // First decode the file with proper encoding
  const decodedContent = await decodeCSVFile(file);

  return new Promise((resolve, reject) => {
    Papa.parse(decodedContent, {
      delimiter: ";",
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
          return;
        }

        const data = results.data as string[][];

        if (data.length === 0) {
          reject(new Error("CSV file is empty"));
          return;
        }

        const headers = data[0];
        const rows = data.slice(1).filter((row) => row.some((cell) => cell.trim() !== "")); // Filter empty rows

        if (rows.length === 0) {
          reject(new Error("CSV file contains only headers, no data rows"));
          return;
        }

        resolve({ headers, rows });
      },
      error: (error) => {
        reject(new Error(`Failed to read file: ${error.message}`));
      },
      skipEmptyLines: true,
    });
  });
}

/**
 * Prepare import payload for API
 */
export interface PrepareImportPayload {
  dataset_code: string;
  column_mapping: ColumnMapping;
  skip_invalid_rows: boolean;
  file_name?: string;
  csv_data: string[][];
  csv_headers: string[];
}

export async function prepareImportPayload(
  file: File,
  datasetCode: string,
  columnMapping: ColumnMapping,
  skipInvalidRows = true
): Promise<PrepareImportPayload> {
  const { headers, rows } = await parseFullCSV(file);

  return {
    dataset_code: datasetCode,
    column_mapping: columnMapping,
    skip_invalid_rows: skipInvalidRows,
    file_name: file.name,
    csv_data: rows,
    csv_headers: headers,
  };
}

/**
 * Submit import to API
 */
export async function submitImport(
  companyId: string,
  payload: PrepareImportPayload
): Promise<{
  import_id: number;
  status: string;
  message: string;
  dataset_code: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  transaction_count: number;
  scenario_id: number | null;
  errors: any[];
}> {
  const response = await fetch(`/api/companies/${companyId}/imports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(errorData.error?.message || `Import failed with status ${response.status}`);
  }

  return response.json();
}
