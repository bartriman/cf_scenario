import { useState, useCallback } from "react";
import type {
  ImportWizardState,
  ImportWizardStep,
  FileValidationResult,
  CreateImportResponseDTO,
  ImportDetailsResponseDTO,
} from "../../types";
import { useImportPolling } from "./useImportPolling";

interface UseImportWizardParams {
  companyId: string;
}

interface UseImportWizardReturn {
  // Stan
  state: ImportWizardState;

  // Akcje
  setFile: (file: File | null) => void;
  setDatasetCode: (code: string) => void;
  handleUploadSuccess: (importData: CreateImportResponseDTO) => void;
  handleUploadError: (error: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetWizard: () => void;

  // Walidacja
  canProceedToNextStep: boolean;
}

/**
 * Główny hook zarządzający stanem kreatora importu.
 * Obsługuje walidację, upload pliku, polling statusu i nawigację między krokami.
 */
export function useImportWizard({ companyId }: UseImportWizardParams): UseImportWizardReturn {
  const [state, setState] = useState<ImportWizardState>({
    currentStep: 1,
    completedSteps: [],
    selectedFile: null,
    datasetCode: "",
    importId: null,
    importDetails: null,
    isProcessing: false,
    error: null,
  });

  /**
   * Ustawienie wybranego pliku
   */
  const setFile = useCallback((file: File | null) => {
    setState((prev) => ({
      ...prev,
      selectedFile: file,
      error: null,
    }));
  }, []);

  /**
   * Ustawienie dataset code
   */
  const setDatasetCode = useCallback((code: string) => {
    setState((prev) => ({
      ...prev,
      datasetCode: code,
      error: null,
    }));
  }, []);

  /**
   * Obsługa sukcesu uploadu - przejście do kroku 2
   */
  const handleUploadSuccess = useCallback((importData: CreateImportResponseDTO) => {
    setState((prev) => ({
      ...prev,
      importId: importData.id,
      importDetails: importData as unknown as ImportDetailsResponseDTO,
      currentStep: 2,
      completedSteps: [1],
      isProcessing: true,
      error: null,
    }));
  }, []);

  /**
   * Obsługa błędu uploadu
   */
  const handleUploadError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      error,
      isProcessing: false,
    }));
  }, []);

  /**
   * Callback dla aktualizacji danych z pollingu
   */
  const handlePollingUpdate = useCallback((details: ImportDetailsResponseDTO) => {
    setState((prev) => ({
      ...prev,
      importDetails: details,
    }));
  }, []);

  /**
   * Callback gdy polling się zakończył
   */
  const handlePollingComplete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isProcessing: false,
      completedSteps: [...prev.completedSteps, 2],
    }));
  }, []);

  /**
   * Uruchomienie pollingu
   */
  useImportPolling({
    companyId,
    importId: state.importId,
    enabled: state.currentStep === 2 && state.isProcessing,
    onUpdate: handlePollingUpdate,
    onComplete: handlePollingComplete,
  });

  /**
   * Przejście do następnego kroku
   */
  const nextStep = useCallback(() => {
    setState((prev) => {
      const nextStepNumber = (prev.currentStep + 1) as ImportWizardStep;

      // Nie pozwalaj przejść dalej niż krok 3
      if (nextStepNumber > 3) return prev;

      return {
        ...prev,
        currentStep: nextStepNumber,
        completedSteps: [...prev.completedSteps, prev.currentStep],
      };
    });
  }, []);

  /**
   * Powrót do poprzedniego kroku
   */
  const prevStep = useCallback(() => {
    setState((prev) => {
      const prevStepNumber = (prev.currentStep - 1) as ImportWizardStep;

      // Nie pozwalaj wrócić przed krok 1
      if (prevStepNumber < 1) return prev;

      return {
        ...prev,
        currentStep: prevStepNumber,
      };
    });
  }, []);

  /**
   * Reset kreatora do stanu początkowego
   */
  const resetWizard = useCallback(() => {
    setState({
      currentStep: 1,
      completedSteps: [],
      selectedFile: null,
      datasetCode: "",
      importId: null,
      importDetails: null,
      isProcessing: false,
      error: null,
    });
  }, []);

  /**
   * Sprawdzenie czy można przejść do następnego kroku
   */
  const canProceedToNextStep = (() => {
    switch (state.currentStep) {
      case 1:
        // Krok 1: Plik wybrany i dataset code niepusty
        return state.selectedFile !== null && state.datasetCode.trim().length > 0;

      case 2:
        // Krok 2: Import zakończony (status completed lub failed)
        return (
          state.importDetails !== null &&
          (state.importDetails.status === "completed" || state.importDetails.status === "failed")
        );

      case 3:
        // Krok 3: Ostatni krok, nie można przejść dalej
        return false;

      default:
        return false;
    }
  })();

  return {
    state,
    setFile,
    setDatasetCode,
    handleUploadSuccess,
    handleUploadError,
    nextStep,
    prevStep,
    resetWizard,
    canProceedToNextStep,
  };
}
