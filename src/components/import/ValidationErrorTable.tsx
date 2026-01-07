import { useState } from "react";
import { ErrorRow } from "./ErrorRow";
import { Button } from "@/components/ui/button";
import type { ValidationError } from "@/types";

interface ValidationErrorTableProps {
  errors: ValidationError[];
  itemsPerPage?: number;
}

export function ValidationErrorTable({ errors, itemsPerPage = 10 }: ValidationErrorTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(errors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentErrors = errors.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b">Nr wiersza</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b">Kolumna</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b">Wartość</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b">Komunikat błędu</th>
              </tr>
            </thead>
            <tbody>
              {currentErrors.map((error, index) => (
                <ErrorRow key={`${error.row_number}-${index}`} error={error} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Strona {currentPage} z {totalPages} ({errors.length} błędów)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
              Poprzednia
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
              Następna
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
