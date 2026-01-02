import { CheckCircle2, ArrowRight, Upload, Home } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { ImportDetailsResponseDTO } from "../../types";

interface CompletionPanelProps {
  importDetails: ImportDetailsResponseDTO;
  onStartNewImport: () => void;
}

/**
 * Panel podsumowujący zakończony proces importu i prezentujący następne kroki użytkownikowi.
 * Wyświetla szczegóły importu oraz przyciski do nawigacji.
 */
export function CompletionPanel({ importDetails, onStartNewImport }: CompletionPanelProps) {
  const { dataset_code, inserted_transactions_count, file_name, base_scenario_id } = importDetails;

  /**
   * Nawigacja do scenariusza
   */
  const handleGoToScenario = () => {
    if (base_scenario_id) {
      window.location.href = `/scenarios/${base_scenario_id}`;
    }
  };

  /**
   * Nawigacja do dashboardu
   */
  const handleGoToDashboard = () => {
    window.location.href = "/";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
            <CheckCircle2 className="w-12 h-12 text-green-600" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-2xl text-green-600">Import zakończony pomyślnie!</CardTitle>
            <p className="text-muted-foreground mt-1">
              Twoje dane zostały zaimportowane i bazowy scenariusz został utworzony.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Podsumowanie importu */}
        <div className="rounded-md bg-muted/50 p-6 space-y-4">
          <h3 className="font-semibold text-lg">Szczegóły importu</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nazwa pliku</p>
              <p className="font-medium">{file_name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Kod zbioru danych</p>
              <p className="font-medium">{dataset_code}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Zaimportowane transakcje</p>
              <p className="font-medium text-primary text-xl">{inserted_transactions_count}</p>
            </div>

            {base_scenario_id && (
              <div>
                <p className="text-sm text-muted-foreground">ID scenariusza bazowego</p>
                <p className="font-medium">#{base_scenario_id}</p>
              </div>
            )}
          </div>
        </div>

        {/* Przyciski akcji */}
        <div className="space-y-3">
          <h3 className="font-semibold">Co chcesz zrobić dalej?</h3>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Główny przycisk - przejdź do scenariusza */}
            {base_scenario_id && (
              <Button onClick={handleGoToScenario} className="flex-1" size="lg">
                <ArrowRight className="w-4 h-4" />
                Przejdź do scenariusza
              </Button>
            )}

            {/* Drugorzędne przyciski */}
            <Button onClick={onStartNewImport} variant="outline" className="flex-1" size="lg">
              <Upload className="w-4 h-4" />
              Rozpocznij nowy import
            </Button>

            <Button onClick={handleGoToDashboard} variant="outline" className="flex-1" size="lg">
              <Home className="w-4 h-4" />
              Wróć do dashboardu
            </Button>
          </div>
        </div>

        {/* Informacja pomocnicza */}
        <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-foreground">
            💡 <strong>Wskazówka:</strong> W widoku scenariusza możesz analizować przepływy pieniężne, modyfikować daty
            i kwoty transakcji oraz eksportować wyniki do pliku Excel.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
