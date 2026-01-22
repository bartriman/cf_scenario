import { Button } from "@/components/ui/button";
import { ValidationSummary } from "./ValidationSummary";
import { ValidationErrorTable } from "./ValidationErrorTable";
import { DownloadErrorReportButton } from "./DownloadErrorReportButton";
import type { ValidationResult } from "@/types";

interface ValidationStepProps {
  validationResult: ValidationResult;
  onContinueWithErrors: () => void;
  onBack: () => void;
}

export function ValidationStep({ validationResult, onContinueWithErrors, onBack }: ValidationStepProps) {
  // Obsługa braku danych walidacji
  if (!validationResult) {
    return (
      <div
        className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md"
        role="alert"
      >
        <p className="text-red-800 dark:text-red-200 font-medium">Error: No validation data</p>
        <p className="text-sm text-red-700 dark:text-red-300 mt-2">
          Cannot display validation results. Please try again or contact the administrator.
        </p>
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
      </div>
    );
  }

  const { total_rows, valid_rows, invalid_rows, errors } = validationResult;
  const hasErrors = invalid_rows > 0;
  const canProceed = valid_rows > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Data validation</h2>
        <p className="text-muted-foreground">Checking data correctness from CSV file before import</p>
      </div>

      {/* Validation Summary */}
      <ValidationSummary totalRows={total_rows} validRows={valid_rows} invalidRows={invalid_rows} />

      {/* Error Details */}
      {hasErrors && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Error Details</h3>
            <DownloadErrorReportButton errors={errors} />
          </div>
          <ValidationErrorTable errors={errors} itemsPerPage={10} />
        </div>
      )}

      {/* Information about proceeding */}
      {hasErrors && canProceed && (
        <div
          className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> You can continue the import by skipping invalid rows. Only valid rows ({valid_rows})
            will be imported.
          </p>
        </div>
      )}

      {/* Cannot proceed warning */}
      {!canProceed && (
        <div
          className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Cannot continue:</strong> All rows contain errors. Fix the CSV file and try again.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onBack}>
          Wróć i popraw plik
        </Button>
        {canProceed && (
          <Button onClick={onContinueWithErrors} className="ml-auto">
            {hasErrors ? `Pomiń błędy i importuj (${valid_rows} wierszy)` : "Kontynuuj import"}
          </Button>
        )}
      </div>
    </div>
  );
}
