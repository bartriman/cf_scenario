import { useState } from "react";
import { useImportWizard } from "@/components/hooks/useImportWizard";
import { WizardProgress } from "./WizardProgress";
import { FileUploadStep } from "./FileUploadStep";
import { ColumnMappingStep } from "./ColumnMappingStep";
import { ValidationStep } from "./ValidationStep";
import { ProcessingStep } from "./ProcessingStep";
import { prepareImportPayload, submitImport } from "@/lib/utils/csv-import";
import type { WizardStep, ValidationResult } from "@/types";

interface ImportWizardProps {
  companyId: string;
  onComplete?: (scenarioId: number) => void;
  onCancel?: () => void;
}

const STEP_LABELS = [
  { label: "Upload pliku", status: "inactive" as const },
  { label: "Mapowanie kolumn", status: "inactive" as const },
  { label: "Walidacja", status: "inactive" as const },
  { label: "Przetwarzanie", status: "inactive" as const },
];

export default function ImportWizard({ companyId, onCancel }: ImportWizardProps) {
  const {
    state,
    nextStep,
    previousStep,
    setFileData,
    setMapping,
    setValidationResult,
    setImportId,
    setScenarioId,
    setError,
    canProceed,
  } = useImportWizard(companyId);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Przygotowanie kroków dla WizardProgress
  const steps = STEP_LABELS.map((stepLabel, index) => {
    const stepNumber = index + 1;
    let status: "completed" | "active" | "inactive";

    if (stepNumber < state.currentStep) {
      status = "completed";
    } else if (stepNumber === state.currentStep) {
      status = "active";
    } else {
      status = "inactive";
    }

    return {
      ...stepLabel,
      status,
    };
  });

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleCompleteImport = (scenarioId: number) => {
    setScenarioId(scenarioId);
    // Przekierowanie będzie obsłużone przez useEffect w komponencie nadrzędnym
    // lub bezpośrednio poprzez nawigację
    if (typeof window !== "undefined" && scenarioId > 0) {
      setTimeout(() => {
        window.location.href = `/scenarios/${scenarioId}`;
      }, 1000);
    }
  };

  const handleValidationStart = async () => {
    if (!state.file || !state.datasetCode) {
      setError("Brak pliku lub kodu datasetu");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare import payload
      const payload = await prepareImportPayload(state.file, state.datasetCode, state.columnMapping, true);

      // Submit to API
      const result = await submitImport(companyId, payload);

      // Store import ID and scenario ID
      setImportId(result.import_id);
      if (result.scenario_id) {
        setScenarioId(result.scenario_id);
      }

      // Create validation result from API response
      const validationResult: ValidationResult = {
        import_id: result.import_id,
        total_rows: result.total_rows,
        valid_rows: result.valid_rows,
        invalid_rows: result.invalid_rows,
        errors: result.errors || [],
        status: result.invalid_rows === 0 ? "success" : result.valid_rows === 0 ? "error" : "warning",
      };

      setValidationResult(validationResult);
      nextStep();
    } catch (error) {
      console.error("Import submission error:", error);
      setError(error instanceof Error ? error.message : "An error occurred during import");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (state.currentStep as WizardStep) {
      case 1: // FileUpload
        return (
          <FileUploadStep
            onNext={(file: File, datasetCode: string, headers: string[], previewRows: string[][]) => {
              setFileData(file, datasetCode, headers, previewRows);
              nextStep();
            }}
            onCancel={handleCancel}
          />
        );

      case 2: // ColumnMapping
        return (
          <ColumnMappingStep
            csvHeaders={state.csvHeaders}
            previewRows={state.previewRows}
            mapping={state.columnMapping}
            onMappingChange={setMapping}
            onNext={handleValidationStart}
            onBack={previousStep}
            canProceed={canProceed && !isSubmitting}
            isLoading={isSubmitting}
          />
        );

      case 3: {
        // Validation - use actual validation result from API
        if (!state.validationResult) {
          return (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-800 dark:text-red-200 font-medium">Error: No validation data</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                Go back to the previous step and try again.
              </p>
            </div>
          );
        }

        return (
          <ValidationStep
            validationResult={state.validationResult}
            onContinueWithErrors={() => {
              // Import already submitted, just move to processing step
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      }

      case 4: // Processing
        return (
          <ProcessingStep
            importId={state.importId || 1}
            companyId={companyId}
            scenarioId={state.scenarioId}
            onComplete={handleCompleteImport}
            onError={() => {
              // Error handling to be implemented
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Import data</h1>
        <p className="text-muted-foreground">Import financial data from CSV file and create a new base scenario</p>
      </div>

      {/* Progress indicator */}
      <WizardProgress steps={steps} />

      {/* Error message */}
      {state.error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive font-medium">{state.error}</p>
        </div>
      )}

      {/* Step content */}
      <div className="bg-card border rounded-lg shadow-sm p-6 md:p-8">{renderStep()}</div>
    </div>
  );
}
