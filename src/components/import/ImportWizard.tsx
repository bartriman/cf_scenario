import { AlertCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { ProgressBar } from "./ProgressBar";
import { FileUploadZone } from "./FileUploadZone";
import { ValidationStatusPanel } from "./ValidationStatusPanel";
import { CompletionPanel } from "./CompletionPanel";
import { useImportWizard } from "../hooks/useImportWizard";

interface ImportWizardProps {
  companyId: string;
}

/**
 * Główny komponent-orkiestrator zarządzający logiką kroków kreatora importu CSV.
 * Odpowiada za przechodzenie między krokami, zarządzanie stanem globalnym importu
 * oraz obsługę komunikacji z API.
 */
export function ImportWizard({ companyId }: ImportWizardProps) {
  const { state, handleUploadSuccess, handleUploadError, nextStep, prevStep, resetWizard, canProceedToNextStep } =
    useImportWizard({ companyId });

  const { currentStep, completedSteps, error, importDetails, isProcessing } = state;

  /**
   * Anulowanie i powrót do dashboardu
   */
  const handleCancel = () => {
    if (confirm("Czy na pewno chcesz anulować? Niezapisane dane zostaną utracone.")) {
      window.location.href = "/";
    }
  };

  /**
   * Renderowanie treści aktualnego kroku
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <FileUploadZone
            companyId={companyId}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        );

      case 2:
        if (!importDetails) {
          return (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Brak danych importu</p>
              </CardContent>
            </Card>
          );
        }
        return <ValidationStatusPanel importDetails={importDetails} companyId={companyId} />;

      case 3:
        if (!importDetails) {
          return (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Brak danych importu</p>
              </CardContent>
            </Card>
          );
        }
        return <CompletionPanel importDetails={importDetails} onStartNewImport={resetWizard} />;

      default:
        return null;
    }
  };

  /**
   * Tytuł i opis aktualnego kroku
   */
  const getStepInfo = () => {
    switch (currentStep) {
      case 1:
        return {
          title: "Krok 1: Upload pliku CSV",
          description: "Wybierz plik CSV z danymi finansowymi i podaj kod zbioru danych",
        };
      case 2:
        return {
          title: "Krok 2: Walidacja i przetwarzanie",
          description: "System przetwarza plik i waliduje dane",
        };
      case 3:
        return {
          title: "Krok 3: Zakończenie",
          description: "Import zakończony - wybierz następny krok",
        };
      default:
        return { title: "", description: "" };
    }
  };

  const stepInfo = getStepInfo();

  /**
   * Czy pokazać przyciski nawigacji
   */
  const showNavigationButtons = currentStep !== 3; // W kroku 3 CompletionPanel ma własne przyciski

  /**
   * Czy przycisk "Dalej" powinien być disabled
   */
  const isNextDisabled = !canProceedToNextStep || isProcessing;

  /**
   * Czy przycisk "Wstecz" powinien być disabled
   */
  const isPrevDisabled = currentStep === 1 || isProcessing;

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} completedSteps={completedSteps} />

      {/* Nagłówek kroku */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{stepInfo.title}</h2>
        <p className="text-muted-foreground">{stepInfo.description}</p>
      </div>

      {/* Błąd globalny */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 rounded-md bg-destructive/10 border border-destructive/20"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive">Wystąpił błąd</h3>
            <p className="text-sm text-destructive/90 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Treść kroku */}
      <div>{renderStepContent()}</div>

      {/* Przyciski nawigacji */}
      {showNavigationButtons && (
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex gap-3">
            {/* Przycisk Wstecz - pokazuj tylko od kroku 2 */}
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isPrevDisabled}
                aria-label="Wróć do poprzedniego kroku"
              >
                <ChevronLeft className="w-4 h-4" />
                Wstecz
              </Button>
            )}

            {/* Przycisk Anuluj */}
            <Button variant="ghost" onClick={handleCancel} disabled={isProcessing} aria-label="Anuluj import">
              <X className="w-4 h-4" />
              Anuluj
            </Button>
          </div>

          {/* Przycisk Dalej - pokazuj tylko w krokach 1 i 2 */}
          {currentStep < 3 && (
            <Button onClick={nextStep} disabled={isNextDisabled} aria-label="Przejdź do następnego kroku">
              Dalej
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Informacja o przetwarzaniu */}
      {isProcessing && currentStep === 2 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="animate-pulse">⏳</span>
          <p>Przetwarzanie w toku... Nie zamykaj tej strony.</p>
        </div>
      )}
    </div>
  );
}
