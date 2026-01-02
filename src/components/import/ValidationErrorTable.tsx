import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { ImportErrorRowVM, PaginationDTO } from "../../types";

interface ValidationErrorTableProps {
  importId: number;
  companyId: string;
}

/**
 * Tabela prezentująca szczegółowe błędy walidacji dla nieprawidłowych wierszy CSV.
 * Wyświetla informacje o numerze wiersza, surowych danych i opisie błędu z paginacją.
 */
export function ValidationErrorTable({ importId, companyId }: ValidationErrorTableProps) {
  const [errors, setErrors] = useState<ImportErrorRowVM[]>([]);
  const [pagination, setPagination] = useState<PaginationDTO | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const limit = 50;

  /**
   * Pobieranie błędów z API
   */
  const fetchErrors = useCallback(
    async (page: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/companies/${companyId}/imports/${importId}/errors?page=${page}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error("Nie udało się pobrać błędów walidacji");
        }

        const data = await response.json();

        // Formatowanie danych dla lepszej czytelności
        const formattedErrors: ImportErrorRowVM[] = data.errors.map((err: ImportErrorRowVM) => ({
          ...err,
          formattedData: formatRawData(err.raw_data),
        }));

        setErrors(formattedErrors);
        setPagination(data.pagination);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, importId]
  );

  /**
   * Formatowanie surowych danych JSON
   */
  const formatRawData = (rawData: unknown): string => {
    if (typeof rawData === "string") {
      try {
        const parsed = JSON.parse(rawData);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return rawData;
      }
    }
    return JSON.stringify(rawData, null, 2);
  };

  /**
   * Toggle rozwinięcia wiersza
   */
  const toggleRowExpansion = (rowNumber: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowNumber)) {
        newSet.delete(rowNumber);
      } else {
        newSet.add(rowNumber);
      }
      return newSet;
    });
  };

  /**
   * Obsługa zmiany strony
   */
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setExpandedRows(new Set()); // Reset rozwiniętych wierszy przy zmianie strony
  };

  /**
   * Effect do pobierania błędów
   */
  useEffect(() => {
    fetchErrors(currentPage);
  }, [currentPage, fetchErrors]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <p className="text-muted-foreground">Ładowanie błędów walidacji...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errors.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Szczegóły błędów walidacji</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Nr wiersza</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Surowe dane</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Opis błędu</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((errorRow) => {
                  const isExpanded = expandedRows.has(errorRow.row_number);
                  const dataPreview =
                    errorRow.formattedData.length > 100
                      ? errorRow.formattedData.substring(0, 100) + "..."
                      : errorRow.formattedData;

                  return (
                    <tr key={errorRow.row_number} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium">{errorRow.row_number}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="space-y-2">
                          <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-w-md">
                            {isExpanded ? errorRow.formattedData : dataPreview}
                          </pre>
                          {errorRow.formattedData.length > 100 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(errorRow.row_number)}
                              aria-label={isExpanded ? "Zwiń dane" : "Rozwiń dane"}
                            >
                              {isExpanded ? "Zwiń" : "Rozwiń"}
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-destructive">{errorRow.error_message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginacja */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Strona {pagination.page} z {pagination.total_pages} (Łącznie: {pagination.total} błędów)
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.has_prev}
                aria-label="Poprzednia strona"
              >
                <ChevronLeft className="w-4 h-4" />
                Poprzednia
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.has_next}
                aria-label="Następna strona"
              >
                Następna
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
