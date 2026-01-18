import { useState, useCallback } from "react";
import Papa from "papaparse";

interface UseCSVParserReturn {
  parse: (file: File) => Promise<{ headers: string[]; rows: string[][] }>;
  isLoading: boolean;
  error: string | null;
}

export function useCSVParser(): UseCSVParserReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(async (file: File): Promise<{ headers: string[]; rows: string[][] }> => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        delimiter: ";",
        complete: (results) => {
          setIsLoading(false);

          if (results.errors.length > 0) {
            const errorMsg = `Błąd parsowania CSV: ${results.errors[0].message}`;
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
            const errorMsg = "Plik CSV zawiera tylko nagłówki, brak danych";
            setError(errorMsg);
            reject(new Error(errorMsg));
            return;
          }

          resolve({ headers, rows });
        },
        error: (error) => {
          setIsLoading(false);
          const errorMsg = `Nie można odczytać pliku: ${error.message}`;
          setError(errorMsg);
          reject(new Error(errorMsg));
        },
        skipEmptyLines: true,
      });
    });
  }, []);

  return {
    parse,
    isLoading,
    error,
  };
}
