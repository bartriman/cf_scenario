import { useImportWizard } from "@/components/hooks/useImportWizard";
import { WizardProgress } from "./WizardProgress";
import { FileUploadStep } from "./FileUploadStep";
import { ColumnMappingStep } from "./ColumnMappingStep";
import { ValidationStep } from "./ValidationStep";
import { ProcessingStep } from "./ProcessingStep";
import type { WizardStep } from "@/types";

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
  const { state, nextStep, previousStep, setFileData, setMapping, setImportId, setScenarioId, canProceed } =
    useImportWizard(companyId);

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
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.location.href = `/scenarios/${scenarioId}`;
      }, 1000);
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
            onNext={nextStep}
            onBack={previousStep}
            canProceed={canProceed}
          />
        );

      case 3: {
        // Validation
        // Dla demonstracji używamy mock validationResult
        // W przyszłości będzie to dane z API
        const mockValidationResult = state.validationResult || {
          import_id: 1,
          total_rows: 100,
          valid_rows: 95,
          invalid_rows: 5,
          errors: [
            {
              row_number: 5,
              field_name: "amount",
              invalid_value: "-100",
              error_message: "Kwota nie może być ujemna",
              error_code: "NEGATIVE_AMOUNT",
            },
            {
              row_number: 12,
              field_name: "date_due",
              invalid_value: "2024-13-01",
              error_message: "Nieprawidłowy format daty",
              error_code: "INVALID_DATE_FORMAT",
            },
          ],
          status: "warning" as const,
        };

        return (
          <ValidationStep
            validationResult={mockValidationResult}
            onContinueWithErrors={() => {
              setImportId(1); // Mock import ID
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
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Import danych CSV</h1>
        <p className="text-muted-foreground">Zaimportuj dane finansowe z pliku CSV i utwórz nowy scenariusz bazowy</p>
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
