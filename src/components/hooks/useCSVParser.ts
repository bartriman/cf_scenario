import { useState, useCallback } from "react";
import Papa from "papaparse";

interface UseCSVParserReturn {
  parse: (file: File) => Promise<{ headers: string[]; rows: string[][] }>;
  isLoading: boolean;
  error: string | null;
}

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

export function useCSVParser(): UseCSVParserReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(async (file: File): Promise<{ headers: string[]; rows: string[][] }> => {
    setIsLoading(true);
    setError(null);

    try {
      // First decode the file with proper encoding
      const decodedContent = await decodeCSVFile(file);

      return new Promise((resolve, reject) => {
        Papa.parse(decodedContent, {
          delimiter: ";",
          complete: (results) => {
            setIsLoading(false);

            if (results.errors.length > 0) {
              const errorMsg = `CSV parsing error: ${results.errors[0].message}`;
              setError(errorMsg);
              reject(new Error(errorMsg));
              return;
            }

            const data = results.data as string[][];

            if (data.length === 0) {
              const errorMsg = "Plik CSV jest pusty";
              setError(errorMsg);
              reject(new Error(errorMsg));
              return;
            }

            const headers = data[0];
            const rows = data.slice(1, 6); // First 5 data rows for preview

            if (data.length === 1) {
              const errorMsg = "CSV file contains only headers, no data";
              setError(errorMsg);
              reject(new Error(errorMsg));
              return;
            }

            resolve({ headers, rows });
          },
          error: (error) => {
            setIsLoading(false);
            const errorMsg = `Cannot read file: ${error.message}`;
            setError(errorMsg);
            reject(new Error(errorMsg));
          },
          skipEmptyLines: true,
        });
      });
    } catch (err) {
      setIsLoading(false);
      const errorMsg = err instanceof Error ? err.message : "Cannot read file";
      setError(errorMsg);
      throw err;
    }
  }, []);

  return {
    parse,
    isLoading,
    error,
  };
}
