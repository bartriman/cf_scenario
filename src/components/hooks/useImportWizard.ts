import { useState, useCallback } from "react";
import type { ImportWizardState, WizardStep, ColumnMapping, ValidationResult } from "@/types";

interface UseImportWizardReturn {
  // Stan
  state: ImportWizardState;

  // Akcje nawigacji
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  previousStep: () => void;

  // Akcje kroków
  setFileData: (file: File, datasetCode: string, headers: string[], previewRows: string[][]) => void;
  setMapping: (mapping: ColumnMapping) => void;
  setValidationResult: (result: ValidationResult) => void;
  setImportId: (importId: number) => void;
  setScenarioId: (scenarioId: number) => void;
  setError: (error: string | null) => void;

  // Pomocnicze
  canProceed: boolean;
  isLoading: boolean;
  reset: () => void;
}

const initialMapping: ColumnMapping = {
  date_due: null,
  amount: null,
  direction: null,
  currency: null,
  flow_id: null,
  counterparty: null,
  description: null,
  project: null,
  document: null,
  payment_source: null,
};

export function useImportWizard(companyId: string): UseImportWizardReturn {
  const [state, setState] = useState<ImportWizardState>({
    currentStep: 1, // WizardStep.FileUpload
    companyId,
    file: null,
    datasetCode: "",
    csvHeaders: [],
    previewRows: [],
    columnMapping: initialMapping,
    validationResult: null,
    importId: null,
    scenarioId: null,
    error: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Nawigacja
  const goToStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step, error: null }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 4) as WizardStep,
      error: null,
    }));
  }, []);

  const previousStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1) as WizardStep,
      error: null,
    }));
  }, []);

  // Akcje kroków
  const setFileData = useCallback((file: File, datasetCode: string, headers: string[], previewRows: string[][]) => {
    setState((prev) => ({
      ...prev,
      file,
      datasetCode,
      csvHeaders: headers,
      previewRows,
      error: null,
    }));
  }, []);

  const setMapping = useCallback((mapping: ColumnMapping) => {
    setState((prev) => ({
      ...prev,
      columnMapping: mapping,
      error: null,
    }));
  }, []);

  const setValidationResult = useCallback((result: ValidationResult) => {
    setState((prev) => ({
      ...prev,
      validationResult: result,
      error: null,
    }));
  }, []);

  const setImportId = useCallback((importId: number) => {
    setState((prev) => ({
      ...prev,
      importId,
      error: null,
    }));
  }, []);

  const setScenarioId = useCallback((scenarioId: number) => {
    setState((prev) => ({
      ...prev,
      scenarioId,
      error: null,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const reset = useCallback(() => {
    setState({
      currentStep: 1,
      companyId,
      file: null,
      datasetCode: "",
      csvHeaders: [],
      previewRows: [],
      columnMapping: initialMapping,
      validationResult: null,
      importId: null,
      scenarioId: null,
      error: null,
    });
    setIsLoading(false);
  }, [companyId]);

  // Walidacja możliwości przejścia dalej
  const canProceed = (() => {
    switch (state.currentStep) {
      case 1: // FileUpload
        return state.file !== null && state.datasetCode.trim() !== "";
      case 2: // ColumnMapping
        return (
          state.columnMapping.date_due !== null &&
          state.columnMapping.amount !== null &&
          state.columnMapping.direction !== null &&
          state.columnMapping.currency !== null
        );
      case 3: // Validation
        return state.validationResult !== null && state.validationResult.valid_rows > 0;
      case 4: // Processing
        return false; // Nie ma przycisku "Dalej" w tym kroku
      default:
        return false;
    }
  })();

  return {
    state,
    goToStep,
    nextStep,
    previousStep,
    setFileData,
    setMapping,
    setValidationResult,
    setImportId,
    setScenarioId,
    setError,
    canProceed,
    isLoading,
    reset,
  };
}
