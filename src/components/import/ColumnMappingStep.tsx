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
}

export function ColumnMappingStep({
  csvHeaders,
  previewRows,
  mapping,
  onMappingChange,
  onNext,
  onBack,
  canProceed,
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
        <Button variant="outline" onClick={onBack}>
          Wstecz
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="ml-auto">
          Dalej
        </Button>
      </div>
    </div>
  );
}
