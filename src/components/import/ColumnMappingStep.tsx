import { Button } from "@/components/ui/button";
import { CSVPreview } from "./CSVPreview";
import { ColumnMapper } from "./ColumnMapper";
import type { ColumnMapping } from "@/types";

interface ColumnMappingStepProps {
  csvHeaders: string[];
  previewRows: string[][];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
  isLoading?: boolean;
}

export function ColumnMappingStep({
  csvHeaders,
  previewRows,
  mapping,
  onMappingChange,
  onNext,
  onBack,
  canProceed,
  isLoading = false,
}: ColumnMappingStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Mapowanie kolumn</h2>
        <p className="text-muted-foreground">Sprawdź podgląd danych i przypisz kolumny CSV do pól systemowych</p>
      </div>

      {/* CSV Preview */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Podgląd danych</h3>
        <CSVPreview headers={csvHeaders} rows={previewRows} maxRows={5} />
      </div>

      {/* Column Mapping */}
      <div>
        <ColumnMapper csvHeaders={csvHeaders} mapping={mapping} onChange={onMappingChange} />
      </div>

      {/* Validation warning */}
      {!canProceed && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
            Wszystkie wymagane pola muszą być zmapowane, aby kontynuować
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Wstecz
        </Button>
        <Button onClick={onNext} disabled={!canProceed || isLoading} className="ml-auto">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Przetwarzanie...
            </>
          ) : (
            "Dalej"
          )}
        </Button>
      </div>
    </div>
  );
}
